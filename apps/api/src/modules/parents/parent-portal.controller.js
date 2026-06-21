"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParentPortalController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _currentUser = require("../core/decorators/current-user.decorator");
var _jwtAuth = require("../core/guards/jwt-auth.guard");
var _parentPortal = require("./parent-portal.service");
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
let ParentPortalController = exports.ParentPortalController = class ParentPortalController {
  constructor(portal) {
    this.portal = portal;
  }
  // ── GET /parents/children ──────────────────────────────────────────────────
  getChildren(parentUserId) {
    return this.portal.getChildren(parentUserId);
  }
  // ── POST /parents/link-child ───────────────────────────────────────────────
  linkChild(parentUserId, body) {
    return this.portal.linkChildByEmail(parentUserId, body.childEmail);
  }
  // ── GET /parents/children/:childId/overview ────────────────────────────────
  getChildOverview(parentUserId, childUserId) {
    return this.portal.getChildOverview(parentUserId, childUserId);
  }
  // ── GET /parents/children/:childId/attendance ──────────────────────────────
  getChildAttendance(parentUserId, childUserId, month) {
    const monthDate = month ? new Date(`${month}-01`) : undefined;
    return this.portal.getChildAttendance(parentUserId, childUserId, monthDate);
  }
  // ── GET /parents/children/:childId/assignments ─────────────────────────────
  getChildAssignments(parentUserId, childUserId) {
    return this.portal.getChildAssignments(parentUserId, childUserId);
  }
  // ── GET /parents/children/:childId/events ─────────────────────────────────
  getChildUpcomingEvents(parentUserId, childUserId) {
    return this.portal.getChildUpcomingEvents(parentUserId, childUserId);
  }
  // ── POST /parents/teachers/:teacherId/message ──────────────────────────────
  messageTeacher(parentUserId, teacherUserId, body) {
    return this.portal.messageTeacher(parentUserId, teacherUserId, body.subject, body.message);
  }
  // ── GET /parents/conversations ─────────────────────────────────────────────
  getConversations(parentUserId) {
    return this.portal.getConversations(parentUserId);
  }
};
__decorate([(0, _common.Get)('children'), (0, _swagger.ApiOperation)({
  summary: 'List all children linked to the authenticated parent'
}), __param(0, (0, _currentUser.CurrentUser)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], ParentPortalController.prototype, "getChildren", null);
__decorate([(0, _common.Post)('link-child'), (0, _swagger.ApiOperation)({
  summary: 'Link a child to this parent account by student email'
}), __param(0, (0, _currentUser.CurrentUser)('id')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], ParentPortalController.prototype, "linkChild", null);
__decorate([(0, _common.Get)('children/:childId/overview'), (0, _swagger.ApiOperation)({
  summary: "Get child's academic overview (courses, grades, attendance, AI usage)"
}), __param(0, (0, _currentUser.CurrentUser)('id')), __param(1, (0, _common.Param)('childId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], ParentPortalController.prototype, "getChildOverview", null);
__decorate([(0, _common.Get)('children/:childId/attendance'), (0, _swagger.ApiOperation)({
  summary: "Get child's attendance records for a given month"
}), (0, _swagger.ApiQuery)({
  name: 'month',
  required: false,
  description: 'YYYY-MM format, defaults to current month'
}), __param(0, (0, _currentUser.CurrentUser)('id')), __param(1, (0, _common.Param)('childId')), __param(2, (0, _common.Query)('month')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, String]), __metadata("design:returntype", void 0)], ParentPortalController.prototype, "getChildAttendance", null);
__decorate([(0, _common.Get)('children/:childId/assignments'), (0, _swagger.ApiOperation)({
  summary: "Get child's recent assignment submissions and grades"
}), __param(0, (0, _currentUser.CurrentUser)('id')), __param(1, (0, _common.Param)('childId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], ParentPortalController.prototype, "getChildAssignments", null);
__decorate([(0, _common.Get)('children/:childId/events'), (0, _swagger.ApiOperation)({
  summary: "Get child's upcoming events (live sessions, assignment due dates)"
}), __param(0, (0, _currentUser.CurrentUser)('id')), __param(1, (0, _common.Param)('childId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], ParentPortalController.prototype, "getChildUpcomingEvents", null);
__decorate([(0, _common.Post)('teachers/:teacherId/message'), (0, _swagger.ApiOperation)({
  summary: 'Send a message to a teacher'
}), __param(0, (0, _currentUser.CurrentUser)('id')), __param(1, (0, _common.Param)('teacherId')), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, Object]), __metadata("design:returntype", void 0)], ParentPortalController.prototype, "messageTeacher", null);
__decorate([(0, _common.Get)('conversations'), (0, _swagger.ApiOperation)({
  summary: "Get parent's teacher conversations"
}), __param(0, (0, _currentUser.CurrentUser)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], ParentPortalController.prototype, "getConversations", null);
exports.ParentPortalController = ParentPortalController = __decorate([(0, _swagger.ApiTags)('Parent Portal'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Controller)('parents'), __param(0, (0, _common.Inject)(_parentPortal.ParentPortalService)), __metadata("design:paramtypes", [Object])], ParentPortalController);