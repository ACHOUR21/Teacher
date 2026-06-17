import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { GamificationModule } from '../gamification/gamification.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { StudentsController } from './presentation/controllers/students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [DatabaseModule, GamificationModule, NotificationsModule],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
