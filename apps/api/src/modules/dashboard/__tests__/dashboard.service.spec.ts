import { Test, type TestingModule } from '@nestjs/testing';

import { RedisService } from '../../cache/redis.service';
import { PrismaService } from '../../database/prisma.service';
import { DashboardService } from '../dashboard.service';

const mockPrisma = {
  user: { count: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  course: { count: jest.fn(), findMany: jest.fn() },
  liveSession: { count: jest.fn(), findMany: jest.fn() },
  auditLog: { findMany: jest.fn() },
  courseProgress: { count: jest.fn(), findMany: jest.fn() },
  invoice: { aggregate: jest.fn(), findMany: jest.fn() },
  subscription: { findUnique: jest.fn(), count: jest.fn() },
  student: { findUnique: jest.fn() },
  teacher: { findUnique: jest.fn() },
  userPoints: { findUnique: jest.fn() },
  $queryRaw: jest.fn(),
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  ping: jest.fn(),
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getTenantOverview ────────────────────────────────────────────────────

  describe('getTenantOverview', () => {
    const tenantId = 'tenant-1';

    it('should return cached overview when cache hit', async () => {
      const cached = {
        totalUsers: 100,
        totalCourses: 20,
        totalRevenue: 5000,
        activeSessions: 3,
        recentSignups: 10,
      };
      mockCache.get.mockResolvedValueOnce(JSON.stringify(cached));

      const result = await service.getTenantOverview(tenantId);

      expect(result).toEqual(cached);
      expect(mockPrisma.user.count).not.toHaveBeenCalled();
    });

    it('should query DB and cache result on cache miss', async () => {
      mockCache.get.mockResolvedValueOnce(null);
      mockPrisma.user.count
        .mockResolvedValueOnce(150)   // totalUsers
        .mockResolvedValueOnce(12);   // recentSignups
      mockPrisma.course.count.mockResolvedValueOnce(25);
      mockPrisma.liveSession.count.mockResolvedValueOnce(4);
      mockPrisma.invoice.aggregate.mockResolvedValueOnce({ _sum: { amount: 9999.5 } });

      const result = await service.getTenantOverview(tenantId);

      expect(result.totalUsers).toBe(150);
      expect(result.totalCourses).toBe(25);
      expect(result.activeSessions).toBe(4);
      expect(result.recentSignups).toBe(12);
      expect(result.totalRevenue).toBeCloseTo(9999.5);
      expect(mockCache.set).toHaveBeenCalledWith(
        `dashboard:overview:${tenantId}`,
        expect.any(String),
        60,
      );
    });

    it('should default totalRevenue to 0 when no invoices', async () => {
      mockCache.get.mockResolvedValueOnce(null);
      mockPrisma.user.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
      mockPrisma.course.count.mockResolvedValueOnce(0);
      mockPrisma.liveSession.count.mockResolvedValueOnce(0);
      mockPrisma.invoice.aggregate.mockResolvedValueOnce({ _sum: { amount: null } });

      const result = await service.getTenantOverview(tenantId);

      expect(result.totalRevenue).toBe(0);
    });

    it('should fall through to DB when cached JSON is invalid', async () => {
      mockCache.get.mockResolvedValueOnce('not-valid-json{{');
      mockPrisma.user.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2);
      mockPrisma.course.count.mockResolvedValueOnce(1);
      mockPrisma.liveSession.count.mockResolvedValueOnce(0);
      mockPrisma.invoice.aggregate.mockResolvedValueOnce({ _sum: { amount: 0 } });

      const result = await service.getTenantOverview(tenantId);

      expect(result.totalUsers).toBe(5);
    });
  });

  // ─── getRecentActivity ────────────────────────────────────────────────────

  describe('getRecentActivity', () => {
    it('should return audit log events for the tenant', async () => {
      const logs = [
        {
          id: 'log-1',
          action: 'LOGIN',
          resource: 'AUTH',
          resourceId: null,
          userId: 'user-1',
          ipAddress: '127.0.0.1',
          createdAt: new Date('2025-01-01T00:00:00Z'),
        },
      ];
      mockPrisma.auditLog.findMany.mockResolvedValueOnce(logs);

      const result = await service.getRecentActivity('tenant-1', 10);

      expect(result).toHaveLength(1);
      expect(result[0].action).toBe('LOGIN');
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });

    it('should clamp limit to max 100', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValueOnce([]);

      await service.getRecentActivity('tenant-1', 500);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it('should clamp limit to min 1', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValueOnce([]);

      await service.getRecentActivity('tenant-1', 0);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1 }),
      );
    });
  });

  // ─── getGrowthMetrics ─────────────────────────────────────────────────────

  describe('getGrowthMetrics', () => {
    it('should return daily growth buckets for the requested period', async () => {
      // Use dates within the last 3 days so they fall inside the generated range
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      mockPrisma.user.findMany.mockResolvedValueOnce([
        { createdAt: new Date(yesterday.getTime()) },
        { createdAt: new Date(yesterday.getTime() + 1000) },
      ]);
      mockPrisma.courseProgress.findMany.mockResolvedValueOnce([
        { lastAccessedAt: new Date(yesterday.getTime()) },
      ]);

      const result = await service.getGrowthMetrics('tenant-1', 3);

      expect(result).toHaveLength(3);
      // The date entries should have user/enrollment counts
      const total = result.reduce((acc, d) => acc + d.users, 0);
      expect(total).toBe(2);
    });

    it('should clamp days between 1 and 365', async () => {
      mockPrisma.user.findMany.mockResolvedValueOnce([]);
      mockPrisma.courseProgress.findMany.mockResolvedValueOnce([]);

      const result = await service.getGrowthMetrics('tenant-1', 400);

      expect(result).toHaveLength(365);
    });

    it('should return zero counts when no activity', async () => {
      mockPrisma.user.findMany.mockResolvedValueOnce([]);
      mockPrisma.courseProgress.findMany.mockResolvedValueOnce([]);

      const result = await service.getGrowthMetrics('tenant-1', 7);

      expect(result).toHaveLength(7);
      result.forEach(d => {
        expect(d.users).toBe(0);
        expect(d.enrollments).toBe(0);
      });
    });
  });

  // ─── getTopContent ────────────────────────────────────────────────────────

  describe('getTopContent', () => {
    it('should return top 5 courses by enrollment and by rating', async () => {
      const byEnrollment = [
        { id: 'c-1', title: 'Math', thumbnailUrl: null, enrollCount: 500, rating: 4.2, category: 'Math' },
      ];
      const byRating = [
        { id: 'c-2', title: 'Science', thumbnailUrl: null, enrollCount: 200, rating: 4.9, category: 'Science' },
      ];
      mockPrisma.course.findMany
        .mockResolvedValueOnce(byEnrollment)
        .mockResolvedValueOnce(byRating);

      const result = await service.getTopContent('tenant-1');

      expect(result.byEnrollment).toHaveLength(1);
      expect(result.byRating).toHaveLength(1);
      expect(result.byEnrollment[0].enrollCount).toBe(500);
      expect(result.byRating[0].rating).toBe(4.9);
    });
  });

  // ─── getSystemHealth ──────────────────────────────────────────────────────

  describe('getSystemHealth', () => {
    it('should report healthy when DB and Redis are both up', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
      mockCache.ping.mockResolvedValueOnce('PONG');

      const result = await service.getSystemHealth();

      expect(result.dbStatus).toBe('healthy');
      expect(result.redisStatus).toBe('healthy');
      expect(typeof result.apiResponseMs).toBe('number');
      expect(result.timestamp).toBeDefined();
    });

    it('should report db as down when DB query fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('Connection refused'));
      mockCache.ping.mockResolvedValueOnce('PONG');

      const result = await service.getSystemHealth();

      expect(result.dbStatus).toBe('down');
      expect(result.redisStatus).toBe('healthy');
    });

    it('should report redis as down when ping fails', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
      mockCache.ping.mockRejectedValueOnce(new Error('Redis offline'));

      const result = await service.getSystemHealth();

      expect(result.dbStatus).toBe('healthy');
      expect(result.redisStatus).toBe('down');
    });

    it('should report degraded redis when ping returns unexpected value', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
      mockCache.ping.mockResolvedValueOnce('NOT_PONG');

      const result = await service.getSystemHealth();

      expect(result.redisStatus).toBe('degraded');
    });
  });

  // ─── getUserMetrics ───────────────────────────────────────────────────────

  describe('getUserMetrics', () => {
    it('should return dau, wau, mau and daily breakdown', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(10)  // dau
        .mockResolvedValueOnce(50)  // wau
        .mockResolvedValueOnce(200); // mau
      mockPrisma.user.findMany.mockResolvedValueOnce([
        { lastLoginAt: new Date('2025-01-10T08:00:00Z') },
        { lastLoginAt: new Date('2025-01-10T20:00:00Z') },
      ]);

      const result = await service.getUserMetrics('tenant-1', 7);

      expect(result.dau).toBe(10);
      expect(result.wau).toBe(50);
      expect(result.mau).toBe(200);
      expect(result.breakdown).toHaveLength(7);
    });

    it('should clamp days between 1 and 365', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.user.findMany.mockResolvedValueOnce([]);

      const result = await service.getUserMetrics('tenant-1', 1000);

      expect(result.breakdown).toHaveLength(365);
    });

    it('should handle users with null lastLoginAt in sessionsByDay', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.user.findMany.mockResolvedValueOnce([{ lastLoginAt: null }]);

      const result = await service.getUserMetrics('tenant-1', 5);

      expect(result.breakdown).toHaveLength(5);
      result.breakdown.forEach(d => expect(d.activeUsers).toBe(0));
    });
  });

  // ─── getRevenueMetrics ────────────────────────────────────────────────────

  describe('getRevenueMetrics', () => {
    it('should compute MRR and ARR for an active subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValueOnce({
        plan: 'PROFESSIONAL',
        status: 'ACTIVE',
      });
      mockPrisma.invoice.findMany.mockResolvedValueOnce([]);
      mockPrisma.subscription.count
        .mockResolvedValueOnce(1)  // churnCount
        .mockResolvedValueOnce(3); // newSubs

      const result = await service.getRevenueMetrics('tenant-1', 30);

      expect(result.mrr).toBe(79);
      expect(result.arr).toBe(79 * 12);
      expect(result.churnLast30Days).toBe(1);
      expect(result.newSubscriptionsInPeriod).toBe(3);
    });

    it('should return mrr=0 for inactive subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValueOnce({
        plan: 'PROFESSIONAL',
        status: 'CANCELLED',
      });
      mockPrisma.invoice.findMany.mockResolvedValueOnce([]);
      mockPrisma.subscription.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getRevenueMetrics('tenant-1', 30);

      expect(result.mrr).toBe(0);
      expect(result.arr).toBe(0);
    });

    it('should return mrr=0 when no subscription found', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValueOnce(null);
      mockPrisma.invoice.findMany.mockResolvedValueOnce([]);
      mockPrisma.subscription.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getRevenueMetrics('tenant-1', 30);

      expect(result.mrr).toBe(0);
    });

    it('should group invoices into daily revenue buckets', async () => {
      // Use recent dates so they fall within the 30-day window
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      mockPrisma.subscription.findUnique.mockResolvedValueOnce({
        plan: 'STARTER',
        status: 'ACTIVE',
      });
      mockPrisma.invoice.findMany.mockResolvedValueOnce([
        { amount: '29', paidAt: new Date(`${yesterdayStr}T00:00:00Z`) },
        { amount: '29', paidAt: new Date(`${yesterdayStr}T12:00:00Z`) },
      ]);
      mockPrisma.subscription.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getRevenueMetrics('tenant-1', 30);

      const dayEntry = result.revenueByDay.find(d => d.date === yesterdayStr);
      expect(dayEntry?.revenue).toBe(58);
    });

    it('should clamp days between 1 and 365', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValueOnce(null);
      mockPrisma.invoice.findMany.mockResolvedValueOnce([]);
      mockPrisma.subscription.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      const result = await service.getRevenueMetrics('tenant-1', 1000);

      expect(result.revenueByDay).toHaveLength(365);
    });
  });
});
