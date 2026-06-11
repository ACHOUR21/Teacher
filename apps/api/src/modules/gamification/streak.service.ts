import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

export interface StreakActivityResult {
  streak: number;
  isNewDay: boolean;
  streakBroken: boolean;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

@Injectable()
export class StreakService {
  constructor(private readonly prisma: PrismaService) {}

  async recordActivity(userId: string, tenantId: string): Promise<StreakActivityResult> {
    const record = await this.prisma.userPoints.findUnique({ where: { userId } });

    const todayUtc = this.startOfDayUtc(new Date());
    const yesterdayUtc = new Date(todayUtc);
    yesterdayUtc.setUTCDate(yesterdayUtc.getUTCDate() - 1);

    if (!record) {
      // First ever activity
      await this.prisma.userPoints.create({
        data: {
          userId,
          total: 0,
          level: 1,
          streak: 1,
          longestStreak: 1,
          lastActivityDate: todayUtc,
        },
      });
      return { streak: 1, isNewDay: true, streakBroken: false };
    }

    const lastActivity = record.lastActivityDate
      ? this.startOfDayUtc(record.lastActivityDate)
      : null;

    // Same day — no change
    if (lastActivity && lastActivity.getTime() === todayUtc.getTime()) {
      return { streak: record.streak, isNewDay: false, streakBroken: false };
    }

    let newStreak: number;
    let streakBroken = false;

    if (!lastActivity) {
      // No previous activity
      newStreak = 1;
    } else if (lastActivity.getTime() === yesterdayUtc.getTime()) {
      // Consecutive day
      newStreak = record.streak + 1;
    } else {
      // Gap in activity — streak broken
      newStreak = 1;
      streakBroken = true;
    }

    const newLongest = Math.max(newStreak, record.longestStreak);

    await this.prisma.userPoints.update({
      where: { userId },
      data: {
        streak: newStreak,
        longestStreak: newLongest,
        lastActivityDate: todayUtc,
      },
    });

    return { streak: newStreak, isNewDay: true, streakBroken };
  }

  async getStreak(userId: string): Promise<StreakInfo> {
    const record = await this.prisma.userPoints.findUnique({ where: { userId } });
    return {
      currentStreak: record?.streak ?? 0,
      longestStreak: record?.longestStreak ?? 0,
      lastActivityDate: record?.lastActivityDate?.toISOString() ?? null,
    };
  }

  private startOfDayUtc(date: Date): Date {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
}
