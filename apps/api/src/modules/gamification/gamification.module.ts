import { Module } from '@nestjs/common';

import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { GamificationService } from './gamification.service';
import { GamificationController } from './presentation/controllers/gamification.controller';

@Module({
  imports: [DatabaseModule, CacheModule, NotificationsModule],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
