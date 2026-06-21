"use strict";

var _testing = require("@nestjs/testing");
var _resilience = require("../../core/services/resilience.service");
var _storage = require("../storage.service");
/* eslint-disable @typescript-eslint/no-var-requires */

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn()
}));
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.example.com/file')
}));
describe('StorageService', () => {
  let service;
  let s3SendMock;
  beforeEach(async () => {
    const {
      S3Client
    } = require('@aws-sdk/client-s3');
    s3SendMock = jest.fn().mockResolvedValue({});
    S3Client.mockImplementation(() => ({
      send: s3SendMock
    }));
    const mockResilience = {
      withRetry: jest.fn().mockImplementation((_name, fn) => fn()),
      withCircuitBreaker: jest.fn().mockImplementation((_name, fn) => fn()),
      withResilience: jest.fn().mockImplementation((_name, fn) => fn())
    };
    // Force S3 provider for these tests
    process.env['STORAGE_PROVIDER'] = 's3';
    process.env['S3_BUCKET'] = 'test-bucket';
    process.env['S3_ENDPOINT'] = 'http://localhost:9000';
    const module = await _testing.Test.createTestingModule({
      providers: [_storage.StorageService, {
        provide: _resilience.ResilienceService,
        useValue: mockResilience
      }]
    }).compile();
    service = module.get(_storage.StorageService);
    // Override the s3 client with our mock after module init
    service.s3 = {
      send: s3SendMock
    };
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
        size: 4
      };
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
      const {
        getSignedUrl
      } = require('@aws-sdk/s3-request-presigner');
      getSignedUrl.mockResolvedValueOnce('https://signed.example.com/dl');
      const url = await service.getSignedDownloadUrl('uploads/file.pdf');
      expect(url).toBe('https://signed.example.com/dl');
    });
  });
  describe('getPresignedUploadUrl', () => {
    it('should return uploadUrl, key, and publicUrl', async () => {
      const {
        getSignedUrl
      } = require('@aws-sdk/s3-request-presigner');
      getSignedUrl.mockResolvedValueOnce('https://signed.example.com/put');
      const result = await service.getPresignedUploadUrl('document.pdf', 'application/pdf', 'docs');
      expect(result.uploadUrl).toBe('https://signed.example.com/put');
      expect(result.key).toContain('docs/');
      expect(result.publicUrl).toContain(result.key);
    });
  });
});