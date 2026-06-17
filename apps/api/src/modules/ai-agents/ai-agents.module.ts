import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AiModule } from '../ai/ai.module';
import { DatabaseModule } from '../database/database.module';

import { AiAgentsService } from './ai-agents.service';
import { PipelineEngine } from './pipeline/pipeline.engine';
import { PipelineService } from './pipeline/pipeline.service';
import { AiAgentsController } from './presentation/controllers/ai-agents.controller';

@Module({
  imports: [DatabaseModule, AiModule, ConfigModule],
  controllers: [AiAgentsController],
  providers: [AiAgentsService, PipelineEngine, PipelineService],
  exports: [AiAgentsService, PipelineService],
})
export class AiAgentsModule {}
