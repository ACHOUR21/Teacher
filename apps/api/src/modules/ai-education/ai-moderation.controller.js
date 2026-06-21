"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AiModerationController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _classValidator = require("class-validator");
var _client = require("@prisma/client");
var _currentUser = require("../core/decorators/current-user.decorator");
var _jwtAuth = require("../core/guards/jwt-auth.guard");
var _roles = require("../core/guards/roles.guard");
var _roles2 = require("../core/decorators/roles.decorator");
var _contentModeration = require("./content-moderation.service");
var _plagiarismDetection = require("./plagiarism-detection.service");
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
var _a, _b, _c, _d, _e;
class ModerateContentDto {
  text;
  context;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], ModerateContentDto.prototype, "text", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], ModerateContentDto.prototype, "context", void 0);
class ReviewModerationDto {
  approved;
  note;
}
__decorate([(0, _classValidator.IsBoolean)(), __metadata("design:type", Boolean)], ReviewModerationDto.prototype, "approved", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], ReviewModerationDto.prototype, "note", void 0);
let AiModerationController = exports.AiModerationController = class AiModerationController {
  constructor(moderationService, plagiarismService) {
    this.moderationService = moderationService;
    this.plagiarismService = plagiarismService;
  }
  /**
   * POST /ai/moderation/check
   * Moderate arbitrary text content.
   */
  moderateContent(dto) {
    return this.moderationService.moderateContent(dto.text, dto.context);
  }
  /**
   * POST /ai/moderation/submission/:id
   * Run moderation on a specific submission.
   */
  moderateSubmission(id, user) {
    return this.moderationService.moderateSubmission(id, user.tenantId);
  }
  /**
   * GET /ai/moderation/queue
   * Get flagged submissions queue (admin only).
   */
  getModerationQueue(user, status) {
    return this.moderationService.getModerationQueue(user.tenantId, status);
  }
  /**
   * PATCH /ai/moderation/review/:id
   * Admin review of a flagged submission.
   */
  reviewModeration(id, user, dto) {
    return this.moderationService.reviewModeration(user.tenantId, id, user.id, dto.approved, dto.note);
  }
  /**
   * POST /ai/plagiarism/check/:submissionId
   * Run plagiarism detection on a submission.
   */
  checkPlagiarism(submissionId, user) {
    return this.plagiarismService.checkPlagiarism(submissionId, user.tenantId);
  }
  /**
   * GET /ai/plagiarism/report/:assignmentId
   * Get batch plagiarism report for all submissions in an assignment.
   */
  getBatchReport(assignmentId, user) {
    return this.plagiarismService.getBatchReport(user.tenantId, assignmentId);
  }
};
__decorate([(0, _common.Post)('check'), (0, _swagger.ApiOperation)({
  summary: 'Moderate content text'
}), __param(0, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [ModerateContentDto]), __metadata("design:returntype", void 0)], AiModerationController.prototype, "moderateContent", null);
__decorate([(0, _common.Post)('submission/:id'), (0, _swagger.ApiOperation)({
  summary: 'Run content moderation on a submission'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_a = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _a : Object]), __metadata("design:returntype", void 0)], AiModerationController.prototype, "moderateSubmission", null);
__decorate([(0, _common.Get)('queue'), (0, _common.UseGuards)(_roles.RolesGuard), (0, _roles2.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Get content moderation queue (admin)'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Query)('status')), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_b = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _b : Object, String]), __metadata("design:returntype", void 0)], AiModerationController.prototype, "getModerationQueue", null);
__decorate([(0, _common.Patch)('review/:id'), (0, _common.UseGuards)(_roles.RolesGuard), (0, _roles2.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Review a flagged submission moderation result'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_c = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _c : Object, ReviewModerationDto]), __metadata("design:returntype", void 0)], AiModerationController.prototype, "reviewModeration", null);
__decorate([(0, _common.Post)('/ai/plagiarism/check/:submissionId'), (0, _swagger.ApiOperation)({
  summary: 'Run plagiarism detection on a submission'
}), __param(0, (0, _common.Param)('submissionId')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_d = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _d : Object]), __metadata("design:returntype", void 0)], AiModerationController.prototype, "checkPlagiarism", null);
__decorate([(0, _common.Get)('/ai/plagiarism/report/:assignmentId'), (0, _common.UseGuards)(_roles.RolesGuard), (0, _roles2.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.TEACHER), (0, _swagger.ApiOperation)({
  summary: 'Get batch plagiarism report for an assignment'
}), __param(0, (0, _common.Param)('assignmentId')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_e = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _e : Object]), __metadata("design:returntype", void 0)], AiModerationController.prototype, "getBatchReport", null);
exports.AiModerationController = AiModerationController = __decorate([(0, _swagger.ApiTags)('AI Moderation'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Controller)('ai/moderation'), __param(0, (0, _common.Inject)(_contentModeration.ContentModerationService)), __param(1, (0, _common.Inject)(_plagiarismDetection.PlagiarismDetectionService)), __metadata("design:paramtypes", [Object, Object])], AiModerationController);