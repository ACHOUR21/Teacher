import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { ParentPortalController } from './parent-portal.controller';
import { ParentPortalService } from './parent-portal.service';
import { ParentsController } from './presentation/controllers/parents.controller';
import { ParentsService } from './parents.service';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [ParentsController, ParentPortalController],
  providers: [ParentsService, ParentPortalService],
  exports: [ParentsService, ParentPortalService],
})
export class ParentsModule {}
