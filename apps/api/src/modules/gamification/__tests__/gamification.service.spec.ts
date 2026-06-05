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
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  courseProgress: {
    count: jest.fn(),
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
      });

      const result = await service.awardPoints('user-1', 50);

      expect(mockPrisma.userPoints.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
      expect(result.total).toBe(150);
    });
  });

  describe('getLeaderboard', () => {
    it('should return sorted leaderboard', async () => {
      const mockLeaderboard = [
        { userId: 'user-1', total: 1000, user: { firstName: 'Alice', lastName: 'Smith' } },
        { userId: 'user-2', total: 850, user: { firstName: 'Bob', lastName: 'Jones' } },
        { userId: 'user-3', total: 700, user: { firstName: 'Carol', lastName: 'White' } },
      ];
      mockPrisma.userPoints.findMany.mockResolvedValueOnce(mockLeaderboard);

      const result = await service.getLeaderboard('tenant-1', 10);

      expect(result).toHaveLength(3);
      expect(result[0].total).toBeGreaterThanOrEqual(result[1].total);
    });
  });

  describe('checkAndAwardAchievements', () => {
    it('should award achievement when condition met and not already earned', async () => {
      const mockAchievements = [
        {
          id: 'ach-1',
          name: 'First Course',
          criteria: { type: 'points', threshold: 10 },
          points: 100,
        },
      ];

      // findUnique for userPoints, then findMany for earned achievements, then findMany for all achievements
      mockPrisma.userPoints.findUnique.mockResolvedValueOnce({ userId: 'user-1', total: 50 });
      mockPrisma.userAchievement.findMany.mockResolvedValueOnce([]);
      mockPrisma.achievement.findMany.mockResolvedValueOnce(mockAchievements);
      mockPrisma.userAchievement.create.mockResolvedValueOnce({
        id: 'ua-1',
        userId: 'user-1',
        achievementId: 'ach-1',
        earnedAt: new Date(),
      });

      const awarded = await service.checkAndAwardAchievements('user-1');

      expect(awarded.length).toBeGreaterThan(0);
      expect(awarded[0]).toBe('ach-1');
    });

    it('should not re-award already earned achievement', async () => {
      mockPrisma.userPoints.findUnique.mockResolvedValueOnce({ userId: 'user-1', total: 50 });
      mockPrisma.userAchievement.findMany.mockResolvedValueOnce([
        { achievementId: 'ach-1' },
      ]);
      // All achievements are already earned so findMany for all will get empty (notIn filter)
      mockPrisma.achievement.findMany.mockResolvedValueOnce([]);

      const awarded = await service.checkAndAwardAchievements('user-1');

      expect(mockPrisma.userAchievement.create).not.toHaveBeenCalled();
      expect(awarded).toHaveLength(0);
    });
  });
});
