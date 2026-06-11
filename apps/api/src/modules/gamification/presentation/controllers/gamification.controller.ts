/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { FEATURE_FLAGS } from '../../../feature-flags/feature-flags.constants';
import { FeatureFlagGuard, RequireFeature } from '../../../feature-flags/feature-flag.guard';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { GamificationEventType } from '../../domain/gamification-rules';
import { GamificationService } from '../../gamification.service';
import { XpService } from '../../xp.service';
import { StreakService } from '../../streak.service';
import { AchievementService } from '../../achievement.service';
import { LeaderboardService, LeaderboardPeriod } from '../../leaderboard.service';

@ApiTags('Gamification')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@RequireFeature(FEATURE_FLAGS.GAMIFICATION)
@Controller('gamification')
export class GamificationController {
  constructor(
    private readonly gamificationService: GamificationService,
    private readonly xpService: XpService,
    private readonly streakService: StreakService,
    private readonly achievementService: AchievementService,
    private readonly leaderboardService: LeaderboardService,
  ) {}

  // ---------------------------------------------------------------------------
  // Legacy endpoints (preserved for backwards compatibility)
  // ---------------------------------------------------------------------------

  @Get('stats')
  @ApiOperation({ summary: 'Get current user gamification stats' })
  myStats(@CurrentUser() user: any, @Request() req: any) {
    return this.gamificationService.getMyStats(user.id, req.tenant?.id);
  }

  @Get('points')
  @ApiOperation({ summary: 'Get current user points' })
  myPoints(@CurrentUser() user: any) {
    return this.gamificationService.getUserPoints(user.id);
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Get all available achievements' })
  allAchievements() {
    return this.gamificationService.getAllAchievements();
  }

  @Get('achievements/my')
  @ApiOperation({ summary: 'Get current user achievements' })
  myAchievements(@CurrentUser() user: any) {
    return this.gamificationService.getUserAchievements(user.id);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get recent XP activity feed for current user' })
  recentEvents(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.gamificationService.getRecentEvents(user.id, limit ? parseInt(limit, 10) : 20);
  }

  @Post('event')
  @ApiOperation({ summary: 'Record a gamification event (internal / debug)' })
  recordEvent(
    @CurrentUser() user: any,
    @Body() body: { eventType: GamificationEventType; metadata?: Record<string, unknown> },
  ) {
    return this.gamificationService.processEvent(user.id, body.eventType, body.metadata);
  }

  // ---------------------------------------------------------------------------
  // New enhanced endpoints
  // ---------------------------------------------------------------------------

  @Get('me')
  @ApiOperation({ summary: 'Get XP, level, progress to next level, streak, and achievement count' })
  async getMe(@CurrentUser() user: any, @Request() req: any) {
    const tenantId: string = req.tenant?.id ?? '';
    const [stats, streak, achievements] = await Promise.all([
      this.gamificationService.getMyStats(user.id, tenantId),
      this.streakService.getStreak(user.id),
      this.achievementService.getUserAchievements(user.id),
    ]);
    const progress = this.xpService.getProgressToNextLevel(stats.totalPoints);
    return {
      totalXp: stats.totalPoints,
      weeklyXp: stats.weeklyPoints,
      level: progress.level,
      xpProgress: progress,
      streak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActivityDate: streak.lastActivityDate,
      rank: stats.rank,
      achievementsCount: achievements.length,
    };
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get tenant leaderboard with optional period filter' })
  @ApiQuery({ name: 'period', enum: ['weekly', 'monthly', 'all-time'], required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getLeaderboard(
    @Request() req: any,
    @Query('period') period?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId: string = req.tenant?.id ?? '';
    const validPeriod = (['weekly', 'monthly', 'all-time'] as const).includes(
      period as LeaderboardPeriod,
    )
      ? (period as LeaderboardPeriod)
      : 'all-time';
    return this.leaderboardService.getLeaderboard(
      tenantId,
      validPeriod,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('my-rank')
  @ApiOperation({ summary: "Get current user's rank in the leaderboard" })
  @ApiQuery({ name: 'period', enum: ['weekly', 'monthly', 'all-time'], required: false })
  async getMyRank(
    @CurrentUser() user: any,
    @Request() req: any,
    @Query('period') period?: string,
  ) {
    const tenantId: string = req.tenant?.id ?? '';
    const validPeriod = (['weekly', 'monthly', 'all-time'] as const).includes(
      period as LeaderboardPeriod,
    )
      ? (period as LeaderboardPeriod)
      : 'all-time';
    return this.leaderboardService.getUserRank(user.id, tenantId, validPeriod);
  }

  @Get('my-achievements')
  @ApiOperation({ summary: "Get current user's unlocked achievements with icons and dates" })
  async getMyAchievements(@CurrentUser() user: any) {
    return this.achievementService.getUserAchievements(user.id);
  }

  @Get('xp-history')
  @ApiOperation({ summary: 'Get last 30 days of XP earned per day (for chart)' })
  async getXpHistory(@CurrentUser() user: any) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const events = await this.gamificationService.getRecentEvents(user.id, 500);
    const filtered = events.filter((e) => new Date(e.createdAt) >= thirtyDaysAgo);

    // Aggregate by day
    const byDay = new Map<string, number>();
    for (const event of filtered) {
      const day = new Date(event.createdAt).toISOString().split('T')[0];
      byDay.set(day, (byDay.get(day) ?? 0) + event.xpAwarded);
    }

    // Build a 30-day array with zeros for missing days
    const result: Array<{ date: string; xp: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({ date: dateStr, xp: byDay.get(dateStr) ?? 0 });
    }

    return result;
  }

  @Post('daily-login')
  @ApiOperation({ summary: 'Record daily login, award XP, and check streak' })
  async recordDailyLogin(@CurrentUser() user: any, @Request() req: any) {
    const tenantId: string = req.tenant?.id ?? '';

    // Award XP via the main gamification pipeline (handles dedup/daily cap)
    const eventResult = await this.gamificationService.processEvent(user.id, 'daily_login');

    // Update streak
    const streakResult = await this.streakService.recordActivity(user.id, tenantId);

    // Check streak-based achievements if streak changed
    let newAchievements: any[] = [];
    if (streakResult.isNewDay) {
      newAchievements = await this.achievementService.checkAndUnlock(
        user.id,
        tenantId,
        'STREAK_MILESTONE',
      );
    }

    return {
      xpAwarded: eventResult.xpAwarded,
      levelUp: eventResult.newLevel !== null,
      newLevel: eventResult.newLevel,
      streak: streakResult.streak,
      isNewDay: streakResult.isNewDay,
      streakBroken: streakResult.streakBroken,
      newAchievements,
    };
  }
}
