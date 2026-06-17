import { Test, type TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { GamificationService } from '../gamification.service';

const mockPrisma = {
  userPoints: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  userAchievement: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
  achievement: { findMany: jest.fn() },
  gamificationEvent: {
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
  courseProgress: { count: jest.fn() },
};

const mockNotifications = { notifyUser: jest.fn().mockResolvedValue(undefined) };

describe('GamificationService', () => {
  let service: GamificationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();
    service = module.get<GamificationService>(GamificationService);
  });

  describe('awardPoints', () => {
    it('should upsert user points and return updated total', async () => {
      mockPrisma.userPoints.upsert.mockResolvedValueOnce({ userId: 'user-1', total: 150 });
      const result = await service.awardPoints('user-1', 50);
      expect(mockPrisma.userPoints.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
      );
      expect(result.total).toBe(150);
    });
  });

  describe('processEvent', () => {
    beforeEach(() => {
      mockPrisma.gamificationEvent.count.mockResolvedValue(0);
      mockPrisma.userPoints.upsert.mockResolvedValue({ userId: 'u1', total: 10, level: 1 });
      mockPrisma.userPoints.findUnique.mockResolvedValue({
        userId: 'u1', total: 10, level: 1, streak: 0, longestStreak: 0, lastActivityDate: null,
      });
      mockPrisma.userPoints.update.mockResolvedValue({});
      mockPrisma.gamificationEvent.create.mockResolvedValue({});
      mockPrisma.userAchievement.findMany.mockResolvedValue([]);
      mockPrisma.achievement.findMany.mockResolvedValue([]);
    });

    it('awards XP for known event type', async () => {
      const result = await service.processEvent('u1', 'lesson_completed');
      expect(result.xpAwarded).toBe(10);
      expect(mockPrisma.gamificationEvent.create).toHaveBeenCalled();
    });

    it('returns 0 XP for unknown event type', async () => {
      const result = await service.processEvent('u1', 'unknown_event' as any);
      expect(result.xpAwarded).toBe(0);
    });

    it('skips once=true events already fired', async () => {
      mockPrisma.gamificationEvent.count.mockResolvedValue(1);
      const result = await service.processEvent('u1', 'first_lesson');
      expect(result.xpAwarded).toBe(0);
      expect(mockPrisma.gamificationEvent.create).not.toHaveBeenCalled();
    });

    it('respects daily cap', async () => {
      mockPrisma.gamificationEvent.count.mockResolvedValue(1);
      const result = await service.processEvent('u1', 'daily_login');
      expect(result.xpAwarded).toBe(0);
    });

    it('triggers level-up notification when level changes', async () => {
      // upsert returns total=100, findUnique returns level=1 (so calculateLevel(100)=2 differs)
      mockPrisma.userPoints.upsert.mockResolvedValue({ userId: 'u1', total: 100, level: 1 });
      mockPrisma.userPoints.findUnique.mockResolvedValue({
        userId: 'u1', total: 100, level: 1, streak: 0, longestStreak: 0, lastActivityDate: null,
      });
      const result = await service.processEvent('u1', 'course_completed');
      expect(result.newLevel).toBe(2);
      expect(mockNotifications.notifyUser).toHaveBeenCalledWith(
        'u1',
        expect.stringContaining('Level up'),
        expect.any(String),
        expect.any(Object),
      );
    });
  });

  describe('checkAndAwardAchievements', () => {
    it('should award achievement when points threshold met', async () => {
      mockPrisma.userPoints.findUnique.mockResolvedValue({ total: 500, streak: 0, level: 5 });
      mockPrisma.userAchievement.findMany.mockResolvedValue([]);
      mockPrisma.achievement.findMany.mockResolvedValue([
        { id: 'ach-1', name: 'First Course', criteria: { type: 'points', threshold: 500 } },
      ]);
      mockPrisma.userAchievement.create.mockResolvedValue({});

      const awarded = await service.checkAndAwardAchievements('user-1');
      expect(awarded.length).toBeGreaterThan(0);
      expect(awarded[0]).toBe('ach-1');
    });

    it('should not re-award already earned achievement', async () => {
      mockPrisma.userPoints.findUnique.mockResolvedValue({ total: 50 });
      mockPrisma.userAchievement.findMany.mockResolvedValue([{ achievementId: 'ach-1' }]);
      mockPrisma.achievement.findMany.mockResolvedValue([]);

      const awarded = await service.checkAndAwardAchievements('user-1');
      expect(mockPrisma.userAchievement.create).not.toHaveBeenCalled();
      expect(awarded).toHaveLength(0);
    });

    it('awards streak-based achievement when streak matches', async () => {
      mockPrisma.userPoints.findUnique.mockResolvedValue({ total: 50, streak: 7, level: 1 });
      mockPrisma.userAchievement.findMany.mockResolvedValue([]);
      mockPrisma.achievement.findMany.mockResolvedValue([
        { id: 'ach-2', name: 'Week Streak', criteria: { type: 'streak', threshold: 7 } },
      ]);
      mockPrisma.userAchievement.create.mockResolvedValue({});

      const awarded = await service.checkAndAwardAchievements('user-1');
      expect(awarded).toContain('ach-2');
    });
  });

  describe('getLeaderboard', () => {
    it('should return sorted leaderboard', async () => {
      const mockLeaderboard = [
        { userId: 'user-1', total: 1000, user: { firstName: 'Alice', lastName: 'Smith' } },
        { userId: 'user-2', total: 850, user: { firstName: 'Bob', lastName: 'Jones' } },
      ];
      mockPrisma.userPoints.findMany.mockResolvedValueOnce(mockLeaderboard);

      const result = await service.getLeaderboard('tenant-1', 10);
      expect(result).toHaveLength(2);
      expect(result[0].total).toBeGreaterThanOrEqual(result[1].total);
    });
  });

  describe('getMyStats', () => {
    it('returns weekly XP and streak from database', async () => {
      mockPrisma.userPoints.findUnique.mockResolvedValue({
        total: 300, level: 3, streak: 5, longestStreak: 10,
      });
      mockPrisma.userAchievement.count.mockResolvedValue(4);
      mockPrisma.userPoints.count.mockResolvedValue(2);
      mockPrisma.gamificationEvent.aggregate.mockResolvedValue({ _sum: { xpAwarded: 75 } });

      const stats = await service.getMyStats('u1', 't1');
      expect(stats.weeklyPoints).toBe(75);
      expect(stats.streak).toBe(5);
      expect(stats.rank).toBe(3);
      expect(stats.xpProgress).toBeDefined();
    });
  });
});
