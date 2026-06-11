import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { JitsiService } from './jitsi.service';
import { LiveService } from './live.service';
import { LiveController } from './presentation/controllers/live.controller';
import { LiveGateway } from './presentation/gateways/live.gateway';


@Module({
  imports: [
    DatabaseModule,
    CacheModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'changeme'),
      }),
    }),
  ],
  controllers: [LiveController],
  providers: [LiveService, LiveGateway, JitsiService],
  exports: [LiveService],
})
export class LiveModule {}
