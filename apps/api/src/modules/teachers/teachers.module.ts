import { Module } from '@nestjs/common';

import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { TeachersController } from './presentation/controllers/teachers.controller';
import { TeachersService } from './teachers.service';

@Module({
  imports: [DatabaseModule, CacheModule, NotificationsModule],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}
