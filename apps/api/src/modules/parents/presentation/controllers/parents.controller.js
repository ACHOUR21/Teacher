"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParentsController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _parents = require("../../parents.service");
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

let ParentsController = exports.ParentsController = class ParentsController {
  constructor(parentsService) {
    this.parentsService = parentsService;
  }
  children(user) {
    return this.parentsService.getChildren(user.id);
  }
  myChildren(user) {
    return this.parentsService.getChildren(user.id);
  }
  link(user, body) {
    return this.parentsService.linkChild(user.id, body.studentId, body.relationship);
  }
  childProgress(user, studentId) {
    return this.parentsService.getChildProgress(user.id, studentId);
  }
  childSubmissions(user, studentId) {
    return this.parentsService.getChildSubmissions(user.id, studentId);
  }
  childAttendance(user, studentId) {
    return this.parentsService.getChildAttendance(user.id, studentId);
  }
};
__decorate([(0, _common.Get)('children'), (0, _swagger.ApiOperation)({
  summary: 'Get parent linked children'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], ParentsController.prototype, "children", null);
__decorate([(0, _common.Get)('my-children'), (0, _swagger.ApiOperation)({
  summary: 'Get parent linked children (alias)'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], ParentsController.prototype, "myChildren", null);
__decorate([(0, _common.Post)('children/link'), (0, _swagger.ApiOperation)({
  summary: 'Link a student as child'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], ParentsController.prototype, "link", null);
__decorate([(0, _common.Get)('children/:studentId/progress'), (0, _swagger.ApiOperation)({
  summary: 'View child course progress'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Param)('studentId')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], ParentsController.prototype, "childProgress", null);
__decorate([(0, _common.Get)('children/:studentId/submissions'), (0, _swagger.ApiOperation)({
  summary: 'View child assignment submissions'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Param)('studentId')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], ParentsController.prototype, "childSubmissions", null);
__decorate([(0, _common.Get)('children/:studentId/attendance'), (0, _swagger.ApiOperation)({
  summary: 'View child live session attendance'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Param)('studentId')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], ParentsController.prototype, "childAttendance", null);
exports.ParentsController = ParentsController = __decorate([(0, _swagger.ApiTags)('Parents'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Controller)('parents'), __param(0, (0, _common.Inject)(_parents.ParentsService)), __metadata("design:paramtypes", [Object])], ParentsController);