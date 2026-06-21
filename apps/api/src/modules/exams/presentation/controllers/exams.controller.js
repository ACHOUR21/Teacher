"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ExamsController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _classTransformer = require("class-transformer");
var _classValidator = require("class-validator");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _requirePlan = require("../../../core/decorators/require-plan.decorator");
var _roles = require("../../../core/decorators/roles.decorator");
var _tenant = require("../../../core/decorators/tenant.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _plan = require("../../../core/guards/plan.guard");
var _roles2 = require("../../../core/guards/roles.guard");
var _exams = require("../../exams.service");
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
class QuestionDto {
  type;
  question;
  options;
  correctAnswer;
  explanation;
  points;
}
__decorate([(0, _swagger.ApiProperty)({
  enum: ['multiple_choice', 'true_false', 'short_answer', 'essay']
}), (0, _classValidator.IsEnum)(['multiple_choice', 'true_false', 'short_answer', 'essay']), __metadata("design:type", String)], QuestionDto.prototype, "type", void 0);
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], QuestionDto.prototype, "question", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  type: [String]
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsArray)(), __metadata("design:type", Array)], QuestionDto.prototype, "options", void 0);
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], QuestionDto.prototype, "correctAnswer", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], QuestionDto.prototype, "explanation", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsNumber)(), __metadata("design:type", Number)], QuestionDto.prototype, "points", void 0);
class SaveExamBodyDto {
  title;
  subject;
  topic;
  difficulty;
  timeLimit;
  questions;
}
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], SaveExamBodyDto.prototype, "title", void 0);
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], SaveExamBodyDto.prototype, "subject", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], SaveExamBodyDto.prototype, "topic", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], SaveExamBodyDto.prototype, "difficulty", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsInt)(), __metadata("design:type", Number)], SaveExamBodyDto.prototype, "timeLimit", void 0);
__decorate([(0, _swagger.ApiProperty)({
  type: [QuestionDto]
}), (0, _classValidator.IsArray)(), (0, _classValidator.ValidateNested)({
  each: true
}), (0, _classTransformer.Type)(() => QuestionDto), __metadata("design:type", Array)], SaveExamBodyDto.prototype, "questions", void 0);
class SubmitAnswersDto {
  answers;
}
__decorate([(0, _swagger.ApiProperty)({
  description: 'Map of questionId → answer string'
}), __metadata("design:type", typeof (_a = typeof Record !== "undefined" && Record) === "function" ? _a : Object)], SubmitAnswersDto.prototype, "answers", void 0);
let ExamsController = exports.ExamsController = class ExamsController {
  constructor(examsService) {
    this.examsService = examsService;
  }
  saveExam(tenantId, user, dto) {
    return this.examsService.saveExam(tenantId, user.id, dto);
  }
  listExams(tenantId, user, published, mine) {
    return this.examsService.listExams(tenantId, {
      published: published !== undefined ? published === 'true' : undefined,
      createdBy: mine === 'true' ? user.id : undefined
    });
  }
  getExam(examId, user) {
    const includeAnswers = [_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN].includes(user.role);
    return this.examsService.getExam(examId, includeAnswers);
  }
  publishExam(examId, user) {
    return this.examsService.publishExam(examId, user.id);
  }
  deleteExam(examId, user) {
    return this.examsService.deleteExam(examId, user.id);
  }
  // ---------- Attempts (students)
  startAttempt(examId, user) {
    return this.examsService.startAttempt(examId, user.id);
  }
  submitAttempt(attemptId, user, dto) {
    return this.examsService.submitAttempt(attemptId, user.id, dto.answers);
  }
  getAttemptResult(attemptId, user) {
    return this.examsService.getAttemptResult(attemptId, user.id);
  }
  listAttempts(examId) {
    return this.examsService.listAttempts(examId);
  }
};
__decorate([(0, _common.Post)(), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _requirePlan.RequiresPlanFeature)('aiExamGenerator'), (0, _swagger.ApiOperation)({
  summary: 'Save an AI-generated exam'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_b = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _b : Object, SaveExamBodyDto]), __metadata("design:returntype", void 0)], ExamsController.prototype, "saveExam", null);
