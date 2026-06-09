import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { GamificationEventType } from '../../domain/gamification-rules';
import { GamificationService } from '../../gamification.service';

@ApiTags('Gamification')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

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

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get tenant leaderboard' })
  leaderboard(@Request() req: any) {
    return this.gamificationService.getLeaderboard(req.tenant?.id);
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
}
