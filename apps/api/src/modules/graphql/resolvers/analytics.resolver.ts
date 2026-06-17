/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, Int } from '@nestjs/graphql';

import { AnalyticsService } from '../../analytics/analytics.service';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import {
  PlatformStats,
  DailyGrowth,
  StudentActivity,
  MonthlyRevenue,
  AIModuleUsage,
} from '../types/analytics.types';

@Resolver()
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => PlatformStats, { name: 'platformStats', description: 'Platform-wide statistics' })
  @UseGuards(GqlAuthGuard)
  async getPlatformStats(
    @CurrentUser() user: { tenantId: string },
  ): Promise<PlatformStats> {
    return this.analyticsService.getPlatformStats(user.tenantId) as Promise<PlatformStats>;
  }

  @Query(() => [DailyGrowth], { name: 'userGrowth', description: 'Daily user registrations over N days' })
  @UseGuards(GqlAuthGuard)
  async getUserGrowth(
    @Args('days', { type: () => Int, nullable: true, defaultValue: 30 }) days: number,
    @CurrentUser() user: { tenantId: string },
  ): Promise<DailyGrowth[]> {
    return this.analyticsService.getUserGrowth(user.tenantId, days) as Promise<DailyGrowth[]>;
  }

  @Query(() => StudentActivity, { name: 'studentActivity', description: 'Student engagement metrics' })
  @UseGuards(GqlAuthGuard)
  async getStudentActivity(
    @Args('days', { type: () => Int, nullable: true, defaultValue: 7 }) days: number,
    @CurrentUser() user: { tenantId: string },
  ): Promise<StudentActivity> {
    return this.analyticsService.getStudentActivity(user.tenantId, days) as Promise<StudentActivity>;
  }

  @Query(() => [MonthlyRevenue], { name: 'revenueAnalytics', description: 'Monthly revenue breakdown' })
  @UseGuards(GqlAuthGuard)
  async getRevenueAnalytics(
    @Args('months', { type: () => Int, nullable: true, defaultValue: 6 }) months: number,
    @CurrentUser() user: { tenantId: string },
  ): Promise<MonthlyRevenue[]> {
    return this.analyticsService.getRevenueAnalytics(user.tenantId, months) as Promise<MonthlyRevenue[]>;
  }

  @Query(() => [AIModuleUsage], { name: 'aiUsageStats', description: 'AI token usage by module' })
  @UseGuards(GqlAuthGuard)
  async getAIUsageStats(
    @CurrentUser() user: { tenantId: string },
  ): Promise<AIModuleUsage[]> {
    const raw = await this.analyticsService.getAIUsageStats(user.tenantId);
    return raw.map((r: any) => ({
      module: r.module,
      requestCount: r._count.id,
      totalTokens: r._sum.tokens ?? 0,
      totalCost: r._sum.cost ?? 0,
    }));
  }
}
