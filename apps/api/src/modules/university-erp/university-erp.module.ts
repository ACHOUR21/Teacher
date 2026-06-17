import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { UniversityErpController } from './presentation/controllers/university-erp.controller';
import { UniversityErpService } from './university-erp.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UniversityErpController],
  providers: [UniversityErpService],
  exports: [UniversityErpService],
})
export class UniversityErpModule {}
