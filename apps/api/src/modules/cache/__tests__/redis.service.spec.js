"use strict";

var _config = require("@nestjs/config");
var _testing = require("@nestjs/testing");
var _redis = require("../redis.service");
/* eslint-disable @typescript-eslint/no-var-requires */

jest.mock('ioredis', () => {
  const mockClient = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    exists: jest.fn(),
    connect: jest.fn(),
    quit: jest.fn(),
    on: jest.fn()
  };
  return {
    __esModule: true,
    default: jest.fn(() => mockClient)
  };
});
describe('RedisService', () => {
  let service;
  let redisClient;
  beforeEach(async () => {
    const Redis = require('ioredis').default;
    redisClient = Redis();
    const module = await _testing.Test.createTestingModule({
      providers: [_redis.RedisService, {
        provide: _config.ConfigService,
        useValue: {
          get: jest.fn().mockReturnValue(undefined)
        }
      }]
    }).compile();
    service = module.get(_redis.RedisService);
    jest.clearAllMocks();
  });
  describe('get', () => {
    it('should return the value for an existing key', async () => {
      redisClient.get.mockResolvedValueOnce('cached-value');
      const result = await service.get('my-key');
      expect(result).toBe('cached-value');
    });
    it('should return null on Redis error', async () => {
      redisClient.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      const result = await service.get('my-key');
      expect(result).toBeNull();
    });
  });
  describe('set', () => {
    it('should set key with TTL when provided', async () => {
      redisClient.set.mockResolvedValueOnce('OK');
      await service.set('my-key', 'value', 300);
      expect(redisClient.set).toHaveBeenCalledWith('my-key', 'value', 'EX', 300);
    });
    it('should set key without TTL when omitted', async () => {
      redisClient.set.mockResolvedValueOnce('OK');
      await service.set('my-key', 'value');
      expect(redisClient.set).toHaveBeenCalledWith('my-key', 'value');
    });
    it('should not throw on Redis error', async () => {
      redisClient.set.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      await expect(service.set('my-key', 'value')).resolves.not.toThrow();
    });
  });
  describe('del', () => {
    it('should delete a key', async () => {
      redisClient.del.mockResolvedValueOnce(1);
      await service.del('my-key');
      expect(redisClient.del).toHaveBeenCalledWith('my-key');
    });
  });
  describe('getObject', () => {
    it('should deserialize a stored JSON object', async () => {
      redisClient.get.mockResolvedValueOnce(JSON.stringify({
        name: 'Alice',
        age: 30
      }));
      const result = await service.getObject('user:1');
      expect(result).toEqual({
        name: 'Alice',
        age: 30
      });
    });
    it('should return null for missing key', async () => {
      redisClient.get.mockResolvedValueOnce(null);
      const result = await service.getObject('missing-key');
      expect(result).toBeNull();
    });
    it('should return null for invalid JSON', async () => {
      redisClient.get.mockResolvedValueOnce('not-json{{{');
      const result = await service.getObject('bad-key');
      expect(result).toBeNull();
    });
  });
  describe('setObject', () => {
    it('should serialize and store an object', async () => {
      redisClient.set.mockResolvedValueOnce('OK');
      await service.setObject('user:1', {
        name: 'Alice'
      }, 60);
      expect(redisClient.set).toHaveBeenCalledWith('user:1', JSON.stringify({
        name: 'Alice'
      }), 'EX', 60);
    });
  });
  describe('delPattern', () => {
    it('should delete all keys matching a pattern', async () => {
      redisClient.keys.mockResolvedValueOnce(['tenant:1:stats', 'tenant:1:full']);
      redisClient.del.mockResolvedValueOnce(2);
      await service.delPattern('tenant:1*');
      expect(redisClient.del).toHaveBeenCalledWith('tenant:1:stats', 'tenant:1:full');
    });
    it('should not call del when no keys match', async () => {
      redisClient.keys.mockResolvedValueOnce([]);
      await service.delPattern('no-match*');
      expect(redisClient.del).not.toHaveBeenCalled();
    });
  });
  describe('incr', () => {
    it('should increment and return the new value', async () => {
      redisClient.incr.mockResolvedValueOnce(5);
      const result = await service.incr('counter');
      expect(result).toBe(5);
    });
    it('should return 0 on error', async () => {
      redisClient.incr.mockRejectedValueOnce(new Error('err'));
      const result = await service.incr('counter');
      expect(result).toBe(0);
    });
  });
  describe('exists', () => {
    it('should return true when key exists', async () => {
      redisClient.exists.mockResolvedValueOnce(1);
      const result = await service.exists('some-key');
      expect(result).toBe(true);
    });
    it('should return false when key does not exist', async () => {
      redisClient.exists.mockResolvedValueOnce(0);
      const result = await service.exists('missing-key');
      expect(result).toBe(false);
    });
    it('should return false on error', async () => {
      redisClient.exists.mockRejectedValueOnce(new Error('err'));
      const result = await service.exists('any-key');
      expect(result).toBe(false);
    });
  });
});