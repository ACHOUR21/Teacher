"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TeachersController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _teachers = require("../../teachers.service");
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

let TeachersController = exports.TeachersController = class TeachersController {
  constructor(teachersService) {
    this.teachersService = teachersService;
  }
  myProfile(user) {
    return this.teachersService.findByUserId(user.sub ?? user.id);
  }
  async myStats(user) {
    const teacher = await this.teachersService.findByUserId(user.sub ?? user.id);
    if (!teacher) {
      throw new _common.NotFoundException('Teacher profile not found');
    }
    return this.teachersService.getPerformanceStats(teacher.id);
  }
  findAll(req, search, schoolId, page = 1, limit = 20) {
    return this.teachersService.findAll(req.tenant?.id, {
      search,
      schoolId,
      page: +page,
      limit: +limit
    });
  }
  findOne(id) {
    return this.teachersService.findOne(id);
  }
  update(id, body) {
    return this.teachersService.update(id, body);
  }
  stats(id) {
    return this.teachersService.getPerformanceStats(id);
  }
  schedule(id) {
    return this.teachersService.getSchedule(id);
  }
  tenantStats(req) {
    return this.teachersService.getTenantStats(req.tenant?.id);
  }
  invite(req, body) {
    return this.teachersService.inviteTeacher(req.tenant?.id, body);
  }
};
__decorate([(0, _common.Get)('me'), (0, _swagger.ApiOperation)({
  summary: 'Get my teacher profile'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], TeachersController.prototype, "myProfile", null);
__decorate([(0, _common.Get)('me/stats'), (0, _swagger.ApiOperation)({
  summary: 'Get my performance stats'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", Promise)], TeachersController.prototype, "myStats", null);
__decorate([(0, _common.Get)(), (0, _swagger.ApiOperation)({
  summary: 'List all teachers in tenant'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Query)('search')), __param(2, (0, _common.Query)('schoolId')), __param(3, (0, _common.Query)('page')), __param(4, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, String, Object, Object]), __metadata("design:returntype", void 0)], TeachersController.prototype, "findAll", null);
__decorate([(0, _common.Get)(':id'), (0, _swagger.ApiOperation)({
  summary: 'Get teacher profile'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], TeachersController.prototype, "findOne", null);
__decorate([(0, _common.Patch)(':id'), (0, _swagger.ApiOperation)({
  summary: 'Update teacher profile'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], TeachersController.prototype, "update", null);
__decorate([(0, _common.Get)(':id/stats'), (0, _swagger.ApiOperation)({
  summary: 'Get teacher performance statistics'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], TeachersController.prototype, "stats", null);
__decorate([(0, _common.Get)(':id/schedule'), (0, _swagger.ApiOperation)({
  summary: 'Get teacher upcoming schedule'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], TeachersController.prototype, "schedule", null);
__decorate([(0, _common.Get)('stats'), (0, _swagger.ApiOperation)({
  summary: 'Get aggregate teacher stats for tenant'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], TeachersController.prototype, "tenantStats", null);
__decorate([(0, _common.Post)('invite'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Invite a teacher by email'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], TeachersController.prototype, "invite", null);
exports.TeachersController = TeachersController = __decorate([(0, _swagger.ApiTags)('Teachers'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Controller)('teachers'), __param(0, (0, _common.Inject)(_teachers.TeachersService)), __metadata("design:paramtypes", [Object])], TeachersController);