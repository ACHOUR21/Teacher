import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ConsentType } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { GdprService } from '../gdpr.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  userConsent: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  userProfile: {
    updateMany: jest.fn(),
  },
  userSession: {
    deleteMany: jest.fn(),
  },
  userDevice: {
    deleteMany: jest.fn(),
  },
  dataDeletionRequest: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
};

describe('GdprService', () => {
  let service: GdprService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GdprService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GdprService>(GdprService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── exportUserData ───────────────────────────────────────────────────────

  describe('exportUserData', () => {
    it('should return a structured export without sensitive fields', async () => {
      const user = {
        id: 'user-1',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Smith',
        passwordHash: 'secret-hash',
        mfaSecret: 'totp-secret',
        mfaBackupCodes: ['code1', 'code2'],
        profile: { bio: 'Hello' },
        sessions: [],
        devices: [],
        consents: [],
        issuedCertificates: [],
        examAttempts: [],
        flashcardReviews: [],
        auditLogs: [],
      };
      mockPrisma.user.findUnique.mockResolvedValueOnce(user);

      const result = await service.exportUserData('user-1');

      expect(result.exportedAt).toBeDefined();
      expect(result.schema).toBe('1.0');
      // Sensitive fields must be stripped
      expect((result.data as any).passwordHash).toBeUndefined();
      expect((result.data as any).mfaSecret).toBeUndefined();
      expect((result.data as any).mfaBackupCodes).toBeUndefined();
      // Safe fields should be present
      expect((result.data as any).email).toBe('alice@example.com');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.exportUserData('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── upsertConsents ───────────────────────────────────────────────────────

  describe('upsertConsents', () => {
    it('should create new consent records', async () => {
      mockPrisma.userConsent.upsert.mockResolvedValue({});

      await service.upsertConsents(
        'user-1',
        'tenant-1',
        [{ type: ConsentType.MARKETING, granted: true }],
        { ipAddress: '127.0.0.1', userAgent: 'Mozilla/5.0' },
      );

      expect(mockPrisma.userConsent.upsert).toHaveBeenCalledTimes(1);
      expect(mockPrisma.userConsent.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_type: { userId: 'user-1', type: ConsentType.MARKETING } },
          create: expect.objectContaining({
            userId: 'user-1',
            tenantId: 'tenant-1',
            type: ConsentType.MARKETING,
            granted: true,
          }),
        }),
      );
    });

    it('should update existing consent to revoked', async () => {
      mockPrisma.userConsent.upsert.mockResolvedValue({});

      await service.upsertConsents(
        'user-1',
        'tenant-1',
        [{ type: ConsentType.ANALYTICS, granted: false, version: '2.0' }],
        {},
      );

      expect(mockPrisma.userConsent.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            granted: false,
            version: '2.0',
            revokedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should handle multiple consent types in a single call', async () => {
      mockPrisma.userConsent.upsert.mockResolvedValue({});

      await service.upsertConsents(
        'user-1',
        'tenant-1',
        [
          { type: ConsentType.MARKETING, granted: true },
          { type: ConsentType.ANALYTICS, granted: false },
        ],
        {},
      );

      expect(mockPrisma.userConsent.upsert).toHaveBeenCalledTimes(2);
    });
  });

  // ─── requestDeletion ─────────────────────────────────────────────────────

  describe('requestDeletion', () => {
    it('should schedule deletion and disable the user account', async () => {
      mockPrisma.dataDeletionRequest.findUnique.mockResolvedValueOnce(null);
      mockPrisma.dataDeletionRequest.upsert.mockResolvedValueOnce({
        id: 'req-1',
        userId: 'user-1',
        status: 'PENDING',
        scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      mockPrisma.user.update.mockResolvedValueOnce({});

      const result = await service.requestDeletion('user-1', 'tenant-1', 'No longer needed');

      expect(result.graceDays).toBe(30);
      expect(result.scheduledFor).toBeInstanceOf(Date);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: false } }),
      );
    });

    it('should return existing request when a pending request already exists', async () => {
      const existingRequest = { id: 'req-1', status: 'PENDING' };
      mockPrisma.dataDeletionRequest.findUnique.mockResolvedValueOnce(existingRequest);

      const result = await service.requestDeletion('user-1', 'tenant-1');

      expect(result).toEqual(existingRequest);
      expect(mockPrisma.dataDeletionRequest.upsert).not.toHaveBeenCalled();
    });

    it('should allow re-requesting deletion when previous request was cancelled', async () => {
      mockPrisma.dataDeletionRequest.findUnique.mockResolvedValueOnce({
        id: 'req-1',
        status: 'CANCELLED',
      });
      mockPrisma.dataDeletionRequest.upsert.mockResolvedValueOnce({
        id: 'req-2',
        status: 'PENDING',
        scheduledFor: new Date(),
      });
      mockPrisma.user.update.mockResolvedValueOnce({});

      const result = await service.requestDeletion('user-1', 'tenant-1');

      expect(result.graceDays).toBe(30);
      expect(mockPrisma.dataDeletionRequest.upsert).toHaveBeenCalled();
    });
  });

  // ─── cancelDeletion ───────────────────────────────────────────────────────

  describe('cancelDeletion', () => {
    it('should cancel a pending deletion request and re-enable the user', async () => {
      mockPrisma.dataDeletionRequest.findUnique.mockResolvedValueOnce({
        id: 'req-1',
        userId: 'user-1',
        status: 'PENDING',
      });
      mockPrisma.dataDeletionRequest.update.mockResolvedValueOnce({});
      mockPrisma.user.update.mockResolvedValueOnce({});

      await service.cancelDeletion('user-1');

      expect(mockPrisma.dataDeletionRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'CANCELLED' } }),
      );
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isActive: true } }),
      );
    });

    it('should throw BadRequestException when no pending request exists', async () => {
      mockPrisma.dataDeletionRequest.findUnique.mockResolvedValueOnce(null);

      await expect(service.cancelDeletion('user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when deletion is already completed', async () => {
      mockPrisma.dataDeletionRequest.findUnique.mockResolvedValueOnce({
        id: 'req-1',
        status: 'COMPLETED',
      });

      await expect(service.cancelDeletion('user-1')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── getDeletionRequest ───────────────────────────────────────────────────

  describe('getDeletionRequest', () => {
    it('should return the deletion request for a user', async () => {
      const request = { id: 'req-1', userId: 'user-1', status: 'PENDING', scheduledFor: new Date() };
      mockPrisma.dataDeletionRequest.findUnique.mockResolvedValueOnce(request);

      const result = await service.getDeletionRequest('user-1');

      expect(result).toEqual(request);
    });

    it('should return null when no deletion request exists', async () => {
      mockPrisma.dataDeletionRequest.findUnique.mockResolvedValueOnce(null);

      const result = await service.getDeletionRequest('user-1');

      expect(result).toBeNull();
    });
  });
});
