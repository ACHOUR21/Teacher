import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { ScimAuthGuard } from './scim-auth.guard';
import { ScimController } from './scim.controller';
import { ScimService } from './scim.service';

@Module({
  imports: [DatabaseModule],
  controllers: [ScimController],
  providers: [ScimService, ScimAuthGuard],
  exports: [ScimService],
})
export class ScimModule {}
