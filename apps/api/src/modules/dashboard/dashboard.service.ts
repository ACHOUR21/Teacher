import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from '../cache/redis.service';
import { PrismaService } from '../database/prisma.service';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TenantOverview {
  totalUsers: number;
  totalCourses: number;
  totalRevenue: number;
  activeSessions: number;
  recentSignups: number;
}

export interface ActivityEvent {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  userId: string | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface GrowthMetric {
  date: string;
  users: number;
  enrollments: number;
}

export interface TopCourse {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  enrollCount: number;
  rating: number;
  category: string | null;
}

export interface SystemHealth {
  apiResponseMs: number;
  dbStatus: 'healthy' | 'degraded' | 'down';
  redisStatus: 'healthy' | 'degraded' | 'down';
  dbConnectionPool: { active: number; idle: number; total: number };
  timestamp: string;
}

export interface UserMetrics {
  dau: number;
  wau: number;
  mau: number;
  breakdown: { date: string; activeUsers: number }[];
}

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  churnLast30Days: number;
  newSubscriptionsInPeriod: number;
  revenueByDay: { date: string; revenue: number }[];
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisService,
  ) {}

  // ─── getTenantOverview ────────────────────────────────────────────────────

  /**
   * High-level numbers for the tenant admin dashboard:
   * total users, courses, revenue, active live-sessions, and new signups in last 7 days.
   */
  async getTenantOverview(tenantId: string): Promise<TenantOverview> {
    const cacheKey = `dashboard:overview:${tenantId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as TenantOverview;
      } catch {
        // fall through to DB
      }
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalCourses, activeSessions, recentSignups, revenueAgg] =
      await Promise.all([
        this.prisma.user.count({ where: { tenantId, isActive: true } }),
        this.prisma.course.count({ where: { tenantId } }),
        this.prisma.liveSession.count({
          where: { status: { in: ['SCHEDULED', 'LIVE'] }, teacher: { user: { tenantId } } },
        }),
        this.prisma.user.count({ where: { tenantId, createdAt: { gte: sevenDaysAgo } } }),
        this.prisma.invoice.aggregate({
          where: { status: 'COMPLETED', subscription: { tenantId } },
          _sum: { amount: true },
        }),
      ]);

    const overview: TenantOverview = {
      totalUsers,
      totalCourses,
      totalRevenue: Number(revenueAgg._sum.amount ?? 0),
      activeSessions,
      recentSignups,
    };

    await this.cache.set(cacheKey, JSON.stringify(overview), 60); // 1 min TTL
    return overview;
  }

  // ─── getRecentActivity ────────────────────────────────────────────────────

  /**
   * Fetch the last N audit-log events for the tenant.
   */
  async getRecentActivity(tenantId: string, limit = 20): Promise<ActivityEvent[]> {
    const clampedLimit = Math.min(Math.max(limit, 1), 100);

    const logs = await this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: clampedLimit,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        userId: true,
        ipAddress: true,
        createdAt: true,
      },
    });

    return logs.map(log => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      userId: log.userId,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    }));
  }

  // ─── getGrowthMetrics ─────────────────────────────────────────────────────

  /**
   * User and enrollment growth over the specified number of days (daily buckets).
   */
  async getGrowthMetrics(tenantId: string, days = 30): Promise<GrowthMetric[]> {
    const clampedDays = Math.min(Math.max(days, 1), 365);
    const since = new Date(Date.now() - clampedDays * 24 * 60 * 60 * 1000);

    const [usersByDay, enrollmentsByDay] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenantId, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      this.prisma.courseProgress.findMany({
        where: { course: { tenantId }, student: { user: { tenantId } }, lastAccessedAt: { gte: since } },
        select: { lastAccessedAt: true },
      }),
    ]);

    // Build date → count maps
    const userMap: Record<string, number> = {};
    const enrollMap: Record<string, number> = {};

    for (const u of usersByDay) {
      const key = u.createdAt.toISOString().slice(0, 10);
      userMap[key] = (userMap[key] ?? 0) + 1;
    }
    for (const e of enrollmentsByDay) {
      const key = e.lastAccessedAt.toISOString().slice(0, 10);
      enrollMap[key] = (enrollMap[key] ?? 0) + 1;
    }

    // Generate all dates in range
    const result: GrowthMetric[] = [];
    for (let d = 0; d < clampedDays; d++) {
      const dt = new Date(since.getTime() + d * 24 * 60 * 60 * 1000);
      const key = dt.toISOString().slice(0, 10);
      result.push({
        date: key,
        users: userMap[key] ?? 0,
        enrollments: enrollMap[key] ?? 0,
      });
    }

    return result;
  }

  // ─── getTopContent ────────────────────────────────────────────────────────

  /**
   * Top 5 courses by enrollment count and top 5 by average rating.
   */
  async getTopContent(tenantId: string): Promise<{
    byEnrollment: TopCourse[];
    byRating: TopCourse[];
  }> {
    const [byEnrollment, byRating] = await Promise.all([
      this.prisma.course.findMany({
        where: { tenantId, isPublished: true },
        orderBy: { enrollCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          enrollCount: true,
          rating: true,
          category: true,
        },
      }),
      this.prisma.course.findMany({
        where: { tenantId, isPublished: true, rating: { gt: 0 } },
        orderBy: { rating: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          enrollCount: true,
          rating: true,
          category: true,
        },
      }),
    ]);

    return { byEnrollment, byRating };
  }

  // ─── getSystemHealth ──────────────────────────────────────────────────────

  /**
   * Probe the health of critical infrastructure: DB, Redis, and a synthetic
   * API response-time sample.
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const start = Date.now();

    let dbStatus: SystemHealth['dbStatus'] = 'down';
    let dbConnectionPool = { active: 0, idle: 0, total: 0 };

    let redisStatus: SystemHealth['redisStatus'] = 'down';

    // DB probe
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'healthy';

      // Prisma exposes pool metrics via $metrics in some versions; fall back to stubs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const metrics: any = (this.prisma as any).$metrics;
      if (metrics) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const json: { counters?: Array<{ key: string; value: number }> } = await (metrics.json() as Promise<{ counters?: Array<{ key: string; value: number }> }>);
        const pool = json?.counters?.find((c) => c.key === 'prisma_pool_connections_open');
        if (pool) {
          dbConnectionPool = { active: pool.value ?? 0, idle: 0, total: pool.value ?? 0 };
        }
      }
    } catch (err) {
      this.logger.warn('DB health check failed:', err);
      dbStatus = 'down';
    }

    // Redis probe
    try {
      const pong = await this.cache.ping();
      redisStatus = pong === 'PONG' ? 'healthy' : 'degraded';
    } catch (err) {
      this.logger.warn('Redis health check failed:', err);
      redisStatus = 'down';
    }

    const apiResponseMs = Date.now() - start;

    return {
      apiResponseMs,
      dbStatus,
      redisStatus,
      dbConnectionPool,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── getUserMetrics ───────────────────────────────────────────────────────

  /**
   * Daily Active Users, Weekly Active Users, and Monthly Active Users,
   * along with a per-day breakdown for the requested period.
   */
  async getUserMetrics(tenantId: string, days = 30): Promise<UserMetrics> {
    const clampedDays = Math.min(Math.max(days, 1), 365);
    const since = new Date(Date.now() - clampedDays * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [dau, wau, mau, sessionsByDay] = await Promise.all([
      this.prisma.user.count({ where: { tenantId, lastLoginAt: { gte: oneDayAgo } } }),
      this.prisma.user.count({ where: { tenantId, lastLoginAt: { gte: oneWeekAgo } } }),
      this.prisma.user.count({ where: { tenantId, lastLoginAt: { gte: oneMonthAgo } } }),
      this.prisma.user.findMany({
        where: { tenantId, lastLoginAt: { gte: since } },
        select: { lastLoginAt: true },
      }),
    ]);

    // Bucket logins by day
    const dayMap: Record<string, Set<string>> = {};
    for (const user of sessionsByDay) {
      if (!user.lastLoginAt) {continue;}
      const key = user.lastLoginAt.toISOString().slice(0, 10);
      if (!dayMap[key]) {dayMap[key] = new Set();}
      dayMap[key].add(key); // counting events, not unique users across days here
    }

    const breakdown: { date: string; activeUsers: number }[] = [];
    for (let d = 0; d < clampedDays; d++) {
      const dt = new Date(since.getTime() + d * 24 * 60 * 60 * 1000);
      const key = dt.toISOString().slice(0, 10);
      breakdown.push({ date: key, activeUsers: dayMap[key]?.size ?? 0 });
    }

    return { dau, wau, mau, breakdown };
  }

  // ─── getRevenueMetrics ────────────────────────────────────────────────────

  /**
   * MRR, ARR, churn count, new subscriptions, and daily revenue breakdown
   * for the requested period.
   */
  async getRevenueMetrics(tenantId: string, days = 30): Promise<RevenueMetrics> {
    const clampedDays = Math.min(Math.max(days, 1), 365);
    const since = new Date(Date.now() - clampedDays * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [subscription, paidInvoices, churnCount, newSubs] = await Promise.all([
      this.prisma.subscription.findUnique({
        where: { tenantId },
        select: { plan: true, status: true },
      }),
      this.prisma.invoice.findMany({
        where: {
          subscription: { tenantId },
          status: 'COMPLETED',
          paidAt: { gte: since },
        },
        select: { amount: true, paidAt: true },
      }),
      this.prisma.subscription.count({
        where: {
          tenantId,
          status: 'CANCELLED',
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.subscription.count({
        where: {
          tenantId,
          createdAt: { gte: since },
        },
      }),
    ]);

    // Rough MRR based on plan
    const PLAN_MRR_MAP: Record<string, number> = {
      FREE_TRIAL: 0,
      STARTER: 29,
      PROFESSIONAL: 79,
      BUSINESS: 199,
      ENTERPRISE: 499,
      LIFETIME: 0,
    };
    const mrr =
      subscription?.status === 'ACTIVE'
        ? (PLAN_MRR_MAP[subscription.plan] ?? 0)
        : 0;

    // Group daily revenue
    const dayRevenueMap: Record<string, number> = {};
    for (const inv of paidInvoices) {
      if (!inv.paidAt) {continue;}
      const key = inv.paidAt.toISOString().slice(0, 10);
      dayRevenueMap[key] = (dayRevenueMap[key] ?? 0) + Number(inv.amount);
    }

    const revenueByDay: { date: string; revenue: number }[] = [];
    for (let d = 0; d < clampedDays; d++) {
      const dt = new Date(since.getTime() + d * 24 * 60 * 60 * 1000);
      const key = dt.toISOString().slice(0, 10);
      revenueByDay.push({ date: key, revenue: dayRevenueMap[key] ?? 0 });
    }

    return {
      mrr,
      arr: mrr * 12,
      churnLast30Days: churnCount,
      newSubscriptionsInPeriod: newSubs,
      revenueByDay,
    };
  }

  // ─── Legacy methods (kept for backward compatibility) ─────────────────────

  async getStats(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
      if (!teacher) {
        return { enrolledCourses: 0, completedCourses: 0, upcomingSessions: 0, totalPoints: 0 };
      }
      const [courses, sessions, points] = await Promise.all([
        this.prisma.course.count({ where: { teacherId: teacher.id } }),
        this.prisma.liveSession.count({
          where: { teacherId: teacher.id, status: { in: ['SCHEDULED', 'LIVE'] } },
        }),
        this.prisma.userPoints.findUnique({ where: { userId }, select: { total: true } }),
      ]);
      return {
        enrolledCourses: courses,
        completedCourses: 0,
        upcomingSessions: sessions,
        totalPoints: points?.total ?? 0,
      };
    }

    const [enrolled, completed, sessions, points] = await Promise.all([
      this.prisma.courseProgress.count({ where: { studentId: student.id } }),
      this.prisma.courseProgress.count({ where: { studentId: student.id, completedAt: { not: null } } }),
      this.prisma.liveSession.count({ where: { status: { in: ['SCHEDULED', 'LIVE'] } } }),
      this.prisma.userPoints.findUnique({ where: { userId }, select: { total: true } }),
    ]);

    return {
      enrolledCourses: enrolled,
      completedCourses: completed,
      upcomingSessions: sessions,
      totalPoints: points?.total ?? 0,
    };
  }

  async getRecentCourses(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) {return [];}

    const progress = await this.prisma.courseProgress.findMany({
      where: { studentId: student.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            totalLessons: true,
            teacher: {
              select: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
      orderBy: { lastAccessedAt: 'desc' },
      take: 5,
    });

    return progress.map(p => ({
      id: p.course.id,
      title: p.course.title,
      thumbnailUrl: p.course.thumbnailUrl,
      instructor: p.course.teacher
        ? `${p.course.teacher.user.firstName} ${p.course.teacher.user.lastName}`
        : 'Unknown',
      progress:
        p.course.totalLessons > 0
          ? Math.round((p.completedLessons.length / p.course.totalLessons) * 100)
          : Math.round(p.progressPercent),
      nextLesson: null,
    }));
  }

  async getRecommendations(userId: string, tenantId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true } });

    const enrolledIds = student
      ? (
          await this.prisma.courseProgress.findMany({
            where: { studentId: student.id },
            select: { courseId: true },
          })
        ).map(p => p.courseId)
      : [];

    const courses = await this.prisma.course.findMany({
      where: { tenantId, isPublished: true, id: { notIn: enrolledIds } },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        category: true,
        rating: true,
        enrollCount: true,
      },
      orderBy: { rating: 'desc' },
      take: 6,
    });

    return courses.map(c => ({
      id: c.id,
      title: c.title,
      reason: `Top rated in ${c.category ?? 'General'}`,
      category: c.category ?? 'General',
      thumbnailUrl: c.thumbnailUrl,
      rating: c.rating,
    }));
  }

  async getUpcomingSessions(tenantId: string) {
    return this.prisma.liveSession.findMany({
      where: {
        status: { in: ['SCHEDULED', 'LIVE'] },
        teacher: { user: { tenantId } },
      },
      include: {
        teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { participants: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    });
  }
}
