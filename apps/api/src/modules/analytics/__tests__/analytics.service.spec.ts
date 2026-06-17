import { Test, type TestingModule } from '@nestjs/testing';

import { RedisService } from '../../cache/redis.service';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsService } from '../analytics.service';

const mockPrisma = {
  user: { count: jest.fn() },
  course: { findMany: jest.fn(), count: jest.fn() },
  liveSession: { count: jest.fn() },
  invoice: { aggregate: jest.fn(), findMany: jest.fn() },
  courseProgress: { count: jest.fn() },
  submission: { count: jest.fn() },
  aIUsage: { groupBy: jest.fn() },
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    jest.clearAllMocks();
  });

  describe('getPlatformStats', () => {
    it('should return cached stats when available', async () => {
      const cached = { totalUsers: 100, totalCourses: 20, activeSessions: 5, totalRevenue: 9999 };
      mockCache.get.mockResolvedValueOnce(JSON.stringify(cached));

      const result = await service.getPlatformStats('tenant-1');

      expect(result).toEqual(cached);
      expect(mockPrisma.user.count).not.toHaveBeenCalled();
    });

    it('should compute and cache stats when cache miss', async () => {
      mockCache.get.mockResolvedValueOnce(null);
      mockPrisma.user.count.mockResolvedValueOnce(150);
      mockPrisma.course.count.mockResolvedValueOnce(30);
      mockPrisma.liveSession.count.mockResolvedValueOnce(4);
      mockPrisma.invoice.aggregate.mockResolvedValueOnce({ _sum: { amount: 12000 } });

      const result = await service.getPlatformStats('tenant-1');

      expect(result.totalUsers).toBe(150);
      expect(result.totalCourses).toBe(30);
      expect(result.activeSessions).toBe(4);
      expect(result.totalRevenue).toBe(12000);
      expect(mockCache.set).toHaveBeenCalled();
    });

    it('should default totalRevenue to 0 when no invoices', async () => {
      mockCache.get.mockResolvedValueOnce(null);
      mockPrisma.user.count.mockResolvedValueOnce(0);
      mockPrisma.course.count.mockResolvedValueOnce(0);
      mockPrisma.liveSession.count.mockResolvedValueOnce(0);
      mockPrisma.invoice.aggregate.mockResolvedValueOnce({ _sum: { amount: null } });

      const result = await service.getPlatformStats('tenant-1');

      expect(result.totalRevenue).toBe(0);
    });
  });

  describe('getUserGrowth', () => {
    it('should group user signups by day', async () => {
      const users = [
        { createdAt: new Date('2025-01-10T00:00:00Z') },
        { createdAt: new Date('2025-01-10T12:00:00Z') },
        { createdAt: new Date('2025-01-11T00:00:00Z') },
      ];
      mockPrisma.user.findMany = jest.fn().mockResolvedValueOnce(users);

      const result = await service.getUserGrowth('tenant-1', 30);

      expect(result).toHaveLength(2);
      const jan10 = result.find(r => r.date === '2025-01-10');
      expect(jan10?.count).toBe(2);
    });
  });

  describe('getCourseStats', () => {
    it('should return top 10 courses by enrollment', async () => {
      const courses = [{ id: 'c-1', title: 'Algebra', enrollCount: 200, rating: 4.8, _count: { progress: 150 } }];
      mockPrisma.course.findMany.mockResolvedValueOnce(courses);

      const result = await service.getCourseStats('tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0].enrollCount).toBe(200);
    });
  });

  describe('getStudentActivity', () => {
    it('should return active students, completions, and submissions', async () => {
      mockPrisma.courseProgress.count
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(15);
      mockPrisma.submission.count.mockResolvedValueOnce(45);

      const result = await service.getStudentActivity('tenant-1', 7);

      expect(result.activeStudents).toBe(80);
      expect(result.completions).toBe(15);
      expect(result.submissions).toBe(45);
    });
  });

  describe('getAIUsageStats', () => {
    it('should return grouped AI usage by module', async () => {
      const grouped = [
        { module: 'TUTOR', _sum: { tokens: 50000, cost: 2.5 }, _count: { id: 120 } },
      ];
      mockPrisma.aIUsage.groupBy.mockResolvedValueOnce(grouped);

      const result = await service.getAIUsageStats('tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0].module).toBe('TUTOR');
    });
  });
});
