import { Module } from '@nestjs/common';
import { MarketplaceController } from './presentation/controllers/marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { DatabaseModule } from '../database/database.module';
import { SearchModule } from '../search/search.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [DatabaseModule, SearchModule, BillingModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
