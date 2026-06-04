import { Module } from '@nestjs/common';
import { ParentsController } from './presentation/controllers/parents.controller';
import { ParentsService } from './parents.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ParentsController],
  providers: [ParentsService],
  exports: [ParentsService],
})
export class ParentsModule {}
