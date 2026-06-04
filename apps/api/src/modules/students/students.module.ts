import { Module } from '@nestjs/common';
import { StudentsController } from './presentation/controllers/students.controller';
import { StudentsService } from './students.service';
import { DatabaseModule } from '../database/database.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [DatabaseModule, GamificationModule],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
