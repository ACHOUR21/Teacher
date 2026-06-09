import { Module } from '@nestjs/common';

import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';
import { AnalyticsProcessor } from '../queue/processors/analytics.processor';
import { QueueModule } from '../queue/queue.module';

import { AnalyticsScheduler } from './analytics.scheduler';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './presentation/controllers/analytics.controller';

@Module({
  imports: [DatabaseModule, CacheModule, QueueModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsProcessor, AnalyticsScheduler],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
