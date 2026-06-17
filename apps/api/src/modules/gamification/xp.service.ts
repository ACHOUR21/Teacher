import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { calculateLevel } from './domain/level-calculator';

export type XpAction =
  | 'LESSON_COMPLETED'
  | 'COURSE_COMPLETED'
  | 'QUIZ_PASSED'
  | 'QUIZ_PERFECT'
  | 'FLASHCARD_REVIEWED'
  | 'AI_TUTOR_SESSION'
  | 'DAILY_LOGIN'
  | 'ASSIGNMENT_SUBMITTED'
  | 'COMMENT_POSTED'
  | 'PEER_HELPED';

export interface XpAwardResult {
  xp: number;
  totalXp: number;
  levelUp: boolean;
  newLevel?: number;
}

export interface XpProgressInfo {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progress: number;
}

@Injectable()
export class XpService {
  private readonly XP_AWARDS: Record<XpAction, number> = {
    LESSON_COMPLETED: 10,
    COURSE_COMPLETED: 100,
    QUIZ_PASSED: 25,
    QUIZ_PERFECT: 50,
    FLASHCARD_REVIEWED: 2,
    AI_TUTOR_SESSION: 5,
    DAILY_LOGIN: 15,
    ASSIGNMENT_SUBMITTED: 20,
    COMMENT_POSTED: 3,
    PEER_HELPED: 10,
  };

  constructor(private readonly prisma: PrismaService) {}

  getLevel(totalXp: number): number {
    return calculateLevel(totalXp);
  }

  getXpForNextLevel(currentLevel: number): number {
    // Using the formula: level*(level-1)*50 = xp threshold for that level
    return (currentLevel + 1) * currentLevel * 50;
  }

  getProgressToNextLevel(totalXp: number): XpProgressInfo {
    const level = this.getLevel(totalXp);
    const currentLevelXp = level <= 1 ? 0 : level * (level - 1) * 50;
    const nextLevelXp = (level + 1) * level * 50;
    const xpIntoLevel = totalXp - currentLevelXp;
    const xpNeededForLevel = nextLevelXp - currentLevelXp;
    const progress = xpNeededForLevel > 0
      ? Math.min(100, Math.round((xpIntoLevel / xpNeededForLevel) * 100))
      : 100;
    return {
      level,
      currentXp: xpIntoLevel,
      nextLevelXp: xpNeededForLevel,
      progress,
    };
  }

  async awardXp(
    userId: string,
    tenantId: string,
    action: XpAction,
    multiplier = 1,
  ): Promise<XpAwardResult> {
    const xp = (this.XP_AWARDS[action] ?? 0) * multiplier;
    if (xp <= 0) {
      const current = await this.prisma.userPoints.findUnique({ where: { userId } });
      const totalXp = current?.total ?? 0;
      return { xp: 0, totalXp, levelUp: false };
    }

    // Get current state before awarding
    const before = await this.prisma.userPoints.findUnique({ where: { userId } });
    const oldLevel = calculateLevel(before?.total ?? 0);

    // Upsert user points
    const updated = await this.prisma.userPoints.upsert({
      where: { userId },
      update: { total: { increment: xp } },
      create: { userId, total: xp, level: 1 },
    });

    const totalXp = updated.total;
    const newLevel = calculateLevel(totalXp);
    const levelUp = newLevel > oldLevel;

    // Record gamification event
    await this.prisma.gamificationEvent.create({
      data: {
        userId,
        eventType: action.toLowerCase(),
        xpAwarded: xp,
        metadata: { action, multiplier, tenantId },
      },
    });

    // Persist the updated level
    if (levelUp) {
      await this.prisma.userPoints.update({
        where: { userId },
        data: { level: newLevel },
      });
    }

    return {
      xp,
      totalXp,
      levelUp,
      ...(levelUp ? { newLevel } : {}),
    };
  }

  getXpAwards(): Record<XpAction, number> {
    return { ...this.XP_AWARDS };
  }
}
