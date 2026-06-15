/* eslint-disable @typescript-eslint/no-var-requires */
import { Test, type TestingModule } from '@nestjs/testing';

import { ResilienceService } from '../../core/services/resilience.service';
import { StorageService } from '../storage.service';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.example.com/file'),
}));

describe('StorageService', () => {
  let service: StorageService;
  let s3SendMock: jest.Mock;

  beforeEach(async () => {
    const { S3Client } = require('@aws-sdk/client-s3');
    s3SendMock = jest.fn().mockResolvedValue({});
    S3Client.mockImplementation(() => ({ send: s3SendMock }));

    const mockResilience = {
      withRetry: jest.fn().mockImplementation((_name: string, fn: () => Promise<unknown>) => fn()),
      withCircuitBreaker: jest.fn().mockImplementation((_name: string, fn: () => Promise<unknown>) => fn()),
      withResilience: jest.fn().mockImplementation((_name: string, fn: () => Promise<unknown>) => fn()),
    };

    // Force S3 provider for these tests
    process.env['STORAGE_PROVIDER'] = 's3';
    process.env['S3_BUCKET'] = 'test-bucket';
    process.env['S3_ENDPOINT'] = 'http://localhost:9000';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ResilienceService, useValue: mockResilience },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);

    // Override the s3 client with our mock after module init
    (service as any).s3 = { send: s3SendMock };

    jest.clearAllMocks();
    s3SendMock.mockResolvedValue({});
  });

  afterEach(() => {
    delete process.env['STORAGE_PROVIDER'];
    delete process.env['S3_BUCKET'];
    delete process.env['S3_ENDPOINT'];
  });

  describe('upload', () => {
    it('should upload a file and return key and url', async () => {
      const file = {
        originalname: 'photo.jpg',
        buffer: Buffer.from('data'),
        mimetype: 'image/jpeg',
        size: 4,
      } as Express.Multer.File;

      const result = await service.upload(file, 'avatars');

      expect(result.key).toContain('avatars/');
      expect(result.key).toContain('.jpg');
      expect(result.url).toContain(result.key);
      expect(s3SendMock).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should send DeleteObjectCommand', async () => {
      await service.delete('uploads/mock-file.jpg');

      expect(s3SendMock).toHaveBeenCalled();
    });
  });

  describe('getSignedDownloadUrl', () => {
    it('should return a presigned URL for download', async () => {
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      (getSignedUrl as jest.Mock).mockResolvedValueOnce('https://signed.example.com/dl');

      const url = await service.getSignedDownloadUrl('uploads/file.pdf');

      expect(url).toBe('https://signed.example.com/dl');
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('should return uploadUrl, key, and publicUrl', async () => {
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
      (getSignedUrl as jest.Mock).mockResolvedValueOnce('https://signed.example.com/put');

      const result = await service.getPresignedUploadUrl('document.pdf', 'application/pdf', 'docs');

      expect(result.uploadUrl).toBe('https://signed.example.com/put');
      expect(result.key).toContain('docs/');
      expect(result.publicUrl).toContain(result.key);
    });
  });
});
