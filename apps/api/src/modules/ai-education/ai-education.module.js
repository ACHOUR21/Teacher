"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AiEducationModule = void 0;
var _common = require("@nestjs/common");
var _database = require("../database/database.module");
var _aiLanguage = require("./ai-language.controller");
var _aiModeration = require("./ai-moderation.controller");
var _aiStt = require("./ai-stt.service");
var _aiTranslator = require("./ai-translator.service");
var _aiTts = require("./ai-tts.service");
var _careerAdvisor = require("./career-advisor.service");
var _contentModeration = require("./content-moderation.service");
var _mindMap = require("./mind-map.service");
var _performancePrediction = require("./performance-prediction.service");
var _plagiarismDetection = require("./plagiarism-detection.service");
var _recommendation = require("./recommendation.controller");
var _recommendationEngine = require("./recommendation-engine.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let AiEducationModule = exports.AiEducationModule = class AiEducationModule {};
exports.AiEducationModule = AiEducationModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule],
  controllers: [_aiModeration.AiModerationController, _recommendation.RecommendationController, _aiLanguage.AiLanguageController],
  providers: [_mindMap.MindMapService, _careerAdvisor.CareerAdvisorService, _performancePrediction.PerformancePredictionService, _contentModeration.ContentModerationService, _plagiarismDetection.PlagiarismDetectionService, _recommendationEngine.RecommendationEngineService, _aiTranslator.AiTranslatorService, _aiTts.AiTtsService, _aiStt.AiSttService],
  exports: [_mindMap.MindMapService, _careerAdvisor.CareerAdvisorService, _performancePrediction.PerformancePredictionService, _contentModeration.ContentModerationService, _plagiarismDetection.PlagiarismDetectionService, _recommendationEngine.RecommendationEngineService, _aiTranslator.AiTranslatorService, _aiTts.AiTtsService, _aiStt.AiSttService]
})], AiEducationModule);