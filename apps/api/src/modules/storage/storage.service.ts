import { randomUUID } from 'crypto';

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';

import { ResilienceService } from '../core/services/resilience.service';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(private readonly resilience: ResilienceService) {
    this.bucket = process.env.S3_BUCKET ?? 'eduai';
    this.endpoint = process.env.S3_ENDPOINT ?? 'http://localhost:9000';
    this.s3 = new S3Client({
      endpoint: this.endpoint,
      region: process.env.S3_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY ?? 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY ?? 'minioadmin',
      },
      forcePathStyle: true,
    });
  }

  private getKey(folder: string, filename: string): string {
    const ext = filename.split('.').pop();
    return `${folder}/${randomUUID()}.${ext}`;
  }

  async upload(file: Express.Multer.File, folder = 'uploads'): Promise<{ key: string; url: string }> {
    const key = this.getKey(folder, file.originalname);
    await this.resilience.withResilience(
      's3-upload',
      () => this.s3.send(new PutObjectCommand({
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
    await this.resilience.withResilience(
      's3-delete',
      () => this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })),
      undefined,
      { maxAttempts: 3, baseDelayMs: 500 },
    );
  }

  async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    return this.resilience.withResilience(
      's3-download',
      () => getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn }),
      () => { throw new NotFoundException(`File '${key}' is temporarily unavailable. Please try again shortly.`); },
      { maxAttempts: 3, baseDelayMs: 500 },
    );
  }

  async getPresignedUploadUrl(filename: string, contentType: string, folder = 'uploads'): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const key = this.getKey(folder, filename);
    const uploadUrl = await this.resilience.withResilience(
      's3-upload',
      () => getSignedUrl(this.s3, new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }), { expiresIn: 3600 }),
      () => { throw new ServiceUnavailableException('File upload service is temporarily unavailable. Please try again shortly.'); },
      { maxAttempts: 3, baseDelayMs: 500 },
    );
    const publicUrl = `${this.endpoint}/${this.bucket}/${key}`;
    return { uploadUrl, key, publicUrl };
  }
}
