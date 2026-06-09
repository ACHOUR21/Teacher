import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { DatabaseModule } from '../database/database.module';
import { EmailProcessor } from '../queue/processors/email.processor';
import { NotificationProcessor } from '../queue/processors/notification.processor';
import { QueueModule } from '../queue/queue.module';

import { NotificationsGateway } from './notifications.gateway';
import { NotificationsScheduler } from './notifications.scheduler';
import { NotificationsService } from './notifications.service';
import { ParentNotificationsService } from './parent-notifications.service';
import { NotificationsController } from './presentation/controllers/notifications.controller';

@Module({
  imports: [
    DatabaseModule,
    QueueModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'secret'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsScheduler,
    NotificationsGateway,
    ParentNotificationsService,
    EmailProcessor,
    NotificationProcessor,
  ],
  exports: [NotificationsService, NotificationsGateway, ParentNotificationsService],
})
export class NotificationsModule {}
