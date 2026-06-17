import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';

import { PrismaService } from '../database/prisma.service';
import { QUEUE_ANALYTICS } from '../queue/queue.module';

@Injectable()
export class AnalyticsScheduler {
  private readonly logger = new Logger(AnalyticsScheduler.name);

  constructor(
    @InjectQueue(QUEUE_ANALYTICS) private readonly analyticsQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async aggregateAllTenants() {
    const tenants = await this.prisma.tenant.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    this.logger.log(`Scheduling analytics aggregation for ${tenants.length} tenants`);

    for (const tenant of tenants) {
      await this.analyticsQueue.add('aggregate-platform-stats', { tenantId: tenant.id }, { priority: 10 });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async aggregateDailyStats() {
    const tenants = await this.prisma.tenant.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const tenant of tenants) {
      await Promise.all([
        this.analyticsQueue.add('aggregate-user-growth', { tenantId: tenant.id, days: 30 }),
        this.analyticsQueue.add('aggregate-course-stats', { tenantId: tenant.id }),
      ]);
    }

    this.logger.log('Daily analytics aggregation scheduled');
  }
}
