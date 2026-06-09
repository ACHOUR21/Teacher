import { Module } from '@nestjs/common';

import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { LiveService } from './live.service';
import { LiveController } from './presentation/controllers/live.controller';
import { LiveGateway } from './presentation/gateways/live.gateway';


@Module({
  imports: [DatabaseModule, CacheModule, NotificationsModule],
  controllers: [LiveController],
  providers: [LiveService, LiveGateway],
  exports: [LiveService],
})
export class LiveModule {}
