import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

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

  async checkAndAwardAchievements(userId: string) {
    const userPoints = await this.prisma.userPoints.findUnique({ where: { userId } });
    const earnedIds = (await this.prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } })).map(a => a.achievementId);

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
        const completed = await this.prisma.courseProgress.count({ where: { student: { userId }, completedAt: { not: null } } });
        earned = completed >= (criteria.threshold as number);
      }

      if (earned) {
        await this.prisma.userAchievement.create({ data: { userId, achievementId: achievement.id } });
        newlyEarned.push(achievement.id);
      }
    }

    return newlyEarned;
  }

  async getLeaderboard(tenantId: string, limit = 20) {
    return this.prisma.userPoints.findMany({
      where: { user: { tenantId } },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
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

  async getMyStats(userId: string, tenantId: string) {
    const [points, achievementCount] = await Promise.all([
      this.prisma.userPoints.findUnique({ where: { userId } }),
      this.prisma.userAchievement.count({ where: { userId } }),
    ]);

    const myPoints = points?.total ?? 0;
    const rank = await this.prisma.userPoints.count({
      where: { user: { tenantId }, total: { gt: myPoints } },
    });

    return {
      totalPoints: myPoints,
      weeklyPoints: 0,
      achievementCount,
      rank: rank + 1,
      level: points?.level ?? 1,
    };
  }
}
