import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { Roles } from '../../../core/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { AnalyticsService } from '../../analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Platform overview stats' })
  overview(@Request() req: any) {
    return this.analyticsService.getPlatformStats(req.tenant?.id);
  }

  @Get('user-growth')
  @ApiOperation({ summary: 'User growth over time' })
  userGrowth(@Request() req: any, @Query('days') days = 30) {
    return this.analyticsService.getUserGrowth(req.tenant?.id, +days);
  }

  @Get('courses')
  @ApiOperation({ summary: 'Top courses by enrollment' })
  courseStats(@Request() req: any) {
    return this.analyticsService.getCourseStats(req.tenant?.id);
  }

  @Get('student-activity')
  @ApiOperation({ summary: 'Student activity metrics' })
  studentActivity(@Request() req: any, @Query('days') days = 7) {
    return this.analyticsService.getStudentActivity(req.tenant?.id, +days);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Revenue analytics' })
  @Roles('ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
  revenue(@Request() req: any, @Query('months') months = 6) {
    return this.analyticsService.getRevenueAnalytics(req.tenant?.id, +months);
  }

  @Get('ai-usage')
  @ApiOperation({ summary: 'AI feature usage statistics' })
  aiUsage(@Request() req: any) {
    return this.analyticsService.getAIUsageStats(req.tenant?.id);
  }

  @Get('engagement')
  @ApiOperation({ summary: 'Student engagement heatmap (day × hour)' })
  engagement(@Request() req: any) {
    return this.analyticsService.getEngagementHeatmap(req.tenant?.id);
  }

  @Get('top-courses')
  @ApiOperation({ summary: 'Top courses with completion rates' })
  topCourses(@Request() req: any) {
    return this.analyticsService.getTopCourses(req.tenant?.id);
  }
}
