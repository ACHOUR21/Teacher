"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UniversityController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _currentUser = require("../core/decorators/current-user.decorator");
var _roles = require("../core/decorators/roles.decorator");
var _jwtAuth = require("../core/guards/jwt-auth.guard");
var _roles2 = require("../core/guards/roles.guard");
var _university = require("./university.service");
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
let UniversityController = exports.UniversityController = class UniversityController {
  constructor(universityService) {
    this.universityService = universityService;
  }
  // ─── Dashboard ────────────────────────────────────────────────────────────
  getDashboard(user) {
    return this.universityService.getDashboardStats(user.tenantId);
  }
  // ─── Departments ──────────────────────────────────────────────────────────
  getDepartments(user) {
    return this.universityService.getDepartments(user.tenantId);
  }
  createDepartment(user, body) {
    return this.universityService.createDepartment(user.tenantId, body);
  }
  // ─── Faculty ──────────────────────────────────────────────────────────────
  getFaculty(user, departmentId) {
    return this.universityService.getFacultyMembers(user.tenantId, departmentId);
  }
  createFaculty(user, body) {
    return this.universityService.createFacultyMember(user.tenantId, body);
  }
  // ─── Courses ──────────────────────────────────────────────────────────────
  getCourses(user, departmentId, page = 1, limit = 20) {
    return this.universityService.getUniversityCourses(user.tenantId, departmentId, page, limit);
  }
  // ─── Enrollment ───────────────────────────────────────────────────────────
  enrollStudent(user, body) {
    return this.universityService.enrollStudent(user.tenantId, body.studentId, body.courseId, body.semesterId);
  }
  dropCourse(user, courseId, studentId) {
    // Admins/Teachers can pass studentId; students drop their own
    const sid = studentId ?? user.id;
    return this.universityService.dropCourse(user.tenantId, sid, courseId);
  }
  // ─── Transcript ───────────────────────────────────────────────────────────
  getTranscript(user, studentId) {
    return this.universityService.getTranscript(user.tenantId, studentId);
  }
  // ─── Semesters ────────────────────────────────────────────────────────────
  getActiveSemester(user) {
    return this.universityService.getActiveSemester(user.tenantId);
  }
  createSemester(user, body) {
    return this.universityService.createSemester(user.tenantId, body);
  }
};
__decorate([(0, _common.Get)('dashboard'), (0, _swagger.ApiOperation)({
  summary: 'Get university dashboard stats'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_a = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _a : Object]), __metadata("design:returntype", void 0)], UniversityController.prototype, "getDashboard", null);
__decorate([(0, _common.Get)('departments'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.TEACHER, _client.UserRole.UNIVERSITY_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'List departments with faculty and course counts'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_b = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _b : Object]), __metadata("design:returntype", void 0)], UniversityController.prototype, "getDepartments", null);
__decorate([(0, _common.Post)('departments'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.UNIVERSITY_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Create a department'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_c = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _c : Object, typeof (_d = typeof _university.CreateDepartmentDto !== "undefined" && _university.CreateDepartmentDto) === "function" ? _d : Object]), __metadata("design:returntype", void 0)], UniversityController.prototype, "createDepartment", null);
__decorate([(0, _common.Get)('faculty'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.TEACHER, _client.UserRole.UNIVERSITY_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'List all faculty members'
}), (0, _swagger.ApiQuery)({
  name: 'departmentId',
  required: false
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Query)('departmentId')), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_e = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _e : Object, String]), __metadata("design:returntype", void 0)], UniversityController.prototype, "getFaculty", null);
__decorate([(0, _common.Post)('faculty'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.UNIVERSITY_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Add a faculty member'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_f = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _f : Object, typeof (_g = typeof _university.CreateFacultyMemberDto !== "undefined" && _university.CreateFacultyMemberDto) === "function" ? _g : Object]), __metadata("design:returntype", void 0)], UniversityController.prototype, "createFaculty", null);
__decorate([(0, _common.Get)('courses'), (0, _swagger.ApiOperation)({
  summary: 'List university courses (paginated)'
}), (0, _swagger.ApiQuery)({
  name: 'departmentId',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'page',
  required: false,
  type: Number
}), (0, _swagger.ApiQuery)({
  name: 'limit',
  required: false,
  type: Number
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Query)('departmentId')), __param(2, (0, _common.Query)('page', new _common.DefaultValuePipe(1), _common.ParseIntPipe)), __param(3, (0, _common.Query)('limit', new _common.DefaultValuePipe(20), _common.ParseIntPipe)), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_h = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _h : Object, String, Object, Object]), __metadata("design:returntype", void 0)], UniversityController.prototype, "getCourses", null);
__decorate([(0, _common.Post)('enrollment'), (0, _swagger.ApiOperation)({
  summary: 'Enroll a student in a course'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_j = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _j : Object, Object]), __metadata("design:returntype", void 0)], UniversityController.prototype, "enrollStudent", null);
__decorate([(0, _common.Delete)('enrollment/:courseId'), (0, _swagger.ApiOperation)({
  summary: 'Drop a course (for current user student)'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Param)('courseId')), __param(2, (0, _common.Query)('studentId')), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_k = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _k : Object, String, String]), __metadata("design:returntype", void 0)], UniversityController.prototype, "dropCourse", null);
__decorate([(0, _common.Get)('transcript/:studentId'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.TEACHER, _client.UserRole.UNIVERSITY_ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.STUDENT), (0, _swagger.ApiOperation)({
  summary: 'Get transcript for a student'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Param)('studentId')), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_l = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _l : Object, String]), __metadata("design:returntype", void 0)], UniversityController.prototype, "getTranscript", null);
__decorate([(0, _common.Get)('semesters/active'), (0, _swagger.ApiOperation)({
  summary: 'Get current active semester'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_m = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _m : Object]), __metadata("design:returntype", void 0)], UniversityController.prototype, "getActiveSemester", null);
__decorate([(0, _common.Post)('semesters'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.UNIVERSITY_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Create a semester'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_o = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _o : Object, typeof (_p = typeof _university.CreateSemesterDto !== "undefined" && _university.CreateSemesterDto) === "function" ? _p : Object]), __metadata("design:returntype", void 0)], UniversityController.prototype, "createSemester", null);
exports.UniversityController = UniversityController = __decorate([(0, _swagger.ApiTags)('University ERP'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _common.Controller)('university'), __param(0, (0, _common.Inject)(_university.UniversityService)), __metadata("design:paramtypes", [Object])], UniversityController);