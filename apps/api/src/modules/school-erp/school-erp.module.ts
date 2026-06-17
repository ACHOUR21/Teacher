import { Module } from '@nestjs/common';

import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';

import { AttendanceManagementService } from './attendance-management.service';
import { GradeBookService } from './gradebook.service';
import { SchoolErpController } from './presentation/controllers/school-erp.controller';
import { SchoolErpService } from './school-erp.service';
import { TimetableService } from './timetable.service';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [SchoolErpController],
  providers: [SchoolErpService, TimetableService, GradeBookService, AttendanceManagementService],
  exports: [SchoolErpService, TimetableService, GradeBookService, AttendanceManagementService],
})
export class SchoolErpModule {}
