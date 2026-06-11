import { Module } from '@nestjs/common';

import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { AchievementService } from './achievement.service';
import { GamificationService } from './gamification.service';
import { LeaderboardService } from './leaderboard.service';
import { StreakService } from './streak.service';
import { XpService } from './xp.service';
import { GamificationController } from './presentation/controllers/gamification.controller';

@Module({
  imports: [DatabaseModule, CacheModule, NotificationsModule],
  controllers: [GamificationController],
  providers: [
    GamificationService,
    XpService,
    StreakService,
    AchievementService,
    LeaderboardService,
  ],
  exports: [GamificationService, XpService, StreakService, AchievementService, LeaderboardService],
})
export class GamificationModule {}
