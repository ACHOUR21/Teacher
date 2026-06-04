import { Module } from '@nestjs/common';
import { UniversityErpController } from './presentation/controllers/university-erp.controller';
import { UniversityErpService } from './university-erp.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UniversityErpController],
  providers: [UniversityErpService],
  exports: [UniversityErpService],
})
export class UniversityErpModule {}
