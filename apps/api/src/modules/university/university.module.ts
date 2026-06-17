import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { UniversityController } from './university.controller';
import { UniversityService } from './university.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UniversityController],
  providers: [UniversityService],
  exports: [UniversityService],
})
export class UniversityModule {}
