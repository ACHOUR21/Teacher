import { Module } from '@nestjs/common';
import { GamificationController } from './presentation/controllers/gamification.controller';
import { GamificationService } from './gamification.service';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
