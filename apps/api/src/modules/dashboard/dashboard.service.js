"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DashboardService = void 0;
var _common = require("@nestjs/common");
var _redis = require("../cache/redis.service");
var _prisma = require("../database/prisma.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = void 0 && (void 0).__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = void 0 && (void 0).__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
var DashboardService_1;
let DashboardService = exports.DashboardService = DashboardService_1 = class DashboardService {
  logger = new _common.Logger(DashboardService_1.name);
  constructor(prisma, cache) {
    this.prisma = prisma;
    this.cache = cache;
  }
  // ─── getTenantOverview ────────────────────────────────────────────────────
  /**
   * High-level numbers for the tenant admin dashboard:
   * total users, courses, revenue, active live-sessions, and new signups in last 7 days.
   */
  async getTenantOverview(tenantId) {
    const cacheKey = `dashboard:overview:${tenantId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fall through to DB
      }
    }
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [totalUsers, totalCourses, activeSessions, recentSignups, revenueAgg] = await Promise.all([this.prisma.user.count({
      where: {
        tenantId,
        isActive: true
      }
    }), this.prisma.course.count({
      where: {
        tenantId
      }
    }), this.prisma.liveSession.count({
      where: {
        status: {
          in: ['SCHEDULED', 'LIVE']
        },
        teacher: {
          user: {
            tenantId
          }
        }
      }
    }), this.prisma.user.count({
      where: {
        tenantId,
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    }), this.prisma.invoice.aggregate({
      where: {
        status: 'COMPLETED',
        subscription: {
          tenantId
        }
      },
      _sum: {
        amount: true
      }
    })]);
    const overview = {
      totalUsers,
      totalCourses,
      totalRevenue: Number(revenueAgg._sum.amount ?? 0),
      activeSessions,
      recentSignups
    };
    await this.cache.set(cacheKey, JSON.stringify(overview), 60); // 1 min TTL
    return overview;
  }
  // ─── getRecentActivity ────────────────────────────────────────────────────
  /**
   * Fetch the last N audit-log events for the tenant.
   */
  async getRecentActivity(tenantId, limit = 20) {
    const clampedLimit = Math.min(Math.max(limit, 1), 100);
    const logs = await this.prisma.auditLog.findMany({
      where: {
        tenantId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: clampedLimit,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        userId: true,
        ipAddress: true,
        createdAt: true
      }
    });
    return logs.map(log => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      userId: log.userId,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt
    }));
  }
  // ─── getGrowthMetrics ─────────────────────────────────────────────────────
  /**
   * User and enrollment growth over the specified number of days (daily buckets).
   */
  async getGrowthMetrics(tenantId, days = 30) {
    const clampedDays = Math.min(Math.max(days, 1), 365);
    const since = new Date(Date.now() - clampedDays * 24 * 60 * 60 * 1000);
    const [usersByDay, enrollmentsByDay] = await Promise.all([this.prisma.user.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: since
        }
      },
      select: {
        createdAt: true
      }
    }), this.prisma.courseProgress.findMany({
      where: {
        course: {
          tenantId
        },
        student: {
          user: {
            tenantId
          }
        },
        lastAccessedAt: {
          gte: since
        }
      },
      select: {
        lastAccessedAt: true
      }
    })]);
    // Build date → count maps
    const userMap = {};
    const enrollMap = {};
    for (const u of usersByDay) {
      const key = u.createdAt.toISOString().slice(0, 10);
      userMap[key] = (userMap[key] ?? 0) + 1;
    }
    for (const e of enrollmentsByDay) {
      const key = e.lastAccessedAt.toISOString().slice(0, 10);
      enrollMap[key] = (enrollMap[key] ?? 0) + 1;
    }
    // Generate all dates in range
    const result = [];
    for (let d = 0; d < clampedDays; d++) {
      const dt = new Date(since.getTime() + d * 24 * 60 * 60 * 1000);
      const key = dt.toISOString().slice(0, 10);
      result.push({
        date: key,
        users: userMap[key] ?? 0,
        enrollments: enrollMap[key] ?? 0
      });
    }
    return result;
  }
  // ─── getTopContent ────────────────────────────────────────────────────────
  /**
   * Top 5 courses by enrollment count and top 5 by average rating.
   */
  async getTopContent(tenantId) {
    const [byEnrollment, byRating] = await Promise.all([this.prisma.course.findMany({
      where: {
        tenantId,
        isPublished: true
      },
      orderBy: {
        enrollCount: 'desc'
      },
      take: 5,
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        enrollCount: true,
        rating: true,
        category: true
      }
    }), this.prisma.course.findMany({
      where: {
        tenantId,
        isPublished: true,
        rating: {
          gt: 0
        }
      },
      orderBy: {
        rating: 'desc'
      },
      take: 5,
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        enrollCount: true,
        rating: true,
        category: true
      }
    })]);
    return {
      byEnrollment,
      byRating
    };
  }
  // ─── getSystemHealth ──────────────────────────────────────────────────────
  /**
   * Probe the health of critical infrastructure: DB, Redis, and a synthetic
   * API response-time sample.
   */
  async getSystemHealth() {
    const start = Date.now();
    let dbStatus = 'down';
    let dbConnectionPool = {
      active: 0,
      idle: 0,
      total: 0
    };
    let redisStatus = 'down';
    // DB probe
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'healthy';
      // Prisma exposes pool metrics via $metrics in some versions; fall back to stubs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const metrics = this.prisma.$metrics;
      if (metrics) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const json = await metrics.json();
        const pool = json?.counters?.find(c => c.key === 'prisma_pool_connections_open');
        if (pool) {
          dbConnectionPool = {
            active: pool.value ?? 0,
            idle: 0,
            total: pool.value ?? 0
          };
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
      timestamp: new Date().toISOString()
    };
  }
  // ─── getUserMetrics ───────────────────────────────────────────────────────
  /**
   * Daily Active Users, Weekly Active Users, and Monthly Active Users,
   * along with a per-day breakdown for the requested period.
   */
  async getUserMetrics(tenantId, days = 30) {
    const clampedDays = Math.min(Math.max(days, 1), 365);
    const since = new Date(Date.now() - clampedDays * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [dau, wau, mau, sessionsByDay] = await Promise.all([this.prisma.user.count({
      where: {
        tenantId,
        lastLoginAt: {
          gte: oneDayAgo
        }
      }
    }), this.prisma.user.count({
      where: {
        tenantId,
        lastLoginAt: {
          gte: oneWeekAgo
        }
      }
    }), this.prisma.user.count({
      where: {
        tenantId,
        lastLoginAt: {
          gte: oneMonthAgo
        }
      }
    }), this.prisma.user.findMany({
      where: {
        tenantId,
        lastLoginAt: {
          gte: since
        }
      },
      select: {
        lastLoginAt: true
      }
    })]);
    // Bucket logins by day
    const dayMap = {};
    for (const user of sessionsByDay) {
      if (!user.lastLoginAt) {
        continue;
      }
      const key = user.lastLoginAt.toISOString().slice(0, 10);
      if (!dayMap[key]) {
        dayMap[key] = new Set();
      }
      dayMap[key].add(key); // counting events, not unique users across days here
    }
    const breakdown = [];
    for (let d = 0; d < clampedDays; d++) {
      const dt = new Date(since.getTime() + d * 24 * 60 * 60 * 1000);
      const key = dt.toISOString().slice(0, 10);
      breakdown.push({
        date: key,
        activeUsers: dayMap[key]?.size ?? 0
      });
    }
    return {
      dau,
      wau,
      mau,
      breakdown
    };
  }
  // ─── getRevenueMetrics ────────────────────────────────────────────────────
  /**
   * MRR, ARR, churn count, new subscriptions, and daily revenue breakdown
   * for the requested period.
   */
  async getRevenueMetrics(tenantId, days = 30) {
    const clampedDays = Math.min(Math.max(days, 1), 365);
    const since = new Date(Date.now() - clampedDays * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [subscription, paidInvoices, churnCount, newSubs] = await Promise.all([this.prisma.subscription.findUnique({
      where: {
        tenantId
      },
      select: {
        plan: true,
        status: true
      }
    }), this.prisma.invoice.findMany({
      where: {
        subscription: {
          tenantId
        },
        status: 'COMPLETED',
        paidAt: {
          gte: since
        }
      },
      select: {
        amount: true,
        paidAt: true
      }
    }), this.prisma.subscription.count({
      where: {
        tenantId,
        status: 'CANCELLED',
        updatedAt: {
          gte: thirtyDaysAgo
        }
      }
    }), this.prisma.subscription.count({
      where: {
        tenantId,
        createdAt: {
          gte: since
        }
      }
    })]);
    // Rough MRR based on plan
    const PLAN_MRR_MAP = {
      FREE_TRIAL: 0,
      STARTER: 29,
      PROFESSIONAL: 79,
      BUSINESS: 199,
      ENTERPRISE: 499,
      LIFETIME: 0
    };
    const mrr = subscription?.status === 'ACTIVE' ? PLAN_MRR_MAP[subscription.plan] ?? 0 : 0;
    // Group daily revenue
    const dayRevenueMap = {};
    for (const inv of paidInvoices) {
      if (!inv.paidAt) {
        continue;
      }
      const key = inv.paidAt.toISOString().slice(0, 10);
      dayRevenueMap[key] = (dayRevenueMap[key] ?? 0) + Number(inv.amount);
    }
    const revenueByDay = [];
    for (let d = 0; d < clampedDays; d++) {
      const dt = new Date(since.getTime() + d * 24 * 60 * 60 * 1000);
      const key = dt.toISOString().slice(0, 10);
      revenueByDay.push({
        date: key,
        revenue: dayRevenueMap[key] ?? 0
      });
    }
    return {
      mrr,
      arr: mrr * 12,
      churnLast30Days: churnCount,
      newSubscriptionsInPeriod: newSubs,
      revenueByDay
    };
  }
  // ─── Legacy methods (kept for backward compatibility) ─────────────────────
  async getStats(userId) {
    const student = await this.prisma.student.findUnique({
      where: {
        userId
      },
      select: {
        id: true
      }
    });
    if (!student) {
      const teacher = await this.prisma.teacher.findUnique({
        where: {
          userId
        },
        select: {
          id: true
        }
      });
      if (!teacher) {
        return {
          enrolledCourses: 0,
          completedCourses: 0,
          upcomingSessions: 0,
          totalPoints: 0
        };
      }
      const [courses, sessions, points] = await Promise.all([this.prisma.course.count({
        where: {
          teacherId: teacher.id
        }
      }), this.prisma.liveSession.count({
        where: {
          teacherId: teacher.id,
          status: {
            in: ['SCHEDULED', 'LIVE']
          }
        }
      }), this.prisma.userPoints.findUnique({
        where: {
          userId
        },
        select: {
          total: true
        }
      })]);
      return {
        enrolledCourses: courses,
        completedCourses: 0,
        upcomingSessions: sessions,
        totalPoints: points?.total ?? 0
      };
    }
    const [enrolled, completed, sessions, points] = await Promise.all([this.prisma.courseProgress.count({
      where: {
        studentId: student.id
      }
    }), this.prisma.courseProgress.count({
      where: {
        studentId: student.id,
        completedAt: {
          not: null
        }
      }
    }), this.prisma.liveSession.count({
      where: {
        status: {
          in: ['SCHEDULED', 'LIVE']
        }
      }
    }), this.prisma.userPoints.findUnique({
      where: {
        userId
      },
      select: {
        total: true
      }
    })]);
    return {
      enrolledCourses: enrolled,
      completedCourses: completed,
      upcomingSessions: sessions,
      totalPoints: points?.total ?? 0
    };
  }
  async getRecentCourses(userId) {
    const student = await this.prisma.student.findUnique({
      where: {
        userId
      },
      select: {
        id: true
      }
    });
    if (!student) {
      return [];
    }
    const progress = await this.prisma.courseProgress.findMany({
      where: {
        studentId: student.id
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            totalLessons: true,
            teacher: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        lastAccessedAt: 'desc'
      },
      take: 5
    });
    return progress.map(p => ({
      id: p.course.id,
      title: p.course.title,
      thumbnailUrl: p.course.thumbnailUrl,
      instructor: p.course.teacher ? `${p.course.teacher.user.firstName} ${p.course.teacher.user.lastName}` : 'Unknown',
      progress: p.course.totalLessons > 0 ? Math.round(p.completedLessons.length / p.course.totalLessons * 100) : Math.round(p.progressPercent),
      nextLesson: null
    }));
  }
  async getRecommendations(userId, tenantId) {
    const student = await this.prisma.student.findUnique({
      where: {
        userId
      },
      select: {
        id: true
      }
    });
    const enrolledIds = student ? (await this.prisma.courseProgress.findMany({
      where: {
        studentId: student.id
      },
      select: {
        courseId: true
      }
    })).map(p => p.courseId) : [];
    const courses = await this.prisma.course.findMany({
      where: {
        tenantId,
        isPublished: true,
        id: {
          notIn: enrolledIds
        }
      },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        category: true,
        rating: true,
        enrollCount: true
      },
      orderBy: {
        rating: 'desc'
      },
      take: 6
    });
    return courses.map(c => ({
      id: c.id,
      title: c.title,
      reason: `Top rated in ${c.category ?? 'General'}`,
      category: c.category ?? 'General',
      thumbnailUrl: c.thumbnailUrl,
      rating: c.rating
    }));
  }
  async getUpcomingSessions(tenantId) {
    return this.prisma.liveSession.findMany({
      where: {
        status: {
          in: ['SCHEDULED', 'LIVE']
        },
        teacher: {
          user: {
            tenantId
          }
        }
      },
      include: {
        teacher: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      },
      take: 5
    });
  }
};
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_redis.RedisService)), __metadata("design:paramtypes", [Object, Object])], DashboardService);