"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SchoolErpController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _roles = require("../../../core/decorators/roles.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _roles2 = require("../../../core/guards/roles.guard");
var _attendanceManagement = require("../../attendance-management.service");
var _gradebook = require("../../gradebook.service");
var _schoolErp = require("../../school-erp.service");
var _timetable = require("../../timetable.service");
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
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

let SchoolErpController = exports.SchoolErpController = class SchoolErpController {
  constructor(schoolErpService, timetableService, gradeBookService, attendanceManagementService) {
    this.schoolErpService = schoolErpService;
    this.timetableService = timetableService;
    this.gradeBookService = gradeBookService;
    this.attendanceManagementService = attendanceManagementService;
  }
  // ─── Schools ────────────────────────────────────────────────────────────────
  create(req, body) {
    return this.schoolErpService.createSchool(req.tenant?.id, body);
  }
  findAll(req) {
    return this.schoolErpService.getSchools(req.tenant?.id);
  }
  findOne(id) {
    return this.schoolErpService.getSchool(id);
  }
  stats(id) {
    return this.schoolErpService.getSchoolStats(id);
  }
  createDepartment(schoolId, body) {
    return this.schoolErpService.createDepartment(schoolId, body);
  }
  departments(schoolId) {
    return this.schoolErpService.getDepartments(schoolId);
  }
  createClass(schoolId, body) {
    return this.schoolErpService.createClass(schoolId, body);
  }
  classes(schoolId) {
    return this.schoolErpService.getClasses(schoolId);
  }
  assignTeacher(schoolId, teacherId) {
    return this.schoolErpService.assignTeacherToSchool(teacherId, schoolId);
  }
  getTeachers(schoolId) {
    return this.schoolErpService.getSchoolTeachers(schoolId);
  }
  // ─── Students ───────────────────────────────────────────────────────────────
  assignStudent(classId, studentId) {
    return this.schoolErpService.assignStudentToClass(studentId, classId);
  }
  removeStudent(classId, studentId) {
    return this.schoolErpService.removeStudentFromClass(studentId, classId);
  }
  getClassStudents(classId) {
    return this.schoolErpService.getClassStudents(classId);
  }
  // ─── Timetable ──────────────────────────────────────────────────────────────
  getClassTimetable(classId) {
    return this.timetableService.getClassTimetable(classId);
  }
  createSlot(dto) {
    return this.timetableService.upsertSlot(dto);
  }
  updateSlot(id, dto) {
    return this.timetableService.upsertSlot({
      ...dto,
      id
    });
  }
  deleteSlot(id) {
    return this.timetableService.deleteSlot(id);
  }
  detectConflicts(req) {
    return this.timetableService.detectConflicts(req.tenant?.id);
  }
  getTeacherTimetable(teacherId) {
    return this.timetableService.getTeacherTimetable(teacherId);
  }
  // Legacy endpoints kept for backwards compatibility
  addTimetable(classId, body) {
    return this.schoolErpService.createTimetableEntry(classId, body);
  }
  deleteTimetable(id) {
    return this.schoolErpService.deleteTimetableEntry(id);
  }
  // ─── Grade Book ─────────────────────────────────────────────────────────────
  getClassGrades(classId, subject, term) {
    return this.gradeBookService.getClassGrades(classId, subject, term);
  }
  submitGrade(dto, req, user) {
    return this.gradeBookService.submitGrade(dto, req.tenant?.id, user.id);
  }
  bulkImportGrades(body, req, user) {
    return this.gradeBookService.bulkImportGrades(body.classId, body.grades, req.tenant?.id, user.id);
  }
  getClassStats(classId, subject) {
    return this.gradeBookService.getClassStats(classId, subject);
  }
  getReportCard(studentId, term) {
    return this.gradeBookService.getReportCard(studentId, term || 'Term 1');
  }
  // ─── Attendance Management ──────────────────────────────────────────────────
  markBulkAttendance(body, user) {
    return this.attendanceManagementService.markBulkAttendance(body.classId, new Date(body.date), body.records, user.id);
  }
  getClassAttendanceSummary(classId, from, to) {
    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate = to ? new Date(to) : now;
    return this.attendanceManagementService.getClassAttendanceSummary(classId, fromDate, toDate);
  }
  getStudentAttendance(studentId, from, to) {
    return this.attendanceManagementService.getStudentAttendance(studentId, from ? new Date(from) : undefined, to ? new Date(to) : undefined);
  }
  getFlaggedStudents(classId, threshold) {
    const thresh = threshold ? Number(threshold) : 75;
    return this.attendanceManagementService.getFlaggedStudents(classId, thresh);
  }
  sendAbsenceAlerts(classId, date) {
    return this.attendanceManagementService.sendAbsenceAlerts(classId, date ? new Date(date) : new Date());
  }
};
__decorate([(0, _common.Post)('schools'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Create a school'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "create", null);
__decorate([(0, _common.Get)('schools'), (0, _swagger.ApiOperation)({
  summary: 'List schools in tenant'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "findAll", null);
__decorate([(0, _common.Get)('schools/:id'), (0, _swagger.ApiOperation)({
  summary: 'Get school details'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "findOne", null);
__decorate([(0, _common.Get)('schools/:id/stats'), (0, _swagger.ApiOperation)({
  summary: 'Get school statistics'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "stats", null);
__decorate([(0, _common.Post)('schools/:id/departments'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Create a department'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "createDepartment", null);
__decorate([(0, _common.Get)('schools/:id/departments'), (0, _swagger.ApiOperation)({
  summary: 'List school departments'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "departments", null);
__decorate([(0, _common.Post)('schools/:id/classes'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Create a class'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "createClass", null);
__decorate([(0, _common.Get)('schools/:id/classes'), (0, _swagger.ApiOperation)({
  summary: 'List school classes'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "classes", null);
__decorate([(0, _common.Post)('schools/:schoolId/teachers'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Assign teacher to school'
}), (0, _swagger.ApiBody)({
  schema: {
    properties: {
      teacherId: {
        type: 'string'
      }
    },
    required: ['teacherId']
  }
}), __param(0, (0, _common.Param)('schoolId')), __param(1, (0, _common.Body)('teacherId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "assignTeacher", null);
__decorate([(0, _common.Get)('schools/:schoolId/teachers'), (0, _swagger.ApiOperation)({
  summary: 'List school teachers'
}), __param(0, (0, _common.Param)('schoolId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "getTeachers", null);
__decorate([(0, _common.Post)('classes/:classId/students'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Assign student to class'
}), (0, _swagger.ApiBody)({
  schema: {
    properties: {
      studentId: {
        type: 'string'
      }
    },
    required: ['studentId']
  }
}), __param(0, (0, _common.Param)('classId')), __param(1, (0, _common.Body)('studentId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "assignStudent", null);
__decorate([(0, _common.Delete)('classes/:classId/students/:studentId'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Remove student from class'
}), __param(0, (0, _common.Param)('classId')), __param(1, (0, _common.Param)('studentId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "removeStudent", null);
__decorate([(0, _common.Get)('classes/:classId/students'), (0, _swagger.ApiOperation)({
  summary: 'List students in a class'
}), __param(0, (0, _common.Param)('classId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "getClassStudents", null);
__decorate([(0, _common.Get)('classes/:classId/timetable'), (0, _swagger.ApiOperation)({
  summary: 'Get class weekly timetable (grouped by day)'
}), __param(0, (0, _common.Param)('classId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "getClassTimetable", null);
__decorate([(0, _common.Post)('timetable/slots'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.TEACHER), (0, _swagger.ApiOperation)({
  summary: 'Create a timetable slot'
}), __param(0, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_a = typeof _timetable.UpsertTimetableSlotDto !== "undefined" && _timetable.UpsertTimetableSlotDto) === "function" ? _a : Object]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "createSlot", null);
__decorate([(0, _common.Put)('timetable/slots/:id'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.TEACHER), (0, _swagger.ApiOperation)({
  summary: 'Update a timetable slot'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_b = typeof Omit !== "undefined" && Omit) === "function" ? _b : Object]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "updateSlot", null);
__decorate([(0, _common.Delete)('timetable/slots/:id'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.TEACHER), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Delete a timetable slot'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "deleteSlot", null);
__decorate([(0, _common.Get)('timetable/conflicts'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Detect timetable conflicts for the tenant'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "detectConflicts", null);
__decorate([(0, _common.Get)('teachers/:teacherId/timetable'), (0, _swagger.ApiOperation)({
  summary: "Get a teacher's full schedule"
}), __param(0, (0, _common.Param)('teacherId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "getTeacherTimetable", null);
__decorate([(0, _common.Post)('classes/:classId/timetable'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.TEACHER), (0, _swagger.ApiOperation)({
  summary: 'Add timetable entry (legacy)'
}), __param(0, (0, _common.Param)('classId')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "addTimetable", null);
__decorate([(0, _common.Delete)('timetable/:id'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.TEACHER), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Delete a timetable entry (legacy)'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "deleteTimetable", null);
__decorate([(0, _common.Get)('classes/:classId/grades'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.TEACHER), (0, _swagger.ApiOperation)({
  summary: 'Get class grade book'
}), (0, _swagger.ApiQuery)({
  name: 'subject',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'term',
  required: false
}), __param(0, (0, _common.Param)('classId')), __param(1, (0, _common.Query)('subject')), __param(2, (0, _common.Query)('term')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "getClassGrades", null);
__decorate([(0, _common.Post)('grades'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.TEACHER), (0, _common.HttpCode)(_common.HttpStatus.CREATED), (0, _swagger.ApiOperation)({
  summary: 'Submit or update a grade'
}), __param(0, (0, _common.Body)()), __param(1, (0, _common.Request)()), __param(2, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, typeof (_c = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _c : Object]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "submitGrade", null);
__decorate([(0, _common.Post)('grades/bulk-import'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.TEACHER), (0, _swagger.ApiOperation)({
  summary: 'Bulk import grades'
}), __param(0, (0, _common.Body)()), __param(1, (0, _common.Request)()), __param(2, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, typeof (_d = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _d : Object]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "bulkImportGrades", null);
__decorate([(0, _common.Get)('classes/:classId/grade-stats'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.TEACHER), (0, _swagger.ApiOperation)({
  summary: 'Get class grade statistics'
}), (0, _swagger.ApiQuery)({
  name: 'subject',
  required: false
}), __param(0, (0, _common.Param)('classId')), __param(1, (0, _common.Query)('subject')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "getClassStats", null);
__decorate([(0, _common.Get)('students/:studentId/report-card'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.TEACHER, _client.UserRole.STUDENT, _client.UserRole.PARENT), (0, _swagger.ApiOperation)({
  summary: 'Get student report card'
}), (0, _swagger.ApiQuery)({
  name: 'term',
  required: true
}), __param(0, (0, _common.Param)('studentId')), __param(1, (0, _common.Query)('term')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "getReportCard", null);
__decorate([(0, _common.Post)('attendance/bulk'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.TEACHER), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Mark bulk attendance for a class'
}), __param(0, (0, _common.Body)()), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, typeof (_e = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _e : Object]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "markBulkAttendance", null);
__decorate([(0, _common.Get)('classes/:classId/attendance'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.TEACHER), (0, _swagger.ApiOperation)({
  summary: 'Get class attendance summary'
}), (0, _swagger.ApiQuery)({
  name: 'from',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'to',
  required: false
}), __param(0, (0, _common.Param)('classId')), __param(1, (0, _common.Query)('from')), __param(2, (0, _common.Query)('to')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "getClassAttendanceSummary", null);
__decorate([(0, _common.Get)('students/:studentId/attendance'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.TEACHER, _client.UserRole.STUDENT, _client.UserRole.PARENT), (0, _swagger.ApiOperation)({
  summary: "Get student's attendance history"
}), (0, _swagger.ApiQuery)({
  name: 'from',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'to',
  required: false
}), __param(0, (0, _common.Param)('studentId')), __param(1, (0, _common.Query)('from')), __param(2, (0, _common.Query)('to')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "getStudentAttendance", null);
__decorate([(0, _common.Get)('classes/:classId/attendance/flagged'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.TEACHER), (0, _swagger.ApiOperation)({
  summary: 'Get students with attendance below threshold'
}), (0, _swagger.ApiQuery)({
  name: 'threshold',
  required: false
}), __param(0, (0, _common.Param)('classId')), __param(1, (0, _common.Query)('threshold')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "getFlaggedStudents", null);
__decorate([(0, _common.Post)('attendance/send-alerts/:classId'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.TEACHER), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Send absence alerts to parents'
}), __param(0, (0, _common.Param)('classId')), __param(1, (0, _common.Body)('date')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], SchoolErpController.prototype, "sendAbsenceAlerts", null);
exports.SchoolErpController = SchoolErpController = __decorate([(0, _swagger.ApiTags)('School ERP'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _common.Controller)('school-erp'), __param(0, (0, _common.Inject)(_schoolErp.SchoolErpService)), __param(1, (0, _common.Inject)(_timetable.TimetableService)), __param(2, (0, _common.Inject)(_gradebook.GradeBookService)), __param(3, (0, _common.Inject)(_attendanceManagement.AttendanceManagementService)), __metadata("design:paramtypes", [Object, Object, Object, Object])], SchoolErpController);