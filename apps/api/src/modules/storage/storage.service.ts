import { createReadStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { extname } from 'path';

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';

import { ResilienceService } from '../core/services/resilience.service';

export type StorageProvider = 'local' | 's3';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider: StorageProvider;
  private readonly uploadDir: string;

  // S3-specific (only initialised when provider === 's3')
  private readonly s3: S3Client | null = null;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(private readonly resilience: ResilienceService) {
    this.provider = (process.env['STORAGE_PROVIDER'] ?? 'local') as StorageProvider;
    this.uploadDir = process.env['UPLOAD_DIR'] ?? join(process.cwd(), 'uploads');
    this.bucket = process.env['S3_BUCKET'] ?? 'eduai';
    this.endpoint = process.env['S3_ENDPOINT'] ?? 'http://localhost:9000';

    if (this.provider === 's3') {
      this.s3 = new S3Client({
        endpoint: this.endpoint,
        region: process.env['S3_REGION'] ?? 'us-east-1',
        credentials: {
          accessKeyId: process.env['S3_ACCESS_KEY'] ?? 'minioadmin',
          secretAccessKey: process.env['S3_SECRET_KEY'] ?? 'minioadmin',
        },
        forcePathStyle: true,
      });
      this.logger.log('StorageService: using S3/MinIO storage');
    } else {
      // Ensure local upload directory exists
      if (!existsSync(this.uploadDir)) {
        mkdirSync(this.uploadDir, { recursive: true });
      }
      this.logger.log(`StorageService: using local disk storage at ${this.uploadDir}`);
    }
  }

  getProvider(): StorageProvider {
    return this.provider;
  }

  getLocalUrl(filename: string): string {
    const baseUrl = process.env['API_BASE_URL'] ?? 'http://localhost:3001';
    return `${baseUrl}/uploads/${filename}`;
  }

  private getKey(folder: string, originalname: string): string {
    const ext = extname(originalname).toLowerCase();
    return `${folder}/${randomUUID()}${ext}`;
  }

  /**
   * Upload a file. Supports both memory-buffered (S3) and disk-stored (local) multer files.
   * For local provider, `file.path` (set by diskStorage) is used; for S3, `file.buffer` is used.
   */
  async upload(file: Express.Multer.File, folder = 'uploads'): Promise<{ key: string; url: string }> {
    if (this.provider === 'local') {
      return this.uploadLocal(file, folder);
    }
    return this.uploadS3(file, folder);
  }

  private async uploadLocal(file: Express.Multer.File, folder: string): Promise<{ key: string; url: string }> {
    // When using diskStorage, multer writes the file and sets file.filename + file.path
    // When using memoryStorage (fallback), we write manually
    if (file.path && file.filename) {
      // Already on disk thanks to diskStorage — just build the URL
      const url = this.getLocalUrl(file.filename);
      return { key: file.filename, url };
    }

    // Fallback: write buffer to disk manually
    const { writeFile } = await import('fs/promises');
    const ext = extname(file.originalname).toLowerCase() || '.bin';
    const filename = `${Date.now()}-${randomUUID()}${ext}`;
    const destPath = join(this.uploadDir, filename);
    await writeFile(destPath, file.buffer);
    const url = this.getLocalUrl(filename);
    return { key: filename, url };
  }

  private async uploadS3(file: Express.Multer.File, folder: string): Promise<{ key: string; url: string }> {
    const key = this.getKey(folder, file.originalname);
    await this.resilience.withResilience(
      's3-upload',
      () => this.s3!.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      })),
      () => { throw new ServiceUnavailableException('File upload service is temporarily unavailable. Please try again shortly.'); },
      { maxAttempts: 3, baseDelayMs: 500 },
    );
    const url = `${this.endpoint}/${this.bucket}/${key}`;
    return { key, url };
  }

  async delete(key: string): Promise<void> {
    if (this.provider === 'local') {
      const { unlink } = await import('fs/promises');
      const filePath = join(this.uploadDir, key);
      try {
        await unlink(filePath);
      } catch {
        this.logger.warn(`Local delete: file not found at ${filePath}`);
      }
      return;
    }

    await this.resilience.withResilience(
      's3-delete',
      () => this.s3!.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })),
      undefined,
      { maxAttempts: 3, baseDelayMs: 500 },
    );
  }

  async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    if (this.provider === 'local') {
      // For local storage, just return the public URL (no signing needed)
      return this.getLocalUrl(key);
    }
    return this.resilience.withResilience(
      's3-download',
      () => getSignedUrl(this.s3!, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn }),
      () => { throw new NotFoundException(`File '${key}' is temporarily unavailable. Please try again shortly.`); },
      { maxAttempts: 3, baseDelayMs: 500 },
    );
  }

  async getPresignedUploadUrl(filename: string, contentType: string, folder = 'uploads'): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    if (this.provider === 'local') {
      // For local storage, return a marker URL that tells the frontend to POST multipart instead
      const ext = extname(filename).toLowerCase() || '.bin';
      const key = `${Date.now()}-${randomUUID()}${ext}`;
      const baseUrl = process.env['API_BASE_URL'] ?? 'http://localhost:3001';
      // uploadUrl points to our own upload endpoint; publicUrl is where it will be served
      return {
        uploadUrl: `${baseUrl}/api/v1/storage/upload-local?key=${encodeURIComponent(key)}&folder=${encodeURIComponent(folder)}`,
        key,
        publicUrl: this.getLocalUrl(key),
      };
    }

    const key = this.getKey(folder, filename);
    const uploadUrl = await this.resilience.withResilience(
      's3-upload',
      () => getSignedUrl(this.s3!, new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }), { expiresIn: 3600 }),
      () => { throw new ServiceUnavailableException('File upload service is temporarily unavailable. Please try again shortly.'); },
      { maxAttempts: 3, baseDelayMs: 500 },
    );
    const publicUrl = `${this.endpoint}/${this.bucket}/${key}`;
    return { uploadUrl, key, publicUrl };
  }
}
