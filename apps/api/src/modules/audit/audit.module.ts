import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { AuditService } from './audit.service';
import { AuditController } from './presentation/controllers/audit.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
