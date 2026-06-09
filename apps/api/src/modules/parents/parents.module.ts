import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { ParentsService } from './parents.service';
import { ParentsController } from './presentation/controllers/parents.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [ParentsController],
  providers: [ParentsService],
  exports: [ParentsService],
})
export class ParentsModule {}
