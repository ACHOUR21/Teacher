import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor() {
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
    return `${folder}/${uuidv4()}.${ext}`;
  }

  async upload(file: Express.Multer.File, folder = 'uploads'): Promise<{ key: string; url: string }> {
    const key = this.getKey(folder, file.originalname);
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
    }));
    const url = `${this.endpoint}/${this.bucket}/${key}`;
    return { key, url };
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async getPresignedUploadUrl(filename: string, contentType: string, folder = 'uploads'): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const key = this.getKey(folder, filename);
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    const publicUrl = `${this.endpoint}/${this.bucket}/${key}`;
    return { uploadUrl, key, publicUrl };
  }
}
