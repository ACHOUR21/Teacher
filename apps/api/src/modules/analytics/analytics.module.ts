import { Module } from '@nestjs/common';
import { AnalyticsController } from './presentation/controllers/analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsProcessor } from '../queue/processors/analytics.processor';
import { AnalyticsScheduler } from './analytics.scheduler';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [DatabaseModule, CacheModule, QueueModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsProcessor, AnalyticsScheduler],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
