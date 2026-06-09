import { Module } from '@nestjs/common';

import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';

import { SchoolErpController } from './presentation/controllers/school-erp.controller';
import { SchoolErpService } from './school-erp.service';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [SchoolErpController],
  providers: [SchoolErpService],
  exports: [SchoolErpService],
})
export class SchoolErpModule {}
