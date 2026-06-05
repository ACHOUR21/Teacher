import { Module } from '@nestjs/common';
import { AnalyticsController } from './presentation/controllers/analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsProcessor } from '../queue/processors/analytics.processor';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsProcessor],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
