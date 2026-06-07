import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { CurrentUser } from '../core/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard stats for current user' })
  stats(@CurrentUser() user: any) {
    return this.dashboardService.getStats(user.id);
  }

  @Get('recent-courses')
  @ApiOperation({ summary: 'Get recently accessed courses' })
  recentCourses(@CurrentUser() user: any) {
    return this.dashboardService.getRecentCourses(user.id);
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get AI course recommendations' })
  recommendations(@CurrentUser() user: any, @Request() req: any) {
    return this.dashboardService.getRecommendations(user.id, req.tenant?.id);
  }

  @Get('upcoming-sessions')
  @ApiOperation({ summary: 'Get upcoming live sessions' })
  upcomingSessions(@Request() req: any) {
    return this.dashboardService.getUpcomingSessions(req.tenant?.id);
  }
}
