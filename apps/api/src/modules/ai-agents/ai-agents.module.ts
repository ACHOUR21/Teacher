import { Module } from '@nestjs/common';

import { AiAgentsService } from './ai-agents.service';
import { AiAgentsController } from './presentation/controllers/ai-agents.controller';

@Module({
  controllers: [AiAgentsController],
  providers: [AiAgentsService],
  exports: [AiAgentsService],
})
export class AiAgentsModule {}
