import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

import {
  GamificationEventType,
  RULES_MAP,
} from './domain/gamification-rules';
import { calculateLevel, xpProgress } from './domain/level-calculator';

export interface ProcessEventResult {
  xpAwarded: number;
  newLevel: number | null;
  newAchievements: string[];
  streak: number;
}

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Central entry point for all gamification events.
   * Call this from other services whenever a meaningful action occurs.
   */
  async processEvent(
    userId: string,
    eventType: GamificationEventType,
    metadata?: Record<string, unknown>,
  ): Promise<ProcessEventResult> {
    const rule = RULES_MAP.get(eventType);
    if (!rule) {return { xpAwarded: 0, newLevel: null, newAchievements: [], streak: 0 };}

    // --- deduplication / cap checks ---
    if (rule.once) {
      const already = await this.prisma.gamificationEvent.count({
        where: { userId, eventType },
      });
      if (already > 0) {return { xpAwarded: 0, newLevel: null, newAchievements: [], streak: 0 };}
    }

    if (rule.dailyCap !== undefined) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.gamificationEvent.count({
        where: { userId, eventType, createdAt: { gte: today } },
      });
      if (todayCount >= rule.dailyCap) {
        return { xpAwarded: 0, newLevel: null, newAchievements: [], streak: 0 };
      }
    }

    // --- award XP ---
    const previousPoints = await this.awardPoints(userId, rule.xp);
    const previousLevel = previousPoints?.level ?? 1;

    // Record the event
    await this.prisma.gamificationEvent.create({
      data: { userId, eventType, xpAwarded: rule.xp, metadata: metadata as any },
    });

    // --- update level ---
    const currentPoints = await this.prisma.userPoints.findUnique({ where: { userId } });
    const newLevel = calculateLevel(currentPoints?.total ?? 0);
    let levelChanged: number | null = null;
    if (newLevel !== previousLevel) {
      await this.prisma.userPoints.update({
        where: { userId },
        data: { level: newLevel },
      });
      levelChanged = newLevel;
      await this.notifications.notifyUser(
        userId,
        `Level up! You reached level ${newLevel} 🎉`,
        `Keep going to unlock more rewards.`,
        { type: 'LEVEL_UP', level: newLevel, href: '/gamification' },
      ).catch(() => {});
    }

    // --- streak update for daily_login ---
    let streak = currentPoints?.streak ?? 0;
    if (eventType === 'daily_login') {
      streak = await this.updateStreak(userId);
    }

    // --- check achievements ---
    const newAchievements = await this.checkAndAwardAchievements(userId);

    this.logger.debug(`processEvent ${eventType} for ${userId}: +${rule.xp} XP`);
    return { xpAwarded: rule.xp, newLevel: levelChanged, newAchievements, streak };
  }

  private async updateStreak(userId: string): Promise<number> {
    const record = await this.prisma.userPoints.findUnique({ where: { userId } });
    if (!record) {return 0;}

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const last = record.lastActivityDate ? new Date(record.lastActivityDate) : null;
    last?.setHours(0, 0, 0, 0);

    let newStreak = record.streak;

    if (!last) {
      newStreak = 1;
    } else if (last.getTime() === today.getTime()) {
      // already logged in today — no change
      return newStreak;
    } else if (last.getTime() === yesterday.getTime()) {
      newStreak = record.streak + 1;
    } else {
      newStreak = 1;
    }

    const longest = Math.max(newStreak, record.longestStreak);

    await this.prisma.userPoints.update({
      where: { userId },
      data: { streak: newStreak, longestStreak: longest, lastActivityDate: today },
    });

    // fire streak milestone events without double-counting
    if (newStreak === 7) {await this.processEvent(userId, 'streak_7');}
    if (newStreak === 30) {await this.processEvent(userId, 'streak_30');}

    return newStreak;
  }

  async awardPoints(userId: string, points: number) {
    return this.prisma.userPoints.upsert({
      where: { userId },
      update: { total: { increment: points } },
      create: { userId, total: points },
    });
  }

  async getUserPoints(userId: string) {
    return this.prisma.userPoints.findUnique({ where: { userId } });
  }

  async checkAndAwardAchievements(userId: string): Promise<string[]> {
    const userPoints = await this.prisma.userPoints.findUnique({ where: { userId } });
    const earnedIds = (
      await this.prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      })
    ).map(a => a.achievementId);

    const allAchievements = await this.prisma.achievement.findMany({
      where: { id: { notIn: earnedIds } },
    });

    const newlyEarned: string[] = [];
    for (const achievement of allAchievements) {
      const criteria = achievement.criteria as Record<string, unknown>;
      let earned = false;

      if (criteria.type === 'points' && (userPoints?.total ?? 0) >= (criteria.threshold as number)) {
        earned = true;
      } else if (criteria.type === 'course_completion') {
        const completed = await this.prisma.courseProgress.count({
          where: { student: { userId }, completedAt: { not: null } },
        });
        earned = completed >= (criteria.threshold as number);
      } else if (criteria.type === 'streak' && (userPoints?.streak ?? 0) >= (criteria.threshold as number)) {
        earned = true;
      } else if (criteria.type === 'level' && (userPoints?.level ?? 1) >= (criteria.threshold as number)) {
        earned = true;
      }

      if (earned) {
        await this.prisma.userAchievement.create({ data: { userId, achievementId: achievement.id } });
        newlyEarned.push(achievement.id);
        await this.notifications.notifyUser(
          userId,
          'Achievement Unlocked! 🏆',
          `You earned the "${achievement.name}" achievement`,
          { type: 'ACHIEVEMENT_EARNED', achievementId: achievement.id, href: '/gamification' },
        ).catch(() => {});
      }
    }

    return newlyEarned;
  }

  async getLeaderboard(tenantId: string, limit = 20) {
    return this.prisma.userPoints.findMany({
      where: { user: { tenantId } },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { total: 'desc' },
      take: limit,
    });
  }

  async getUserAchievements(userId: string) {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: 'desc' },
    });
  }

  async getAllAchievements() {
    return this.prisma.achievement.findMany({ orderBy: { points: 'desc' } });
  }

  async getRecentEvents(userId: string, limit = 20) {
    return this.prisma.gamificationEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getMyStats(userId: string, tenantId: string) {
    const [points, achievementCount] = await Promise.all([
      this.prisma.userPoints.findUnique({ where: { userId } }),
      this.prisma.userAchievement.count({ where: { userId } }),
    ]);

    const myPoints = points?.total ?? 0;

    const rank = await this.prisma.userPoints.count({
      where: { user: { tenantId }, total: { gt: myPoints } },
    });

    // Real weekly XP from event log
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyAgg = await this.prisma.gamificationEvent.aggregate({
      where: { userId, createdAt: { gte: weekAgo } },
      _sum: { xpAwarded: true },
    });

    const progress = xpProgress(myPoints);

    return {
      totalPoints: myPoints,
      weeklyPoints: weeklyAgg._sum.xpAwarded ?? 0,
      achievementCount,
      rank: rank + 1,
      level: progress.level,
      streak: points?.streak ?? 0,
      longestStreak: points?.longestStreak ?? 0,
      xpProgress: progress,
    };
  }
}
