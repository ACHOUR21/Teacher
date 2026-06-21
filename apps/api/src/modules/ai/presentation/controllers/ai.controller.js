"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AiController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _classValidator = require("class-validator");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _ai = require("../../ai.service");
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
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

class TutorChatDto {
  message;
  subject;
  conversationId;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], TutorChatDto.prototype, "message", void 0);
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], TutorChatDto.prototype, "subject", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], TutorChatDto.prototype, "conversationId", void 0);
class HomeworkDto {
  problem;
  subject;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], HomeworkDto.prototype, "problem", void 0);
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], HomeworkDto.prototype, "subject", void 0);
class GenerateExamDto {
  topic;
  numQuestions;
  difficulty;
  questionTypes;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], GenerateExamDto.prototype, "topic", void 0);
__decorate([(0, _classValidator.IsInt)(), (0, _classValidator.Min)(1), (0, _classValidator.Max)(50), __metadata("design:type", Number)], GenerateExamDto.prototype, "numQuestions", void 0);
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], GenerateExamDto.prototype, "difficulty", void 0);
__decorate([(0, _classValidator.IsArray)(), (0, _classValidator.IsString)({
  each: true
}), __metadata("design:type", Array)], GenerateExamDto.prototype, "questionTypes", void 0);
class GenerateLessonDto {
  topic;
  gradeLevel;
  duration;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], GenerateLessonDto.prototype, "topic", void 0);
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], GenerateLessonDto.prototype, "gradeLevel", void 0);
__decorate([(0, _classValidator.IsInt)(), (0, _classValidator.Min)(15), (0, _classValidator.Max)(180), __metadata("design:type", Number)], GenerateLessonDto.prototype, "duration", void 0);
class GenerateFlashcardsDto {
  topic;
  numCards;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], GenerateFlashcardsDto.prototype, "topic", void 0);
__decorate([(0, _classValidator.IsInt)(), (0, _classValidator.Min)(5), (0, _classValidator.Max)(50), __metadata("design:type", Number)], GenerateFlashcardsDto.prototype, "numCards", void 0);
class TranslateDto {
  text;
  targetLanguage;
  sourceLanguage;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], TranslateDto.prototype, "text", void 0);
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], TranslateDto.prototype, "targetLanguage", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], TranslateDto.prototype, "sourceLanguage", void 0);
class PlagiarismDto {
  content;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], PlagiarismDto.prototype, "content", void 0);
let AiController = exports.AiController = class AiController {
  constructor(aiService) {
    this.aiService = aiService;
  }
  tutorChat(user, req, dto) {
    return this.aiService.tutorChat(user.id, req.tenant?.id, dto.message, dto.subject, dto.conversationId);
  }
  solveHomework(user, req, dto) {
    return this.aiService.solveHomework(user.id, req.tenant?.id, dto.problem, dto.subject);
  }
  generateExam(user, req, dto) {
    return this.aiService.generateExam(user.id, req.tenant?.id, dto.topic, dto.numQuestions, dto.difficulty, dto.questionTypes);
  }
  generateLesson(user, req, dto) {
    return this.aiService.generateLesson(user.id, req.tenant?.id, dto.topic, dto.gradeLevel, dto.duration);
  }
  generateFlashcards(user, req, dto) {
    return this.aiService.generateFlashcards(user.id, req.tenant?.id, dto.topic, dto.numCards);
  }
  generateMindMap(user, req, body) {
    return this.aiService.generateMindMap(user.id, req.tenant?.id, body.topic);
  }
  translate(user, req, dto) {
    return this.aiService.translate(user.id, req.tenant?.id, dto.text, dto.targetLanguage, dto.sourceLanguage);
  }
  plagiarismCheck(user, req, dto) {
    return this.aiService.checkPlagiarism(user.id, req.tenant?.id, dto.content);
  }
  moderateContent(req, dto) {
    return this.aiService.moderateContent(req.tenant?.id, dto.content);
  }
  recommend(user, req) {
    return this.aiService.getRecommendations(user.id, req.tenant?.id);
  }
  generateCurriculum(user, req, body) {
    return this.aiService.generateCurriculum(user.id, req.tenant?.id, body.subject, body.gradeLevel, body.weeks, body.objectives);
  }
  researchAssist(user, req, body) {
    return this.aiService.researchAssist(user.id, req.tenant?.id, body.topic, body.depth, body.conversationId);
  }
  speechToText(user, req, body) {
    return this.aiService.speechToText(user.id, req.tenant?.id, body.audioBase64, body.language);
  }
  textToSpeech(user, req, body) {
    return this.aiService.textToSpeech(user.id, req.tenant?.id, body.text, body.voice);
  }
  careerAdvise(user, req, body) {
    return this.aiService.getCareerAdvice(user.id, req.tenant?.id, body.interests, body.skills, body.educationLevel, body.targetRole);
  }
  predictPerformance(req, studentId) {
    return this.aiService.predictPerformance(req.tenant?.id, studentId);
  }
  predictDropout(req, studentId) {
    return this.aiService.predictDropout(req.tenant?.id, studentId);
  }
  getUsage(req, period = 'month') {
    const startDate = new Date();
    if (period === 'month') {
      startDate.setDate(1);
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    }
    startDate.setHours(0, 0, 0, 0);
    return this.aiService.getAIUsageByPeriod(req.tenant?.id, startDate);
  }
};
__decorate([(0, _common.Post)('tutor/chat'), (0, _swagger.ApiOperation)({
  summary: 'Chat with AI tutor'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, TutorChatDto]), __metadata("design:returntype", void 0)], AiController.prototype, "tutorChat", null);
