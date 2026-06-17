import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { GdprController } from './gdpr.controller';
import { GdprScheduler } from './gdpr.scheduler';
import { GdprService } from './gdpr.service';

@Module({
  imports: [DatabaseModule],
  controllers: [GdprController],
  providers: [GdprService, GdprScheduler],
  exports: [GdprService],
})
export class GdprModule {}
