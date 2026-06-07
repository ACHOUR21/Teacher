import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisService,
  ) {}

  async getPlatformStats(tenantId: string) {
    const cacheKey = `analytics:platform:${tenantId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const [totalUsers, totalCourses, activeSessions, totalRevenue] = await Promise.all([
      this.prisma.user.count({ where: { tenantId, isActive: true } }),
      this.prisma.course.count({ where: { tenantId, isPublished: true } }),
      this.prisma.liveSession.count({ where: { teacher: { user: { tenantId } }, status: 'LIVE' } }),
      this.prisma.invoice.aggregate({
        where: { subscription: { tenant: { id: tenantId } }, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    const stats = {
      totalUsers,
      totalCourses,
      activeSessions,
      totalRevenue: totalRevenue._sum.amount ?? 0,
    };

    await this.cache.set(cacheKey, JSON.stringify(stats), 300);
    return stats;
  }

  async getUserGrowth(tenantId: string, days = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const users = await this.prisma.user.findMany({
      where: { tenantId, createdAt: { gte: from } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, number> = {};
    users.forEach(u => {
      const day = u.createdAt.toISOString().split('T')[0];
      grouped[day] = (grouped[day] ?? 0) + 1;
    });

    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }

  async getCourseStats(tenantId: string) {
    const courses = await this.prisma.course.findMany({
      where: { tenantId },
      select: {
        id: true,
        title: true,
        enrollCount: true,
        rating: true,
        _count: { select: { progress: true } },
      },
      orderBy: { enrollCount: 'desc' },
      take: 10,
    });
    return courses;
  }

  async getStudentActivity(tenantId: string, days = 7) {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const [activeStudents, completions, submissions] = await Promise.all([
      this.prisma.courseProgress.count({
        where: { course: { tenantId }, lastAccessedAt: { gte: from } },
      }),
      this.prisma.courseProgress.count({
        where: { course: { tenantId }, completedAt: { gte: from } },
      }),
      this.prisma.submission.count({
        where: { assignment: { lesson: { section: { course: { tenantId } } } }, submittedAt: { gte: from } },
      }),
    ]);

    return { activeStudents, completions, submissions };
  }

  async getRevenueAnalytics(tenantId: string, months = 6) {
    const from = new Date();
    from.setMonth(from.getMonth() - months);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        subscription: { tenant: { id: tenantId } },
        status: 'COMPLETED',
        paidAt: { gte: from },
      },
      select: { amount: true, paidAt: true },
      orderBy: { paidAt: 'asc' },
    });

    const grouped: Record<string, number> = {};
    invoices.forEach(inv => {
      const month = inv.paidAt!.toISOString().substring(0, 7);
      grouped[month] = (grouped[month] ?? 0) + Number(inv.amount);
    });

    return Object.entries(grouped).map(([month, revenue]) => ({ month, revenue }));
  }

  async getAIUsageStats(tenantId: string) {
    return this.prisma.aIUsage.groupBy({
      by: ['module'],
      where: { tenantId },
      _sum: { tokens: true, cost: true },
      _count: { id: true },
      orderBy: { _sum: { tokens: 'desc' } },
    });
  }

  async getEngagementHeatmap(tenantId: string) {
    const from = new Date();
    from.setDate(from.getDate() - 28);

    const activity = await this.prisma.courseProgress.findMany({
      where: { course: { tenantId }, lastAccessedAt: { gte: from } },
      select: { lastAccessedAt: true },
    });

    // Build day×hour heatmap (0=Sun..6=Sat, 0..23 hours)
    const heatmap: Record<string, number> = {};
    activity.forEach(a => {
      const d = a.lastAccessedAt;
      if (!d) return;
      const key = `${d.getDay()}-${d.getHours()}`;
      heatmap[key] = (heatmap[key] ?? 0) + 1;
    });

    return Object.entries(heatmap).map(([key, count]) => {
      const [day, hour] = key.split('-').map(Number);
      return { day, hour, count };
    });
  }

  async getTopCourses(tenantId: string) {
    const courses = await this.prisma.course.findMany({
      where: { tenantId, isPublished: true },
      select: {
        id: true,
        title: true,
        enrollCount: true,
        rating: true,
        thumbnailUrl: true,
        category: true,
        _count: { select: { progress: true } },
        teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { enrollCount: 'desc' },
      take: 10,
    });

    const completionData = await Promise.all(
      courses.map(c =>
        this.prisma.courseProgress.count({ where: { courseId: c.id, completedAt: { not: null } } })
      )
    );

    return courses.map((c, i) => ({
      ...c,
      completions: completionData[i],
      completionRate: c._count.progress > 0 ? Math.round((completionData[i] / c._count.progress) * 100) : 0,
    }));
  }
}
