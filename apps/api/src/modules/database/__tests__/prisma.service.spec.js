"use strict";

var _testing = require("@nestjs/testing");
var _prisma = require("../prisma.service");
// We need to mock PrismaClient as a proper class so that 'extends PrismaClient'
// works correctly — the PrismaService constructor calls this.$on, this.$connect, etc.
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockQueryRaw = jest.fn();
const mockExecuteRawUnsafe = jest.fn();
const mockOn = jest.fn();
jest.mock('@prisma/client', () => {
  class MockPrismaClient {
    $connect = mockConnect;
    $disconnect = mockDisconnect;
    $on = mockOn;
    $queryRaw = mockQueryRaw;
    $executeRawUnsafe = mockExecuteRawUnsafe;
    constructor(_opts) {}
  }
  return {
    PrismaClient: MockPrismaClient
  };
});
describe('PrismaService', () => {
  let service;
  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await _testing.Test.createTestingModule({
      providers: [_prisma.PrismaService]
    }).compile();
    service = module.get(_prisma.PrismaService);
  });
  describe('onModuleInit', () => {
    it('should connect to the database on init', async () => {
      mockConnect.mockResolvedValueOnce(undefined);
      await service.onModuleInit();
      expect(mockConnect).toHaveBeenCalled();
    });
    it('should rethrow connection errors', async () => {
      mockConnect.mockRejectedValueOnce(new Error('ECONNREFUSED'));
      await expect(service.onModuleInit()).rejects.toThrow('ECONNREFUSED');
    });
  });
  describe('onModuleDestroy', () => {
    it('should disconnect from the database on destroy', async () => {
      mockDisconnect.mockResolvedValueOnce(undefined);
      await service.onModuleDestroy();
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
  describe('cleanDatabase', () => {
    it('should truncate all public tables in test environment', async () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'test';
      mockQueryRaw.mockResolvedValueOnce([{
        tablename: 'user'
      }, {
        tablename: 'course'
      }, {
        tablename: '_prisma_migrations'
      }]);
      mockExecuteRawUnsafe.mockResolvedValue(undefined);
      await service.cleanDatabase();
      // Should truncate user and course but NOT _prisma_migrations
      expect(mockExecuteRawUnsafe).toHaveBeenCalledTimes(2);
      expect(mockExecuteRawUnsafe).toHaveBeenCalledWith('TRUNCATE TABLE "public"."user" CASCADE;');
      expect(mockExecuteRawUnsafe).toHaveBeenCalledWith('TRUNCATE TABLE "public"."course" CASCADE;');
      expect(mockExecuteRawUnsafe).not.toHaveBeenCalledWith(expect.stringContaining('_prisma_migrations'));
      process.env['NODE_ENV'] = originalEnv;
    });
    it('should throw an error when called outside test environment', async () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';
      await expect(service.cleanDatabase()).rejects.toThrow('cleanDatabase can only be called in test environment');
      process.env['NODE_ENV'] = originalEnv;
    });
  });
});