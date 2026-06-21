"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LiveController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _classValidator = require("class-validator");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _featureFlags = require("../../../feature-flags/feature-flags.constants");
var _featureFlag = require("../../../feature-flags/feature-flag.guard");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _live = require("../../live.service");
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

class CreateSessionDto {
  title;
  description;
  scheduledAt;
  maxParticipants;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], CreateSessionDto.prototype, "title", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateSessionDto.prototype, "description", void 0);
__decorate([(0, _classValidator.IsDateString)(), __metadata("design:type", String)], CreateSessionDto.prototype, "scheduledAt", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsInt)(), (0, _classValidator.Min)(2), (0, _classValidator.Max)(500), __metadata("design:type", Number)], CreateSessionDto.prototype, "maxParticipants", void 0);
let LiveController = exports.LiveController = class LiveController {
  constructor(liveService) {
    this.liveService = liveService;
  }
  create(user, dto) {
    return this.liveService.createSession(user.teacherProfile?.id ?? user.id, {
      ...dto,
      scheduledAt: new Date(dto.scheduledAt)
    });
  }
  findAll(req) {
    return this.liveService.findAll(req.tenant?.id, {});
  }
  findOne(id) {
    return this.liveService.findOne(id);
  }
  start(id, user) {
    return this.liveService.startSession(id, user.teacherProfile?.id ?? user.id);
  }
  end(id, user) {
    return this.liveService.endSession(id, user.teacherProfile?.id ?? user.id);
  }
  join(id, user) {
    return this.liveService.joinSession(id, user.id);
  }
  leave(id, user) {
    return this.liveService.leaveSession(id, user.id);
  }
  participants(id) {
    return this.liveService.getParticipants(id);
  }
};
__decorate([(0, _common.Post)('sessions'), (0, _swagger.ApiOperation)({
  summary: 'Create a live session'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, CreateSessionDto]), __metadata("design:returntype", void 0)], LiveController.prototype, "create", null);
__decorate([(0, _common.Get)('sessions'), (0, _swagger.ApiOperation)({
  summary: 'List live sessions for tenant'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], LiveController.prototype, "findAll", null);
__decorate([(0, _common.Get)('sessions/:id'), (0, _swagger.ApiOperation)({
  summary: 'Get session details'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], LiveController.prototype, "findOne", null);
__decorate([(0, _common.Patch)('sessions/:id/start'), (0, _swagger.ApiOperation)({
  summary: 'Start a scheduled session'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], LiveController.prototype, "start", null);
__decorate([(0, _common.Patch)('sessions/:id/end'), (0, _swagger.ApiOperation)({
  summary: 'End a live session'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], LiveController.prototype, "end", null);
__decorate([(0, _common.Post)('sessions/:id/join'), (0, _swagger.ApiOperation)({
  summary: 'Join a live session'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], LiveController.prototype, "join", null);
__decorate([(0, _common.Post)('sessions/:id/leave'), (0, _swagger.ApiOperation)({
  summary: 'Leave a live session'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], LiveController.prototype, "leave", null);
__decorate([(0, _common.Get)('sessions/:id/participants'), (0, _swagger.ApiOperation)({
  summary: 'Get active participants'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], LiveController.prototype, "participants", null);
exports.LiveController = LiveController = __decorate([(0, _swagger.ApiTags)('Live'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _featureFlag.FeatureFlagGuard), (0, _featureFlag.RequireFeature)(_featureFlags.FEATURE_FLAGS.LIVE_SESSIONS), (0, _common.Controller)('live'), __param(0, (0, _common.Inject)(_live.LiveService)), __metadata("design:paramtypes", [Object])], LiveController);