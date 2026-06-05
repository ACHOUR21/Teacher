import { Test, TestingModule } from '@nestjs/testing';
import { GamificationService } from '../gamification.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  achievement: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  userAchievement: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  userPoints: {
    upsert: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
};

describe('GamificationService', () => {
  let service: GamificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
    jest.clearAllMocks();
  });

  describe('awardPoints', () => {
    it('should upsert user points and return updated total', async () => {
      mockPrisma.userPoints.upsert.mockResolvedValueOnce({
        userId: 'user-1',
        total: 150,
        weekly: 50,
        monthly: 100,
      });

      const result = await service.awardPoints({
        tenantId: 'tenant-1',
        userId: 'user-1',
        points: 50,
        reason: 'LESSON_COMPLETED',
      });

      expect(mockPrisma.userPoints.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
      expect(result.total).toBe(150);
    });
  });

  describe('getLeaderboard', () => {
    it('should return sorted leaderboard with pagination', async () => {
      const mockLeaderboard = [
        { userId: 'user-1', total: 1000, user: { firstName: 'Alice', lastName: 'Smith' } },
        { userId: 'user-2', total: 850, user: { firstName: 'Bob', lastName: 'Jones' } },
        { userId: 'user-3', total: 700, user: { firstName: 'Carol', lastName: 'White' } },
      ];
      mockPrisma.userPoints.findMany.mockResolvedValueOnce(mockLeaderboard);

      const result = await service.getLeaderboard('tenant-1', { page: 1, limit: 10 });

      expect(result.items).toHaveLength(3);
      expect(result.items[0].total).toBeGreaterThanOrEqual(result.items[1].total);
    });
  });

  describe('checkAndAwardAchievements', () => {
    it('should award achievement when condition met and not already earned', async () => {
      const mockAchievements = [
        {
          id: 'ach-1',
          name: 'First Course',
          condition: 'COURSES_COMPLETED',
          threshold: 1,
          points: 100,
          badgeLevel: 'BRONZE',
        },
      ];

      mockPrisma.achievement.findMany.mockResolvedValueOnce(mockAchievements);
      mockPrisma.userAchievement.findUnique.mockResolvedValueOnce(null);
      mockPrisma.userAchievement.create.mockResolvedValueOnce({
        id: 'ua-1',
        userId: 'user-1',
        achievementId: 'ach-1',
        earnedAt: new Date(),
      });
      mockPrisma.userPoints.upsert.mockResolvedValueOnce({ total: 100, weekly: 100, monthly: 100 });

      const awarded = await service.checkAndAwardAchievements('tenant-1', 'user-1', {
        type: 'COURSES_COMPLETED',
        value: 1,
      });

      expect(awarded.length).toBeGreaterThan(0);
      expect(awarded[0].achievementId).toBe('ach-1');
    });

    it('should not re-award already earned achievement', async () => {
      mockPrisma.achievement.findMany.mockResolvedValueOnce([
        { id: 'ach-1', condition: 'COURSES_COMPLETED', threshold: 1 },
      ]);
      mockPrisma.userAchievement.findUnique.mockResolvedValueOnce({
        id: 'ua-existing',
        userId: 'user-1',
        achievementId: 'ach-1',
      });

      const awarded = await service.checkAndAwardAchievements('tenant-1', 'user-1', {
        type: 'COURSES_COMPLETED',
        value: 1,
      });

      expect(mockPrisma.userAchievement.create).not.toHaveBeenCalled();
    });
  });
});
