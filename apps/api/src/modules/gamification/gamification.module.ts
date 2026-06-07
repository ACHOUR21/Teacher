import { Module } from '@nestjs/common';
import { GamificationController } from './presentation/controllers/gamification.controller';
import { GamificationService } from './gamification.service';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, CacheModule, NotificationsModule],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
