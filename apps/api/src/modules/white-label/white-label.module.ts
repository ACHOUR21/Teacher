import { Module } from '@nestjs/common';
import { WhiteLabelController } from './presentation/controllers/white-label.controller';
import { WhiteLabelService } from './white-label.service';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [WhiteLabelController],
  providers: [WhiteLabelService],
  exports: [WhiteLabelService],
})
export class WhiteLabelModule {}
