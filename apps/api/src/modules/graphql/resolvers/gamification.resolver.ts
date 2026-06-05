import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GamificationService } from '../../gamification/gamification.service';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { GamificationProfile, LeaderboardEntry } from '../types/gamification.types';

@Resolver()
export class GamificationResolver {
  constructor(private readonly gamificationService: GamificationService) {}

  @Query(() => GamificationProfile, { name: 'myGamificationProfile' })
  @UseGuards(GqlAuthGuard)
  async getProfile(@CurrentUser() user: { id: string; tenantId: string }) {
    const [pointsRecord, rawAchievements] = await Promise.all([
      this.gamificationService.getUserPoints(user.id),
      this.gamificationService.getUserAchievements(user.id),
    ]);
    return {
      points: pointsRecord
        ? { total: (pointsRecord as any).total, level: Math.floor((pointsRecord as any).total / 100) }
        : null,
      achievements: (rawAchievements as any[]).map(ua => ({
        id: ua.achievement.id,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        points: ua.achievement.points,
        unlockedAt: ua.earnedAt,
      })),
    };
  }

  @Query(() => [LeaderboardEntry], { name: 'leaderboard' })
  @UseGuards(GqlAuthGuard)
  async getLeaderboard(
    @CurrentUser() user: { tenantId: string },
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ) {
    const entries = await this.gamificationService.getLeaderboard(user.tenantId, limit);
    return entries.map((entry: any, index: number) => ({
      rank: index + 1,
      userId: entry.user.id,
      firstName: entry.user.firstName,
      lastName: entry.user.lastName,
      avatarUrl: entry.user.avatarUrl,
      points: entry.total,
      level: Math.floor(entry.total / 100),
    }));
  }
}
