import { Module } from '@nestjs/common';

import { BillingModule } from '../billing/billing.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SearchModule } from '../search/search.module';

import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './presentation/controllers/marketplace.controller';

@Module({
  imports: [DatabaseModule, SearchModule, BillingModule, NotificationsModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
