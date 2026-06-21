"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StudentsController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _roles = require("../../../core/decorators/roles.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _roles2 = require("../../../core/guards/roles.guard");
var _students = require("../../students.service");
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

let StudentsController = exports.StudentsController = class StudentsController {
  constructor(studentsService) {
    this.studentsService = studentsService;
  }
  findAll(req, search, schoolId, classId, grade, page = 1, limit = 20) {
    return this.studentsService.findAll(req.tenant?.id, {
      search,
      schoolId,
      classId,
      grade,
      page: +page,
      limit: +limit
    });
  }
  myProgress(user) {
    return this.studentsService.getLearningProgress(user.studentProfile?.id ?? user.id);
  }
  myPerformance(user) {
    return this.studentsService.getPerformanceSummary(user.studentProfile?.id ?? user.id);
  }
  findOne(id) {
    return this.studentsService.findOne(id);
  }
  progress(id) {
    return this.studentsService.getLearningProgress(id);
  }
  submissions(id) {
    return this.studentsService.getSubmissions(id);
  }
  performance(id) {
    return this.studentsService.getPerformanceSummary(id);
  }
  reportCard(id) {
    return this.studentsService.getReportCard(id);
  }
  invite(req, body) {
    return this.studentsService.inviteStudent(req.tenant?.id, body);
  }
};
__decorate([(0, _common.Get)(), (0, _swagger.ApiOperation)({
  summary: 'List students in tenant'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Query)('search')), __param(2, (0, _common.Query)('schoolId')), __param(3, (0, _common.Query)('classId')), __param(4, (0, _common.Query)('grade')), __param(5, (0, _common.Query)('page')), __param(6, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, String, String, String, Object, Object]), __metadata("design:returntype", void 0)], StudentsController.prototype, "findAll", null);
__decorate([(0, _common.Get)('me/progress'), (0, _swagger.ApiOperation)({
  summary: 'Get current student learning progress'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], StudentsController.prototype, "myProgress", null);
__decorate([(0, _common.Get)('me/performance'), (0, _swagger.ApiOperation)({
  summary: 'Get current student performance summary'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], StudentsController.prototype, "myPerformance", null);
__decorate([(0, _common.Get)(':id'), (0, _swagger.ApiOperation)({
  summary: 'Get student profile'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], StudentsController.prototype, "findOne", null);
__decorate([(0, _common.Get)(':id/progress'), (0, _swagger.ApiOperation)({
  summary: 'Get student learning progress'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], StudentsController.prototype, "progress", null);
__decorate([(0, _common.Get)(':id/submissions'), (0, _swagger.ApiOperation)({
  summary: 'Get student submissions'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], StudentsController.prototype, "submissions", null);
__decorate([(0, _common.Get)(':id/performance'), (0, _swagger.ApiOperation)({
  summary: 'Get student performance summary'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], StudentsController.prototype, "performance", null);
__decorate([(0, _common.Get)(':id/report-card'), (0, _roles.Roles)('TEACHER', 'ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'STUDENT'), (0, _swagger.ApiOperation)({
  summary: 'Get comprehensive student report card'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], StudentsController.prototype, "reportCard", null);
__decorate([(0, _common.Post)('invite'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _roles.Roles)('ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), (0, _swagger.ApiOperation)({
  summary: 'Invite a student by email'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], StudentsController.prototype, "invite", null);
exports.StudentsController = StudentsController = __decorate([(0, _swagger.ApiTags)('Students'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _common.Controller)('students'), __param(0, (0, _common.Inject)(_students.StudentsService)), __metadata("design:paramtypes", [Object])], StudentsController);