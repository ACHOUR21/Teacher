"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LeaderboardService = void 0;
var _common = require("@nestjs/common");
var _prisma = require("../database/prisma.service");
var _levelCalculator = require("./domain/level-calculator");
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
let LeaderboardService = exports.LeaderboardService = class LeaderboardService {
  constructor(prisma) {
    this.prisma = prisma;
  }
  async getLeaderboard(tenantId, period = 'all-time', limit = 50) {
    if (period === 'all-time') {
      return this.getAllTimeLeaderboard(tenantId, limit);
    }
    return this.getPeriodLeaderboard(tenantId, period, limit);
  }
  async getUserRank(userId, tenantId, period = 'all-time') {
    if (period === 'all-time') {
      const userPoints = await this.prisma.userPoints.findUnique({
        where: {
          userId
        }
      });
      const userXp = userPoints?.total ?? 0;
      const [rank, total] = await Promise.all([this.prisma.userPoints.count({
        where: {
          user: {
            tenantId
          },
          total: {
            gt: userXp
          }
        }
      }), this.prisma.userPoints.count({
        where: {
          user: {
            tenantId
          }
        }
      })]);
      return {
        rank: rank + 1,
        totalParticipants: total
      };
    }
    // Period-based rank
    const since = this.getPeriodStart(period);
    const xpInPeriodAgg = await this.prisma.gamificationEvent.aggregate({
      where: {
        userId,
        createdAt: {
          gte: since
        }
      },
      _sum: {
        xpAwarded: true
      }
    });
    const userXp = xpInPeriodAgg._sum.xpAwarded ?? 0;
    // Count users in tenant who earned more XP in this period
    const allUsersXp = await this.prisma.gamificationEvent.groupBy({
      by: ['userId'],
      where: {
        user: {
          tenantId
        },
        createdAt: {
          gte: since
        }
      },
      _sum: {
        xpAwarded: true
      }
    });
    const higherCount = allUsersXp.filter(u => (u._sum.xpAwarded ?? 0) > userXp).length;
    return {
      rank: higherCount + 1,
      totalParticipants: allUsersXp.length
    };
  }
  async getAllTimeLeaderboard(tenantId, limit) {
    const rows = await this.prisma.userPoints.findMany({
      where: {
        user: {
          tenantId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            achievements: {
              include: {
                achievement: true
              },
              orderBy: {
                earnedAt: 'asc'
              },
              take: 1
            }
          }
        }
      },
      orderBy: {
        total: 'desc'
      },
      take: limit
    });
    return rows.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      displayName: `${row.user.firstName} ${row.user.lastName}`.trim(),
      avatarUrl: row.user.avatarUrl,
      xp: row.total,
      level: (0, _levelCalculator.calculateLevel)(row.total),
      badge: this.getHighestBadge(row.user.achievements)
    }));
  }
  async getPeriodLeaderboard(tenantId, period, limit) {
    const since = this.getPeriodStart(period);
    const grouped = await this.prisma.gamificationEvent.groupBy({
      by: ['userId'],
      where: {
        user: {
          tenantId
        },
        createdAt: {
          gte: since
        }
      },
      _sum: {
        xpAwarded: true
      },
      orderBy: {
        _sum: {
          xpAwarded: 'desc'
        }
      },
      take: limit
    });
    if (grouped.length === 0) {
      return [];
    }
    const userIds = grouped.map(g => g.userId);
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        points: true,
        achievements: {
          include: {
            achievement: true
          },
          orderBy: {
            earnedAt: 'asc'
          },
          take: 1
        }
      }
    });
    const userMap = new Map(users.map(u => [u.id, u]));
    return grouped.map((g, index) => {
      const user = userMap.get(g.userId);
      const totalXp = user?.points?.total ?? 0;
      return {
        rank: index + 1,
        userId: g.userId,
        displayName: user ? `${user.firstName} ${user.lastName}`.trim() : 'Unknown',
        avatarUrl: user?.avatarUrl ?? null,
        xp: g._sum.xpAwarded ?? 0,
        level: (0, _levelCalculator.calculateLevel)(totalXp),
        badge: this.getHighestBadge(user?.achievements ?? [])
      };
    });
  }
  getPeriodStart(period) {
    const now = new Date();
    if (period === 'weekly') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  getHighestBadge(achievements) {
    if (achievements.length === 0) {
      return 'emoji_events';
    }
    const sorted = [...achievements].sort((a, b) => b.achievement.points - a.achievement.points);
    return sorted[0].achievement.iconUrl ?? 'emoji_events';
  }
};
exports.LeaderboardService = LeaderboardService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], LeaderboardService);