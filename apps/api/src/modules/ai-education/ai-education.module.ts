import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { AiModerationController } from './ai-moderation.controller';
import { CareerAdvisorService } from './career-advisor.service';
import { ContentModerationService } from './content-moderation.service';
import { MindMapService } from './mind-map.service';
import { PerformancePredictionService } from './performance-prediction.service';
import { PlagiarismDetectionService } from './plagiarism-detection.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AiModerationController],
  providers: [
    MindMapService,
    CareerAdvisorService,
    PerformancePredictionService,
    ContentModerationService,
    PlagiarismDetectionService,
  ],
  exports: [
    MindMapService,
    CareerAdvisorService,
    PerformancePredictionService,
    ContentModerationService,
    PlagiarismDetectionService,
  ],
})
export class AiEducationModule {}
