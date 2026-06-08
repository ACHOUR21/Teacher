import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './presentation/controllers/exams.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
