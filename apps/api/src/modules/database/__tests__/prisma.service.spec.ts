import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $on: jest.fn(),
    $queryRaw: jest.fn(),
    $executeRawUnsafe: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

describe('PrismaService', () => {
  let service: PrismaService;
  let prismaClientMock: {
    $connect: jest.Mock;
    $disconnect: jest.Mock;
    $on: jest.Mock;
    $queryRaw: jest.Mock;
    $executeRawUnsafe: jest.Mock;
  };

  beforeEach(async () => {
    const { PrismaClient } = require('@prisma/client');
    prismaClientMock = new PrismaClient();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);

    // Bind mock methods onto the service instance
    (service as any).$connect = prismaClientMock.$connect;
    (service as any).$disconnect = prismaClientMock.$disconnect;
    (service as any).$queryRaw = prismaClientMock.$queryRaw;
    (service as any).$executeRawUnsafe = prismaClientMock.$executeRawUnsafe;

    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should connect to the database on init', async () => {
      prismaClientMock.$connect.mockResolvedValueOnce(undefined);

      await service.onModuleInit();

      expect(prismaClientMock.$connect).toHaveBeenCalled();
    });

    it('should rethrow connection errors', async () => {
      prismaClientMock.$connect.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(service.onModuleInit()).rejects.toThrow('ECONNREFUSED');
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from the database on destroy', async () => {
      prismaClientMock.$disconnect.mockResolvedValueOnce(undefined);

      await service.onModuleDestroy();

      expect(prismaClientMock.$disconnect).toHaveBeenCalled();
    });
  });

  describe('cleanDatabase', () => {
    it('should truncate all public tables in test environment', async () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'test';

      prismaClientMock.$queryRaw.mockResolvedValueOnce([
        { tablename: 'user' },
        { tablename: 'course' },
        { tablename: '_prisma_migrations' },
      ]);
      prismaClientMock.$executeRawUnsafe.mockResolvedValue(undefined);

      await service.cleanDatabase();

      // Should truncate user and course but NOT _prisma_migrations
      expect(prismaClientMock.$executeRawUnsafe).toHaveBeenCalledTimes(2);
      expect(prismaClientMock.$executeRawUnsafe).toHaveBeenCalledWith(
        'TRUNCATE TABLE "public"."user" CASCADE;',
      );
      expect(prismaClientMock.$executeRawUnsafe).toHaveBeenCalledWith(
        'TRUNCATE TABLE "public"."course" CASCADE;',
      );
      expect(prismaClientMock.$executeRawUnsafe).not.toHaveBeenCalledWith(
        expect.stringContaining('_prisma_migrations'),
      );

      process.env['NODE_ENV'] = originalEnv;
    });

    it('should throw an error when called outside test environment', async () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';

      await expect(service.cleanDatabase()).rejects.toThrow(
        'cleanDatabase can only be called in test environment',
      );

      process.env['NODE_ENV'] = originalEnv;
    });
  });
});
