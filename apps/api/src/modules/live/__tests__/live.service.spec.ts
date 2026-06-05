import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { LiveService } from '../live.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  liveSession: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  liveParticipant: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn((cb: any) => cb(mockPrisma)),
};

describe('LiveService', () => {
  let service: LiveService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LiveService>(LiveService);
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a new live session', async () => {
      const mockSession = {
        id: 'session-1',
        title: 'Math Live Class',
        status: 'SCHEDULED',
        teacherId: 'teacher-1',
        scheduledAt: new Date(Date.now() + 3600000),
        maxParticipants: 30,
        teacher: { user: { firstName: 'Jane', lastName: 'Smith', avatarUrl: null } },
      };
      mockPrisma.liveSession.create.mockResolvedValueOnce(mockSession);

      const result = await service.createSession('teacher-1', {
        title: 'Math Live Class',
        scheduledAt: new Date(Date.now() + 3600000),
        maxParticipants: 30,
      });

      expect(result.title).toBe('Math Live Class');
      expect(result.status).toBe('SCHEDULED');
    });
  });

  describe('startSession', () => {
    it('should transition session from SCHEDULED to LIVE', async () => {
      const mockSession = {
        id: 'session-1',
        status: 'SCHEDULED',
        teacherId: 'teacher-1',
      };
      mockPrisma.liveSession.findUnique.mockResolvedValueOnce(mockSession);
      mockPrisma.liveSession.update.mockResolvedValueOnce({ ...mockSession, status: 'LIVE', startedAt: new Date() });

      const result = await service.startSession('session-1', 'teacher-1');

      expect(result.status).toBe('LIVE');
      expect(mockPrisma.liveSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'LIVE' }),
        }),
      );
    });

    it('should throw BadRequestException if not the session teacher', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValueOnce({
        id: 'session-1',
        status: 'SCHEDULED',
        teacherId: 'other-teacher',
      });

      await expect(
        service.startSession('session-1', 'teacher-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent session', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.startSession('session-x', 'teacher-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('joinSession', () => {
    it('should create participant record for new joiner', async () => {
      const mockSession = {
        id: 'session-1',
        status: 'SCHEDULED',
        teacherId: 'teacher-1',
      };
      mockPrisma.liveSession.findUnique.mockResolvedValueOnce(mockSession);
      mockPrisma.liveParticipant.findFirst.mockResolvedValueOnce(null);
      mockPrisma.liveParticipant.create.mockResolvedValueOnce({
        id: 'part-1',
        userId: 'user-1',
        sessionId: 'session-1',
        joinedAt: new Date(),
        role: 'student',
      });

      const result = await service.joinSession('session-1', 'user-1');

      expect(result).toHaveProperty('id');
      expect(result.userId).toBe('user-1');
    });
  });

  describe('endSession', () => {
    it('should transition session to ENDED', async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValueOnce({
        id: 'session-1',
        status: 'LIVE',
        teacherId: 'teacher-1',
      });
      mockPrisma.liveSession.update.mockResolvedValueOnce({ id: 'session-1', status: 'ENDED' });

      const result = await service.endSession('session-1', 'teacher-1');

      expect(result.status).toBe('ENDED');
    });
  });
});
