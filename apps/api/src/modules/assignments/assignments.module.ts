import { Module } from '@nestjs/common';

import { ApiEcosystemModule } from '../api-ecosystem/api-ecosystem.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

@Module({
  imports: [DatabaseModule, NotificationsModule, ApiEcosystemModule],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
