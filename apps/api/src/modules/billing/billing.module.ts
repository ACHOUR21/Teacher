import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './presentation/controllers/billing.controller';
import { ApiEcosystemModule } from '../api-ecosystem/api-ecosystem.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, ApiEcosystemModule, NotificationsModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
