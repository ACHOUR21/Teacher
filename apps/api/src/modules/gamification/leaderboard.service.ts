import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { calculateLevel } from './domain/level-calculator';

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all-time';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  xp: number;
  level: number;
  badge: string;
}

export interface UserRankResult {
  rank: number;
  totalParticipants: number;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(
    tenantId: string,
    period: LeaderboardPeriod = 'all-time',
    limit = 50,
  ): Promise<LeaderboardEntry[]> {
    if (period === 'all-time') {
      return this.getAllTimeLeaderboard(tenantId, limit);
    }
    return this.getPeriodLeaderboard(tenantId, period, limit);
  }

  async getUserRank(
    userId: string,
    tenantId: string,
    period: LeaderboardPeriod = 'all-time',
  ): Promise<UserRankResult> {
    if (period === 'all-time') {
      const userPoints = await this.prisma.userPoints.findUnique({
        where: { userId },
      });
      const userXp = userPoints?.total ?? 0;

      const [rank, total] = await Promise.all([
        this.prisma.userPoints.count({
          where: { user: { tenantId }, total: { gt: userXp } },
        }),
        this.prisma.userPoints.count({
          where: { user: { tenantId } },
        }),
      ]);

      return { rank: rank + 1, totalParticipants: total };
    }

    // Period-based rank
    const since = this.getPeriodStart(period);
    const xpInPeriodAgg = await this.prisma.gamificationEvent.aggregate({
      where: { userId, createdAt: { gte: since } },
      _sum: { xpAwarded: true },
    });
    const userXp = xpInPeriodAgg._sum.xpAwarded ?? 0;

    // Count users in tenant who earned more XP in this period
    const allUsersXp = await this.prisma.gamificationEvent.groupBy({
      by: ['userId'],
      where: {
        user: { tenantId },
        createdAt: { gte: since },
      },
      _sum: { xpAwarded: true },
    });

    const higherCount = allUsersXp.filter(
      (u) => (u._sum.xpAwarded ?? 0) > userXp,
    ).length;

    return {
      rank: higherCount + 1,
      totalParticipants: allUsersXp.length,
    };
  }

  private async getAllTimeLeaderboard(
    tenantId: string,
    limit: number,
  ): Promise<LeaderboardEntry[]> {
    const rows = await this.prisma.userPoints.findMany({
      where: { user: { tenantId } },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            achievements: {
              include: { achievement: true },
              orderBy: { earnedAt: 'asc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { total: 'desc' },
      take: limit,
    });

    return rows.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      displayName: `${row.user.firstName} ${row.user.lastName}`.trim(),
      avatarUrl: row.user.avatarUrl,
      xp: row.total,
      level: calculateLevel(row.total),
      badge: this.getHighestBadge(row.user.achievements),
    }));
  }

  private async getPeriodLeaderboard(
    tenantId: string,
    period: 'weekly' | 'monthly',
    limit: number,
  ): Promise<LeaderboardEntry[]> {
    const since = this.getPeriodStart(period);

    const grouped = await this.prisma.gamificationEvent.groupBy({
      by: ['userId'],
      where: {
        user: { tenantId },
        createdAt: { gte: since },
      },
      _sum: { xpAwarded: true },
      orderBy: { _sum: { xpAwarded: 'desc' } },
      take: limit,
    });

    if (grouped.length === 0) {return [];}

    const userIds = grouped.map((g) => g.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        points: true,
        achievements: {
          include: { achievement: true },
          orderBy: { earnedAt: 'asc' },
          take: 1,
        },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return grouped.map((g, index) => {
      const user = userMap.get(g.userId);
      const totalXp = user?.points?.total ?? 0;
      return {
        rank: index + 1,
        userId: g.userId,
        displayName: user
          ? `${user.firstName} ${user.lastName}`.trim()
          : 'Unknown',
        avatarUrl: user?.avatarUrl ?? null,
        xp: g._sum.xpAwarded ?? 0,
        level: calculateLevel(totalXp),
        badge: this.getHighestBadge(user?.achievements ?? []),
      };
    });
  }

  private getPeriodStart(period: 'weekly' | 'monthly'): Date {
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

  private getHighestBadge(
    achievements: Array<{ achievement: { iconUrl: string | null; points: number } }>,
  ): string {
    if (achievements.length === 0) {return 'emoji_events';}
    const sorted = [...achievements].sort(
      (a, b) => b.achievement.points - a.achievement.points,
    );
    return sorted[0].achievement.iconUrl ?? 'emoji_events';
  }
}
