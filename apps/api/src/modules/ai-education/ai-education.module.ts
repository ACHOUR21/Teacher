import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { AiLanguageController } from './ai-language.controller';
import { AiModerationController } from './ai-moderation.controller';
import { AiSttService } from './ai-stt.service';
import { AiTranslatorService } from './ai-translator.service';
import { AiTtsService } from './ai-tts.service';
import { CareerAdvisorService } from './career-advisor.service';
import { ContentModerationService } from './content-moderation.service';
import { MindMapService } from './mind-map.service';
import { PerformancePredictionService } from './performance-prediction.service';
import { PlagiarismDetectionService } from './plagiarism-detection.service';
import { RecommendationController } from './recommendation.controller';
import { RecommendationEngineService } from './recommendation-engine.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AiModerationController, RecommendationController, AiLanguageController],
  providers: [
    MindMapService,
    CareerAdvisorService,
    PerformancePredictionService,
    ContentModerationService,
    PlagiarismDetectionService,
    RecommendationEngineService,
    AiTranslatorService,
    AiTtsService,
    AiSttService,
  ],
  exports: [
    MindMapService,
    CareerAdvisorService,
    PerformancePredictionService,
    ContentModerationService,
    PlagiarismDetectionService,
    RecommendationEngineService,
    AiTranslatorService,
    AiTtsService,
    AiSttService,
  ],
})
export class AiEducationModule {}
