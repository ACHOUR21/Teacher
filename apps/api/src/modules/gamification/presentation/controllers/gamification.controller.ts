import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GamificationService } from '../../gamification.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';

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
}