__decorate([(0, _common.Post)('homework/solve'), (0, _swagger.ApiOperation)({
  summary: 'Get homework solution with steps'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, HomeworkDto]), __metadata("design:returntype", void 0)], AiController.prototype, "solveHomework", null);
__decorate([(0, _common.Post)('exam/generate'), (0, _swagger.ApiOperation)({
  summary: 'Generate an exam'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, GenerateExamDto]), __metadata("design:returntype", void 0)], AiController.prototype, "generateExam", null);
__decorate([(0, _common.Post)('lesson/generate'), (0, _swagger.ApiOperation)({
  summary: 'Generate a lesson plan'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, GenerateLessonDto]), __metadata("design:returntype", void 0)], AiController.prototype, "generateLesson", null);
__decorate([(0, _common.Post)('flashcards/generate'), (0, _swagger.ApiOperation)({
  summary: 'Generate flashcards'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, GenerateFlashcardsDto]), __metadata("design:returntype", void 0)], AiController.prototype, "generateFlashcards", null);
__decorate([(0, _common.Post)('mindmap/generate'), (0, _swagger.ApiOperation)({
  summary: 'Generate a mind map'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, Object]), __metadata("design:returntype", void 0)], AiController.prototype, "generateMindMap", null);
__decorate([(0, _common.Post)('translate'), (0, _swagger.ApiOperation)({
  summary: 'Translate text'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, TranslateDto]), __metadata("design:returntype", void 0)], AiController.prototype, "translate", null);
__decorate([(0, _common.Post)('plagiarism/check'), (0, _swagger.ApiOperation)({
  summary: 'Check content for plagiarism'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, PlagiarismDto]), __metadata("design:returntype", void 0)], AiController.prototype, "plagiarismCheck", null);
__decorate([(0, _common.Post)('content/moderate'), (0, _swagger.ApiOperation)({
  summary: 'Moderate content for inappropriate material'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], AiController.prototype, "moderateContent", null);
__decorate([(0, _common.Post)('recommend'), (0, _swagger.ApiOperation)({
  summary: 'Get personalized course recommendations'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], AiController.prototype, "recommend", null);
__decorate([(0, _common.Post)('curriculum/generate'), (0, _swagger.ApiOperation)({
  summary: 'Generate a full curriculum'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, Object]), __metadata("design:returntype", void 0)], AiController.prototype, "generateCurriculum", null);
__decorate([(0, _common.Post)('research/assist'), (0, _swagger.ApiOperation)({
  summary: 'AI research assistant'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, Object]), __metadata("design:returntype", void 0)], AiController.prototype, "researchAssist", null);
__decorate([(0, _common.Post)('speech-to-text'), (0, _swagger.ApiOperation)({
  summary: 'Transcribe audio to text'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, Object]), __metadata("design:returntype", void 0)], AiController.prototype, "speechToText", null);
__decorate([(0, _common.Post)('text-to-speech'), (0, _swagger.ApiOperation)({
  summary: 'Convert text to speech audio'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, Object]), __metadata("design:returntype", void 0)], AiController.prototype, "textToSpeech", null);
__decorate([(0, _common.Post)('career/advise'), (0, _swagger.ApiOperation)({
  summary: 'Get AI career advice'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, Object]), __metadata("design:returntype", void 0)], AiController.prototype, "careerAdvise", null);
__decorate([(0, _common.Get)('predict/performance/:studentId'), (0, _swagger.ApiOperation)({
  summary: 'Predict student performance'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Param)('studentId')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], AiController.prototype, "predictPerformance", null);
__decorate([(0, _common.Get)('predict/dropout/:studentId'), (0, _swagger.ApiOperation)({
  summary: 'Predict student dropout risk'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Param)('studentId')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], AiController.prototype, "predictDropout", null);
__decorate([(0, _common.Get)('usage'), (0, _swagger.ApiOperation)({
  summary: 'Get AI usage stats for this billing period'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Query)('period')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], AiController.prototype, "getUsage", null);
exports.AiController = AiController = __decorate([(0, _swagger.ApiTags)('AI'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Controller)('ai'), __param(0, (0, _common.Inject)(_ai.AiService)), __metadata("design:paramtypes", [Object])], AiController);