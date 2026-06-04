import { Module } from '@nestjs/common';
import { LiveController } from './presentation/controllers/live.controller';
import { LiveService } from './live.service';
import { LiveGateway } from './presentation/gateways/live.gateway';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, CacheModule, NotificationsModule],
  controllers: [LiveController],
  providers: [LiveService, LiveGateway],
  exports: [LiveService],
})
export class LiveModule {}
