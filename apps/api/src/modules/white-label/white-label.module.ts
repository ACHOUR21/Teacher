import { Module } from '@nestjs/common';

import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';

import { WhiteLabelController } from './presentation/controllers/white-label.controller';
import { WhiteLabelService } from './white-label.service';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [WhiteLabelController],
  providers: [WhiteLabelService],
  exports: [WhiteLabelService],
})
export class WhiteLabelModule {}
