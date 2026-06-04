import { Module } from '@nestjs/common';
import { NotificationsController } from './presentation/controllers/notifications.controller';
import { NotificationsService } from './notifications.service';
import { DatabaseModule } from '../database/database.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [DatabaseModule, QueueModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
