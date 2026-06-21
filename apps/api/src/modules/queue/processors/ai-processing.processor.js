"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AiProcessingProcessor = void 0;
var _bull = require("@nestjs/bull");
var _common = require("@nestjs/common");
var _bull2 = require("bull");
var _ai = require("../../ai/ai.service");
var _queue = require("../queue.module");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = void 0 && (void 0).__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = void 0 && (void 0).__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
var AiProcessingProcessor_1;
var _a, _b, _c, _d;
let AiProcessingProcessor = exports.AiProcessingProcessor = AiProcessingProcessor_1 = class AiProcessingProcessor {
  logger = new _common.Logger(AiProcessingProcessor_1.name);
  constructor(aiService) {
    this.aiService = aiService;
  }
  async handleTutorChat(job) {
    const {
      userId,
      tenantId,
      message,
      subject,
      conversationId
    } = job.data;
    this.logger.log(`Processing tutor chat for user ${userId}`);
    return this.aiService.tutorChat(userId, tenantId, message, subject, conversationId);
  }
  async handleHomework(job) {
    const {
      userId,
      tenantId,
      problem,
      subject
    } = job.data;
    this.logger.log(`Processing homework for user ${userId}`);
    return this.aiService.solveHomework(userId, tenantId, problem, subject);
  }
  async handleExamGeneration(job) {
    const {
      userId,
      tenantId,
      topic,
      numQuestions,
      difficulty,
      questionTypes
    } = job.data;
    this.logger.log(`Generating exam on "${topic}" for user ${userId}`);
    return this.aiService.generateExam(userId, tenantId, topic, numQuestions, difficulty, questionTypes);
  }
  async handleLessonGeneration(job) {
    const {
      userId,
      tenantId,
      topic,
      gradeLevel,
      duration
    } = job.data;
    this.logger.log(`Generating lesson plan on "${topic}" for user ${userId}`);
    return this.aiService.generateLesson(userId, tenantId, topic, gradeLevel, duration);
  }
};
__decorate([(0, _bull.Process)('tutor-chat'), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_a = typeof _bull2.Job !== "undefined" && _bull2.Job) === "function" ? _a : Object]), __metadata("design:returntype", Promise)], AiProcessingProcessor.prototype, "handleTutorChat", null);
__decorate([(0, _bull.Process)('solve-homework'), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_b = typeof _bull2.Job !== "undefined" && _bull2.Job) === "function" ? _b : Object]), __metadata("design:returntype", Promise)], AiProcessingProcessor.prototype, "handleHomework", null);
__decorate([(0, _bull.Process)('generate-exam'), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_c = typeof _bull2.Job !== "undefined" && _bull2.Job) === "function" ? _c : Object]), __metadata("design:returntype", Promise)], AiProcessingProcessor.prototype, "handleExamGeneration", null);
__decorate([(0, _bull.Process)('generate-lesson'), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_d = typeof _bull2.Job !== "undefined" && _bull2.Job) === "function" ? _d : Object]), __metadata("design:returntype", Promise)], AiProcessingProcessor.prototype, "handleLessonGeneration", null);
exports.AiProcessingProcessor = AiProcessingProcessor = AiProcessingProcessor_1 = __decorate([(0, _bull.Processor)(_queue.QUEUE_AI_PROCESSING), __param(0, (0, _common.Inject)(_ai.AiService)), __metadata("design:paramtypes", [Object])], AiProcessingProcessor);