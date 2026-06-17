/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Query, UseGuards, Request, Param } from '@nestjs/common';
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

  @Get('teacher/overview')
  @ApiOperation({ summary: 'Teacher analytics overview' })
  @Roles('TEACHER', 'ADMIN', 'SUPER_ADMIN')
  teacherOverview(@Request() req: any) {
    const teacherId = req.user?.teacherProfileId ?? req.user?.sub;
    return this.analyticsService.getTeacherOverview(teacherId);
  }

  @Get('teacher/courses')
  @ApiOperation({ summary: 'Teacher course performance' })
  @Roles('TEACHER', 'ADMIN', 'SUPER_ADMIN')
  teacherCourses(@Request() req: any) {
    const teacherId = req.user?.teacherProfileId ?? req.user?.sub;
    return this.analyticsService.getTeacherCoursePerformance(teacherId);
  }

  @Get('teacher/enrollment-trend')
  @ApiOperation({ summary: 'Teacher enrollment trend over time' })
  @Roles('TEACHER', 'ADMIN', 'SUPER_ADMIN')
  teacherEnrollmentTrend(@Request() req: any, @Query('days') days = 30) {
    const teacherId = req.user?.teacherProfileId ?? req.user?.sub;
    return this.analyticsService.getTeacherEnrollmentTrend(teacherId, +days);
  }

  @Get('teacher/top-students')
  @ApiOperation({ summary: 'Top performing students for a teacher' })
  @Roles('TEACHER', 'ADMIN', 'SUPER_ADMIN')
  teacherTopStudents(@Request() req: any) {
    const teacherId = req.user?.teacherProfileId ?? req.user?.sub;
    return this.analyticsService.getTeacherTopStudents(teacherId);
  }

  @Get('student/overview')
  @ApiOperation({ summary: 'Student analytics overview' })
  studentOverview(@Request() req: any) {
    const studentId = req.user?.studentProfileId ?? req.user?.sub;
    return this.analyticsService.getStudentOverview(studentId);
  }

  @Get('student/performance')
  @ApiOperation({ summary: 'Student performance by subject' })
  studentPerformance(@Request() req: any) {
    const studentId = req.user?.studentProfileId ?? req.user?.sub;
    return this.analyticsService.getStudentPerformance(studentId);
  }

  @Get('student/activity')
  @ApiOperation({ summary: 'Student activity heatmap data' })
  studentActivity2(@Request() req: any) {
    const studentId = req.user?.studentProfileId ?? req.user?.sub;
    return this.analyticsService.getStudentActivityHeatmap(studentId);
  }

  @Get('admin/platform')
  @ApiOperation({ summary: 'Admin platform overview KPIs' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN')
  adminPlatform(@Request() req: any) {
    return this.analyticsService.getAdminPlatformOverview(req.tenant?.id);
  }

  @Get('admin/cohort')
  @ApiOperation({ summary: 'Cohort retention analysis' })
  @Roles('ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN')
  adminCohort(@Request() req: any) {
    return this.analyticsService.getCohortRetention(req.tenant?.id);
  }

  @Get('admin/top-tenants')
  @ApiOperation({ summary: 'Top tenants by users and revenue' })
  @Roles('SUPER_ADMIN')
  adminTopTenants() {
    return this.analyticsService.getTopTenants();
  }
}
