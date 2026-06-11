import { Module } from '@nestjs/common';

import { ApiEcosystemModule } from '../api-ecosystem/api-ecosystem.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { BillingScheduler } from './billing.scheduler';
import { BillingService } from './billing.service';
import { BillingController } from './presentation/controllers/billing.controller';


@Module({
  imports: [DatabaseModule, ApiEcosystemModule, NotificationsModule],
  controllers: [BillingController],
  providers: [BillingService, BillingScheduler],
  exports: [BillingService],
})
export class BillingModule {}
