import { Module } from '@nestjs/common';
import { NotificationsController } from './presentation/controllers/notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { EmailProcessor } from '../queue/processors/email.processor';
import { NotificationProcessor } from '../queue/processors/notification.processor';
import { DatabaseModule } from '../database/database.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [DatabaseModule, QueueModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsScheduler, EmailProcessor, NotificationProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
