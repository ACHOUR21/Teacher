import { Module } from '@nestjs/common';
import { GdprService } from './gdpr.service';
import { GdprController } from './gdpr.controller';
import { DatabaseModule } from '../database/database.module';
import { GdprScheduler } from './gdpr.scheduler';

@Module({
  imports: [DatabaseModule],
  controllers: [GdprController],
  providers: [GdprService, GdprScheduler],
  exports: [GdprService],
})
export class GdprModule {}
