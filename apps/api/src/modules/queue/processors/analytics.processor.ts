import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QUEUE_ANALYTICS } from '../queue.module';
import { AnalyticsService } from '../../analytics/analytics.service';

export interface PlatformStatsJobData {
  tenantId: string;
}

export interface UserGrowthJobData {
  tenantId: string;
  days?: number;
}

export interface CourseStatsJobData {
  tenantId: string;
}

@Processor(QUEUE_ANALYTICS)
export class AnalyticsProcessor {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  @Process('aggregate-platform-stats')
  async handlePlatformStats(job: Job<PlatformStatsJobData>) {
    const { tenantId } = job.data;
    this.logger.log(`Aggregating platform stats for tenant ${tenantId}`);
    return this.analyticsService.getPlatformStats(tenantId);
  }

  @Process('aggregate-user-growth')
  async handleUserGrowth(job: Job<UserGrowthJobData>) {
    const { tenantId, days } = job.data;
    this.logger.log(`Aggregating user growth for tenant ${tenantId} (${days ?? 30} days)`);
    return this.analyticsService.getUserGrowth(tenantId, days);
  }

  @Process('aggregate-course-stats')
  async handleCourseStats(job: Job<CourseStatsJobData>) {
    const { tenantId } = job.data;
    this.logger.log(`Aggregating course stats for tenant ${tenantId}`);
    return this.analyticsService.getCourseStats(tenantId);
  }
}
