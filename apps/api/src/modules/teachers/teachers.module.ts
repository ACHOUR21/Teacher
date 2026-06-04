import { Module } from '@nestjs/common';
import { TeachersController } from './presentation/controllers/teachers.controller';
import { TeachersService } from './teachers.service';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}
