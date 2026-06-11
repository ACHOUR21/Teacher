import { Injectable } from '@nestjs/common';

import { RedisService } from '../cache/redis.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisService,
  ) {}

  async getPlatformStats(tenantId: string) {
    const cacheKey = `analytics:platform:${tenantId}`;
    const cached = await this.cache.get(cacheKey);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (cached) {return JSON.parse(cached);}

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
      if (!d) {return;}
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

  async getTeacherOverview(teacherId: string) {
    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      select: {
        id: true,
        title: true,
        enrollCount: true,
        rating: true,
        price: true,
        _count: { select: { progress: true } },
      },
    });

    const totalStudents = courses.reduce((s, c) => s + c.enrollCount, 0);
    const totalCourses = courses.length;

    const completionCounts = await Promise.all(
      courses.map(c => this.prisma.courseProgress.count({ where: { courseId: c.id, completedAt: { not: null } } }))
    );

    const avgCompletionRate = courses.length > 0
      ? courses.reduce((s, c, i) => s + (c._count.progress > 0 ? (completionCounts[i] / c._count.progress) * 100 : 0), 0) / courses.length
      : 0;

    const monthlyRevenue = courses.reduce((s, c) => s + (Number(c.price) * c.enrollCount), 0) / 12;

    return { totalStudents, totalCourses, avgCompletionRate: Math.round(avgCompletionRate * 10) / 10, monthlyRevenue: Math.round(monthlyRevenue) };
  }

  async getTeacherCoursePerformance(teacherId: string) {
    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      select: {
        id: true,
        title: true,
        enrollCount: true,
        rating: true,
        price: true,
        createdAt: true,
        _count: { select: { progress: true } },
      },
      orderBy: { enrollCount: 'desc' },
    });

    const completionCounts = await Promise.all(
      courses.map(c => this.prisma.courseProgress.count({ where: { courseId: c.id, completedAt: { not: null } } }))
    );

    return courses.map((c, i) => ({
      id: c.id,
      title: c.title,
      students: c.enrollCount,
      completionRate: c._count.progress > 0 ? Math.round((completionCounts[i] / c._count.progress) * 100) : 0,
      avgScore: Math.round(Math.random() * 30 + 60), // placeholder until quiz scores aggregated
      revenue: Math.round(Number(c.price) * c.enrollCount),
      rating: Number(c.rating).toFixed(1),
    }));
  }

  async getTeacherEnrollmentTrend(teacherId: string, days = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      select: { id: true },
    });
    const courseIds = courses.map(c => c.id);

    const progress = await this.prisma.courseProgress.findMany({
      where: { courseId: { in: courseIds }, lastAccessedAt: { gte: from } },
      select: { lastAccessedAt: true },
      orderBy: { lastAccessedAt: 'asc' },
    });

    const grouped: Record<string, number> = {};
    progress.forEach(p => {
      const day = p.lastAccessedAt.toISOString().split('T')[0];
      grouped[day] = (grouped[day] ?? 0) + 1;
    });

    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }

  async getTeacherTopStudents(teacherId: string) {
    const courses = await this.prisma.course.findMany({
      where: { teacherId },
      select: { id: true },
    });
    const courseIds = courses.map(c => c.id);

    const topStudents = await this.prisma.courseProgress.findMany({
      where: { courseId: { in: courseIds } },
      orderBy: { progressPercent: 'desc' },
      take: 10,
      select: {
        progressPercent: true,
        student: {
          select: {
            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
      distinct: ['studentId'],
    });

    return topStudents.map(p => ({
      name: `${p.student.user.firstName} ${p.student.user.lastName}`,
      avatar: p.student.user.avatarUrl,
      progress: Math.round(p.progressPercent),
    }));
  }

  async getStudentOverview(studentId: string) {
    const [enrolledCourses, completedCourses, recentActivity] = await Promise.all([
      this.prisma.courseProgress.count({ where: { studentId } }),
      this.prisma.courseProgress.count({ where: { studentId, completedAt: { not: null } } }),
      this.prisma.courseProgress.findMany({
        where: { studentId },
        select: { progressPercent: true, lastAccessedAt: true },
        orderBy: { lastAccessedAt: 'desc' },
        take: 90,
      }),
    ]);

    const avgProgress = recentActivity.length > 0
      ? recentActivity.reduce((s, a) => s + a.progressPercent, 0) / recentActivity.length
      : 0;

    return {
      enrolledCourses,
      completedCourses,
      avgProgress: Math.round(avgProgress * 10) / 10,
      studyDays: recentActivity.length,
    };
  }

  async getStudentPerformance(studentId: string) {
    const progress = await this.prisma.courseProgress.findMany({
      where: { studentId },
      select: {
        progressPercent: true,
        completedAt: true,
        course: { select: { title: true, category: true } },
      },
    });

    const byCategory: Record<string, number[]> = {};
    progress.forEach(p => {
      const cat = p.course.category ?? 'General';
      if (!byCategory[cat]) { byCategory[cat] = []; }
      byCategory[cat].push(p.progressPercent);
    });

    return Object.entries(byCategory).map(([subject, scores]) => ({
      subject,
      avgScore: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length),
    }));
  }

  async getStudentActivityHeatmap(studentId: string) {
    const from = new Date();
    from.setDate(from.getDate() - 90);

    const activity = await this.prisma.courseProgress.findMany({
      where: { studentId, lastAccessedAt: { gte: from } },
      select: { lastAccessedAt: true },
      orderBy: { lastAccessedAt: 'asc' },
    });

    const dayMap: Record<string, number> = {};
    activity.forEach(a => {
      const day = a.lastAccessedAt.toISOString().split('T')[0];
      dayMap[day] = (dayMap[day] ?? 0) + 1;
    });

    return Object.entries(dayMap).map(([date, count]) => ({ date, count }));
  }

  async getAdminPlatformOverview(tenantId: string) {
    const from30 = new Date();
    from30.setDate(from30.getDate() - 30);
    const from60 = new Date();
    from60.setDate(from60.getDate() - 60);

    const [totalTenants, totalUsers, mauUsers, recentRevenue, prevRevenue, aiCostToday] = await Promise.all([
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { tenantId, isActive: true } }),
      this.prisma.user.count({ where: { tenantId, lastLoginAt: { gte: from30 } } }),
      this.prisma.invoice.aggregate({
        where: { subscription: { tenant: { id: tenantId } }, status: 'COMPLETED', paidAt: { gte: from30 } },
        _sum: { amount: true },
      }),
      this.prisma.invoice.aggregate({
        where: { subscription: { tenant: { id: tenantId } }, status: 'COMPLETED', paidAt: { gte: from60, lt: from30 } },
        _sum: { amount: true },
      }),
      this.prisma.aIUsage.aggregate({
        where: { tenantId, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        _sum: { cost: true },
      }),
    ]);

    const mrr = Number(recentRevenue._sum.amount ?? 0);
    const prevMrr = Number(prevRevenue._sum.amount ?? 0);
    const mrrGrowth = prevMrr > 0 ? ((mrr - prevMrr) / prevMrr) * 100 : 0;

    return {
      totalTenants,
      totalUsers,
      mau: mauUsers,
      mrr,
      mrrGrowth: Math.round(mrrGrowth * 10) / 10,
      aiCostToday: Number(aiCostToday._sum.cost ?? 0),
    };
  }

  async getCohortRetention(tenantId: string) {
    const weeks = [1, 2, 3, 4];
    const cohorts = await Promise.all(
      weeks.map(async (w) => {
        const start = new Date();
        start.setDate(start.getDate() - w * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        const cohortUsers = await this.prisma.user.findMany({
          where: { tenantId, createdAt: { gte: start, lt: end } },
          select: { id: true },
        });

        if (cohortUsers.length === 0) { return { week: `Week -${w}`, size: 0, day1: 0, day7: 0, day30: 0 }; }

        const userIds = cohortUsers.map(u => u.id);
        const day1From = new Date(start);
        day1From.setDate(day1From.getDate() + 1);

        const [day1Active, day7Active, day30Active] = await Promise.all([
          this.prisma.user.count({ where: { id: { in: userIds }, lastLoginAt: { gte: start } } }),
          this.prisma.user.count({ where: { id: { in: userIds }, lastLoginAt: { gte: new Date(start.getTime() + 6 * 86400000) } } }),
          this.prisma.user.count({ where: { id: { in: userIds }, lastLoginAt: { gte: new Date(start.getTime() + 29 * 86400000) } } }),
        ]);

        return {
          week: `Week -${w}`,
          size: cohortUsers.length,
          day1: Math.round((day1Active / cohortUsers.length) * 100),
          day7: Math.round((day7Active / cohortUsers.length) * 100),
          day30: Math.round((day30Active / cohortUsers.length) * 100),
        };
      })
    );

    return cohorts;
  }

  async getTopTenants() {
    const tenants = await this.prisma.tenant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        plan: true,
        _count: { select: { users: true } },
      },
      orderBy: { users: { _count: 'desc' } },
      take: 10,
    });

    const revenueData = await Promise.all(
      tenants.map(t =>
        this.prisma.invoice.aggregate({
          where: { subscription: { tenantId: t.id }, status: 'COMPLETED' },
          _sum: { amount: true },
        })
      )
    );

    return tenants.map((t, i) => ({
      id: t.id,
      name: t.name,
      plan: t.plan,
      users: t._count.users,
      revenue: Number(revenueData[i]._sum.amount ?? 0),
    }));
  }
}
