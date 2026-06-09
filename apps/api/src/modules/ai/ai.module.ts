import { Module } from '@nestjs/common';

import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';
import { AiProcessingProcessor } from '../queue/processors/ai-processing.processor';

import { AiService } from './ai.service';
import { AiController } from './presentation/controllers/ai.controller';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [AiController],
  providers: [AiService, AiProcessingProcessor],
  exports: [AiService],
})
export class AiModule {}