__decorate([(0, _common.Get)(), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _requirePlan.RequiresPlanFeature)('aiExamGenerator'), (0, _swagger.ApiOperation)({
  summary: 'List exams in tenant'
}), (0, _swagger.ApiQuery)({
  name: 'published',
  required: false,
  type: Boolean
}), (0, _swagger.ApiQuery)({
  name: 'mine',
  required: false,
  type: Boolean
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Query)('published')), __param(3, (0, _common.Query)('mine')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_c = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _c : Object, String, String]), __metadata("design:returntype", void 0)], ExamsController.prototype, "listExams", null);
__decorate([(0, _common.Get)(':examId'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.STUDENT), (0, _requirePlan.RequiresPlanFeature)('aiExamGenerator'), (0, _swagger.ApiOperation)({
  summary: 'Get exam (answers hidden for students)'
}), __param(0, (0, _common.Param)('examId')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_d = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _d : Object]), __metadata("design:returntype", void 0)], ExamsController.prototype, "getExam", null);
__decorate([(0, _common.Post)(':examId/publish'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _requirePlan.RequiresPlanFeature)('aiExamGenerator'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Publish exam so students can take it'
}), __param(0, (0, _common.Param)('examId')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_e = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _e : Object]), __metadata("design:returntype", void 0)], ExamsController.prototype, "publishExam", null);
__decorate([(0, _common.Delete)(':examId'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _requirePlan.RequiresPlanFeature)('aiExamGenerator'), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Delete exam'
}), __param(0, (0, _common.Param)('examId')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_f = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _f : Object]), __metadata("design:returntype", void 0)], ExamsController.prototype, "deleteExam", null);
__decorate([(0, _common.Post)(':examId/attempts'), (0, _roles.Roles)(_client.UserRole.STUDENT, _client.UserRole.TEACHER, _client.UserRole.ADMIN), (0, _requirePlan.RequiresPlanFeature)('aiExamGenerator'), (0, _swagger.ApiOperation)({
  summary: 'Start or resume an exam attempt'
}), __param(0, (0, _common.Param)('examId')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_g = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _g : Object]), __metadata("design:returntype", void 0)], ExamsController.prototype, "startAttempt", null);
__decorate([(0, _common.Post)('attempts/:attemptId/submit'), (0, _roles.Roles)(_client.UserRole.STUDENT, _client.UserRole.TEACHER, _client.UserRole.ADMIN), (0, _requirePlan.RequiresPlanFeature)('aiExamGenerator'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Submit exam answers'
}), __param(0, (0, _common.Param)('attemptId')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_h = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _h : Object, SubmitAnswersDto]), __metadata("design:returntype", void 0)], ExamsController.prototype, "submitAttempt", null);
__decorate([(0, _common.Get)('attempts/:attemptId/result'), (0, _roles.Roles)(_client.UserRole.STUDENT, _client.UserRole.TEACHER, _client.UserRole.ADMIN), (0, _requirePlan.RequiresPlanFeature)('aiExamGenerator'), (0, _swagger.ApiOperation)({
  summary: 'Get attempt result'
}), __param(0, (0, _common.Param)('attemptId')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_j = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _j : Object]), __metadata("design:returntype", void 0)], ExamsController.prototype, "getAttemptResult", null);
__decorate([(0, _common.Get)(':examId/attempts'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _requirePlan.RequiresPlanFeature)('aiExamGenerator'), (0, _swagger.ApiOperation)({
  summary: 'List all submissions for an exam (teacher view)'
}), __param(0, (0, _common.Param)('examId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], ExamsController.prototype, "listAttempts", null);
exports.ExamsController = ExamsController = __decorate([(0, _swagger.ApiTags)('Exams'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard, _plan.PlanGuard), (0, _common.Controller)('exams'), __param(0, (0, _common.Inject)(_exams.ExamsService)), __metadata("design:paramtypes", [Object])], ExamsController);