import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './presentation/controllers/billing.controller';
import { ApiEcosystemModule } from '../api-ecosystem/api-ecosystem.module';

@Module({
  imports: [ApiEcosystemModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
