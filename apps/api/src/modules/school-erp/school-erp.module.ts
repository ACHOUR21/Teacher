import { Module } from '@nestjs/common';
import { SchoolErpController } from './presentation/controllers/school-erp.controller';
import { SchoolErpService } from './school-erp.service';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [SchoolErpController],
  providers: [SchoolErpService],
  exports: [SchoolErpService],
})
export class SchoolErpModule {}
