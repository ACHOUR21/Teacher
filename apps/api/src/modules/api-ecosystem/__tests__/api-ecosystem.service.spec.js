"use strict";

var _common = require("@nestjs/common");
var _testing = require("@nestjs/testing");
var _redis = require("../../cache/redis.service");
var _prisma = require("../../database/prisma.service");
var _apiEcosystem = require("../api-ecosystem.service");
/* eslint-disable @typescript-eslint/no-var-requires */

const mockPrisma = {
  apiKey: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  webhookEndpoint: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  user: {
    findFirst: jest.fn().mockResolvedValue(null)
  }
};
const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
};
describe('ApiEcosystemService', () => {
  let service;
  beforeEach(async () => {
    const module = await _testing.Test.createTestingModule({
      providers: [_apiEcosystem.ApiEcosystemService, {
        provide: _prisma.PrismaService,
        useValue: mockPrisma
      }, {
        provide: _redis.RedisService,
        useValue: mockCache
      }]
    }).compile();
    service = module.get(_apiEcosystem.ApiEcosystemService);
    jest.clearAllMocks();
  });
  describe('createApiKey', () => {
    it('should create an API key with hashed key and prefix', async () => {
      const stored = {
        id: 'key-1',
        name: 'Test Key',
        keyPrefix: 'eduai_',
        isActive: true
      };
      mockPrisma.apiKey.create.mockResolvedValueOnce(stored);
      mockCache.del.mockResolvedValue(undefined);
      const result = await service.createApiKey('tenant-1', 'Test Key', ['read:courses'], 1000);
      expect(result.rawKey).toMatch(/^eduai_/);
      expect(result.rawKey.length).toBeGreaterThan(12);
      expect(mockPrisma.apiKey.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          name: 'Test Key',
          scopes: ['read:courses']
        })
      }));
      expect(mockCache.del).toHaveBeenCalledWith('api-ecosystem:tenant-1:keys');
    });
  });
  describe('validateApiKey', () => {
    it('should return the API key record for a valid key', async () => {
      const rawKey = 'eduai_' + 'a'.repeat(48);
      const stored = {
        id: 'key-1',
        keyHash: require('crypto').createHash('sha256').update(rawKey).digest('hex'),
        isActive: true,
        expiresAt: null,
        tenant: {
          id: 'tenant-1'
        }
      };
      mockPrisma.apiKey.findUnique.mockResolvedValueOnce(stored);
      mockPrisma.apiKey.update.mockResolvedValueOnce({});
      const result = await service.validateApiKey(rawKey);
      expect(result.isActive).toBe(true);
    });
    it('should throw UnauthorizedException for invalid key', async () => {
      mockPrisma.apiKey.findUnique.mockResolvedValueOnce(null);
      await expect(service.validateApiKey('invalid-key')).rejects.toThrow(_common.UnauthorizedException);
    });
    it('should throw UnauthorizedException for expired key', async () => {
      const stored = {
        id: 'key-1',
        isActive: true,
        expiresAt: new Date('2020-01-01'),
        tenant: {}
      };
      mockPrisma.apiKey.findUnique.mockResolvedValueOnce(stored);
      await expect(service.validateApiKey('any-key')).rejects.toThrow(_common.UnauthorizedException);
    });
    it('should throw UnauthorizedException for deactivated key', async () => {
      const stored = {
        id: 'key-1',
        isActive: false,
        expiresAt: null,
        tenant: {}
      };
      mockPrisma.apiKey.findUnique.mockResolvedValueOnce(stored);
      await expect(service.validateApiKey('any-key')).rejects.toThrow(_common.UnauthorizedException);
    });
  });
  describe('listApiKeys', () => {
    it('should return API keys without raw key values', async () => {
      const keys = [{
        id: 'k-1',
        name: 'Key 1',
        keyPrefix: 'eduai_abc1',
        scopes: ['read:courses'],
        isActive: true
      }];
      mockCache.get.mockResolvedValueOnce(null);
      mockPrisma.apiKey.findMany.mockResolvedValueOnce(keys);
      mockCache.set.mockResolvedValue(undefined);
      const result = await service.listApiKeys('tenant-1');
      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('rawKey');
    });
    it('should return cached API keys on cache hit', async () => {
      const cached = [{
        id: 'k-1',
        name: 'Cached Key',
        keyPrefix: 'eduai_c',
        scopes: [],
        isActive: true
      }];
      mockCache.get.mockResolvedValueOnce(JSON.stringify(cached));
      const result = await service.listApiKeys('tenant-1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.apiKey.findMany).not.toHaveBeenCalled();
    });
  });
  describe('createWebhook', () => {
    it('should create a webhook endpoint with a secret', async () => {
      const webhook = {
        id: 'wh-1',
        url: 'https://example.com/hook',
        events: ['course.created'],
        secret: 'whsec_abc'
      };
      mockPrisma.webhookEndpoint.create.mockResolvedValueOnce(webhook);
      mockCache.del.mockResolvedValue(undefined);
      const result = await service.createWebhook('tenant-1', 'https://example.com/hook', ['course.created']);
      expect(result.url).toBe('https://example.com/hook');
      expect(mockPrisma.webhookEndpoint.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          secret: expect.stringMatching(/^whsec_/)
        })
      }));
      expect(mockCache.del).toHaveBeenCalledWith('api-ecosystem:tenant-1:webhooks');
    });
  });
  describe('revokeApiKey', () => {
    it('should deactivate an API key', async () => {
      mockPrisma.apiKey.update.mockResolvedValueOnce({
        id: 'k-1',
        isActive: false
      });
      mockCache.del.mockResolvedValue(undefined);
      await service.revokeApiKey('k-1', 'tenant-1');
      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith(expect.objectContaining({
        data: {
          isActive: false
        }
      }));
      expect(mockCache.del).toHaveBeenCalledWith('api-ecosystem:tenant-1:keys');
    });
  });
});