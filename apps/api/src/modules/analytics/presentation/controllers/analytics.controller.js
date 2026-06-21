"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AnalyticsController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _roles = require("../../../core/decorators/roles.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _analytics = require("../../analytics.service");
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

let AnalyticsController = exports.AnalyticsController = class AnalyticsController {
  constructor(analyticsService) {
    this.analyticsService = analyticsService;
  }
  overview(req) {
    return this.analyticsService.getPlatformStats(req.tenant?.id);
  }
  userGrowth(req, days = 30) {
    return this.analyticsService.getUserGrowth(req.tenant?.id, +days);
  }
  courseStats(req) {
    return this.analyticsService.getCourseStats(req.tenant?.id);
  }
  studentActivity(req, days = 7) {
    return this.analyticsService.getStudentActivity(req.tenant?.id, +days);
  }
  revenue(req, months = 6) {
    return this.analyticsService.getRevenueAnalytics(req.tenant?.id, +months);
  }
  aiUsage(req) {
    return this.analyticsService.getAIUsageStats(req.tenant?.id);
  }
  engagement(req) {
    return this.analyticsService.getEngagementHeatmap(req.tenant?.id);
  }
  topCourses(req) {
    return this.analyticsService.getTopCourses(req.tenant?.id);
  }
  teacherOverview(req) {
    const teacherId = req.user?.teacherProfileId ?? req.user?.sub;
    return this.analyticsService.getTeacherOverview(teacherId);
  }
  teacherCourses(req) {
    const teacherId = req.user?.teacherProfileId ?? req.user?.sub;
    return this.analyticsService.getTeacherCoursePerformance(teacherId);
  }
  teacherEnrollmentTrend(req, days = 30) {
    const teacherId = req.user?.teacherProfileId ?? req.user?.sub;
    return this.analyticsService.getTeacherEnrollmentTrend(teacherId, +days);
  }
  teacherTopStudents(req) {
    const teacherId = req.user?.teacherProfileId ?? req.user?.sub;
    return this.analyticsService.getTeacherTopStudents(teacherId);
  }
  studentOverview(req) {
    const studentId = req.user?.studentProfileId ?? req.user?.sub;
    return this.analyticsService.getStudentOverview(studentId);
  }
  studentPerformance(req) {
    const studentId = req.user?.studentProfileId ?? req.user?.sub;
    return this.analyticsService.getStudentPerformance(studentId);
  }
  studentActivity2(req) {
    const studentId = req.user?.studentProfileId ?? req.user?.sub;
    return this.analyticsService.getStudentActivityHeatmap(studentId);
  }
  adminPlatform(req) {
    return this.analyticsService.getAdminPlatformOverview(req.tenant?.id);
  }
  adminCohort(req) {
    return this.analyticsService.getCohortRetention(req.tenant?.id);
  }
  adminTopTenants() {
    return this.analyticsService.getTopTenants();
  }
};
__decorate([(0, _common.Get)('overview'), (0, _swagger.ApiOperation)({
  summary: 'Platform overview stats'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "overview", null);
__decorate([(0, _common.Get)('user-growth'), (0, _swagger.ApiOperation)({
  summary: 'User growth over time'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Query)('days')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "userGrowth", null);
__decorate([(0, _common.Get)('courses'), (0, _swagger.ApiOperation)({
  summary: 'Top courses by enrollment'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "courseStats", null);
__decorate([(0, _common.Get)('student-activity'), (0, _swagger.ApiOperation)({
  summary: 'Student activity metrics'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Query)('days')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "studentActivity", null);
__decorate([(0, _common.Get)('revenue'), (0, _swagger.ApiOperation)({
  summary: 'Revenue analytics'
}), (0, _roles.Roles)('ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), __param(0, (0, _common.Request)()), __param(1, (0, _common.Query)('months')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "revenue", null);
__decorate([(0, _common.Get)('ai-usage'), (0, _swagger.ApiOperation)({
  summary: 'AI feature usage statistics'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "aiUsage", null);
__decorate([(0, _common.Get)('engagement'), (0, _swagger.ApiOperation)({
  summary: 'Student engagement heatmap (day × hour)'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "engagement", null);
__decorate([(0, _common.Get)('top-courses'), (0, _swagger.ApiOperation)({
  summary: 'Top courses with completion rates'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "topCourses", null);
__decorate([(0, _common.Get)('teacher/overview'), (0, _swagger.ApiOperation)({
  summary: 'Teacher analytics overview'
}), (0, _roles.Roles)('TEACHER', 'ADMIN', 'SUPER_ADMIN'), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "teacherOverview", null);
__decorate([(0, _common.Get)('teacher/courses'), (0, _swagger.ApiOperation)({
  summary: 'Teacher course performance'
}), (0, _roles.Roles)('TEACHER', 'ADMIN', 'SUPER_ADMIN'), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "teacherCourses", null);
__decorate([(0, _common.Get)('teacher/enrollment-trend'), (0, _swagger.ApiOperation)({
  summary: 'Teacher enrollment trend over time'
}), (0, _roles.Roles)('TEACHER', 'ADMIN', 'SUPER_ADMIN'), __param(0, (0, _common.Request)()), __param(1, (0, _common.Query)('days')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "teacherEnrollmentTrend", null);
__decorate([(0, _common.Get)('teacher/top-students'), (0, _swagger.ApiOperation)({
  summary: 'Top performing students for a teacher'
}), (0, _roles.Roles)('TEACHER', 'ADMIN', 'SUPER_ADMIN'), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "teacherTopStudents", null);
__decorate([(0, _common.Get)('student/overview'), (0, _swagger.ApiOperation)({
  summary: 'Student analytics overview'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "studentOverview", null);
__decorate([(0, _common.Get)('student/performance'), (0, _swagger.ApiOperation)({
  summary: 'Student performance by subject'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "studentPerformance", null);
__decorate([(0, _common.Get)('student/activity'), (0, _swagger.ApiOperation)({
  summary: 'Student activity heatmap data'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "studentActivity2", null);
__decorate([(0, _common.Get)('admin/platform'), (0, _swagger.ApiOperation)({
  summary: 'Admin platform overview KPIs'
}), (0, _roles.Roles)('ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN'), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "adminPlatform", null);
__decorate([(0, _common.Get)('admin/cohort'), (0, _swagger.ApiOperation)({
  summary: 'Cohort retention analysis'
}), (0, _roles.Roles)('ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN'), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "adminCohort", null);
__decorate([(0, _common.Get)('admin/top-tenants'), (0, _swagger.ApiOperation)({
  summary: 'Top tenants by users and revenue'
}), (0, _roles.Roles)('SUPER_ADMIN'), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], AnalyticsController.prototype, "adminTopTenants", null);
exports.AnalyticsController = AnalyticsController = __decorate([(0, _swagger.ApiTags)('Analytics'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Controller)('analytics'), __param(0, (0, _common.Inject)(_analytics.AnalyticsService)), __metadata("design:paramtypes", [Object])], AnalyticsController);