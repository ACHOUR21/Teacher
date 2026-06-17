import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { BillingService } from './billing.service';

@Injectable()
export class BillingScheduler {
  private readonly logger = new Logger(BillingScheduler.name);

  constructor(private readonly billingService: BillingService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async processExpiredGracePeriods() {
    this.logger.log('Running dunning grace period check...');
    const count = await this.billingService.processExpiredGracePeriods();
    if (count > 0) {
      this.logger.warn(`Suspended ${count} accounts after grace period expiry`);
    }
  }
}
