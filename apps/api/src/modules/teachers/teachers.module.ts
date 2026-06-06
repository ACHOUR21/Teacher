import { Module } from '@nestjs/common';
import { TeachersController } from './presentation/controllers/teachers.controller';
import { TeachersService } from './teachers.service';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, CacheModule, NotificationsModule],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}
