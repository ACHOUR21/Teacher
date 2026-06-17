import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { GdprService } from './gdpr.service';

@Injectable()
export class GdprScheduler {
  private readonly logger = new Logger(GdprScheduler.name);

  constructor(private readonly gdpr: GdprService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async processScheduledDeletions() {
    this.logger.log('Running scheduled GDPR deletion pass');
    const count = await this.gdpr.processScheduledDeletions();
    this.logger.log(`GDPR deletion pass complete: ${count} user(s) anonymized`);
  }
}
