import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsController } from './presentation/controllers/notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { NotificationsGateway } from './notifications.gateway';
import { ParentNotificationsService } from './parent-notifications.service';
import { EmailProcessor } from '../queue/processors/email.processor';
import { NotificationProcessor } from '../queue/processors/notification.processor';
import { DatabaseModule } from '../database/database.module';
import { QueueModule } from '../queue/queue.module';

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
