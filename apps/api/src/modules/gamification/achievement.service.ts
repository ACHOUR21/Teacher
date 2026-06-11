import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

export type AchievementTrigger =
  | 'ENROLLMENT'
  | 'COURSE_COMPLETED'
  | 'STREAK_MILESTONE'
  | 'AI_SESSION'
  | 'QUIZ_PERFECT'
  | 'COMMENT_POSTED'
  | 'POINTS_MILESTONE';

export interface AchievementStats {
  enrollments: number;
  completedCourses: number;
  streak: number;
  aiSessions: number;
  perfectQuizzes: number;
  comments: number;
  totalXp: number;
}

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  trigger: AchievementTrigger;
  condition: (stats: AchievementStats) => boolean;
  xpReward: number;
  icon: string;
}

export interface UserAchievementWithDetails {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  earnedAt: Date;
}

const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_course',
    name: 'First Steps',
    description: 'Enroll in your first course',
    trigger: 'ENROLLMENT',
    condition: (stats) => stats.enrollments >= 1,
    xpReward: 50,
    icon: 'school',
  },
  {
    id: 'course_complete',
    name: 'Graduate',
    description: 'Complete your first course',
    trigger: 'COURSE_COMPLETED',
    condition: (stats) => stats.completedCourses >= 1,
    xpReward: 200,
    icon: 'workspace_premium',
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: '7-day study streak',
    trigger: 'STREAK_MILESTONE',
    condition: (stats) => stats.streak >= 7,
    xpReward: 100,
    icon: 'local_fire_department',
  },
  {
    id: 'streak_30',
    name: 'Dedicated Learner',
    description: '30-day study streak',
    trigger: 'STREAK_MILESTONE',
    condition: (stats) => stats.streak >= 30,
    xpReward: 500,
    icon: 'whatshot',
  },
  {
    id: 'ai_power_user',
    name: 'AI Explorer',
    description: 'Use AI tutor 10 times',
    trigger: 'AI_SESSION',
    condition: (stats) => stats.aiSessions >= 10,
    xpReward: 150,
    icon: 'smart_toy',
  },
  {
    id: 'quiz_ace',
    name: 'Quiz Ace',
    description: 'Score 100% on 5 quizzes',
    trigger: 'QUIZ_PERFECT',
    condition: (stats) => stats.perfectQuizzes >= 5,
    xpReward: 300,
    icon: 'stars',
  },
  {
    id: 'social_butterfly',
    name: 'Community Member',
    description: 'Post 10 comments',
    trigger: 'COMMENT_POSTED',
    condition: (stats) => stats.comments >= 10,
    xpReward: 100,
    icon: 'forum',
  },
  {
    id: 'points_500',
    name: 'XP Collector',
    description: 'Earn 500 total XP',
    trigger: 'POINTS_MILESTONE',
    condition: (stats) => stats.totalXp >= 500,
    xpReward: 50,
    icon: 'star',
  },
  {
    id: 'points_1000',
    name: 'XP Master',
    description: 'Earn 1000 total XP',
    trigger: 'POINTS_MILESTONE',
    condition: (stats) => stats.totalXp >= 1000,
    xpReward: 100,
    icon: 'military_tech',
  },
];

@Injectable()
export class AchievementService {
  constructor(private readonly prisma: PrismaService) {}

  async checkAndUnlock(
    userId: string,
    tenantId: string,
    trigger: AchievementTrigger,
  ): Promise<UserAchievementWithDetails[]> {
    // Build stats for the user
    const stats = await this.buildStats(userId);

    // Get already-earned achievement IDs
    const earned = await this.prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const earnedIds = new Set(earned.map((e) => e.achievementId));

    // Filter definitions to those matching the trigger and not yet earned
    const candidates = ACHIEVEMENT_DEFINITIONS.filter(
      (def) => def.trigger === trigger && !earnedIds.has(def.id),
    );

    const newlyUnlocked: UserAchievementWithDetails[] = [];

    for (const def of candidates) {
      if (def.condition(stats)) {
        const now = new Date();
        // Create DB record using achievement id as achievementId
        // Try to find existing Achievement row, create if missing
        let achievementRow = await this.prisma.achievement.findUnique({
          where: { id: def.id },
        });

        if (!achievementRow) {
          achievementRow = await this.prisma.achievement.create({
            data: {
              id: def.id,
              name: def.name,
              description: def.description,
              iconUrl: def.icon,
              type: def.trigger,
              criteria: { trigger: def.trigger, xpReward: def.xpReward },
              points: def.xpReward,
            },
          });
        }

        await this.prisma.userAchievement.create({
          data: { userId, achievementId: def.id },
        });

        // Award XP for the achievement
        await this.prisma.userPoints.upsert({
          where: { userId },
          update: { total: { increment: def.xpReward } },
          create: { userId, total: def.xpReward, level: 1 },
        });

        newlyUnlocked.push({
          id: def.id,
          name: def.name,
          description: def.description,
          icon: def.icon,
          xpReward: def.xpReward,
          earnedAt: now,
        });
      }
    }

    return newlyUnlocked;
  }

  async getUserAchievements(userId: string): Promise<UserAchievementWithDetails[]> {
    const records = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: 'desc' },
    });

    return records.map((r) => {
      const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === r.achievementId);
      return {
        id: r.achievementId,
        name: r.achievement.name,
        description: r.achievement.description ?? '',
        icon: r.achievement.iconUrl ?? def?.icon ?? 'emoji_events',
        xpReward: r.achievement.points,
        earnedAt: r.earnedAt,
      };
    });
  }

  getAllDefinitions(): Omit<AchievementDefinition, 'condition'>[] {
    return ACHIEVEMENT_DEFINITIONS.map(({ condition: _condition, ...rest }) => rest);
  }

  private async buildStats(userId: string): Promise<AchievementStats> {
    const [points, completedCourses, aiSessions, perfectQuizzes] = await Promise.all([
      this.prisma.userPoints.findUnique({ where: { userId } }),
      this.prisma.courseProgress.count({
        where: { student: { userId }, completedAt: { not: null } },
      }),
      this.prisma.gamificationEvent.count({
        where: { userId, eventType: 'ai_tutor_session' },
      }),
      this.prisma.gamificationEvent.count({
        where: { userId, eventType: 'quiz_perfect' },
      }),
    ]);

    // Count enrollments via courseProgress (any enrollment creates a progress record)
    const enrollments = await this.prisma.courseProgress.count({
      where: { student: { userId } },
    });

    // Count comments via gamification events for COMMENT_POSTED
    const comments = await this.prisma.gamificationEvent.count({
      where: { userId, eventType: 'comment_posted' },
    });

    return {
      enrollments,
      completedCourses,
      streak: points?.streak ?? 0,
      aiSessions,
      perfectQuizzes,
      comments,
      totalXp: points?.total ?? 0,
    };
  }
}
