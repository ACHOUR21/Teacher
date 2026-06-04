import { Test, TestingModule } from '@nestjs/testing';
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

jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

describe('StorageService', () => {
  let service: StorageService;
  let s3SendMock: jest.Mock;

  beforeEach(async () => {
    const { S3Client } = require('@aws-sdk/client-s3');
    s3SendMock = jest.fn().mockResolvedValue({});
    S3Client.mockImplementation(() => ({ send: s3SendMock }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
    jest.clearAllMocks();

    // Re-assign the mock after module init since constructor runs during compile
    (service as any).s3 = { send: s3SendMock };
  });

  describe('upload', () => {
    it('should upload a file and return key and url', async () => {
      s3SendMock.mockResolvedValueOnce({});

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
    });
  });

  describe('delete', () => {
    it('should send DeleteObjectCommand', async () => {
      s3SendMock.mockResolvedValueOnce({});

      await service.delete('uploads/mock-uuid.jpg');

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
