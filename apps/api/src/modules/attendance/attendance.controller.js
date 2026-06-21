"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AttendanceController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _currentUser = require("../core/decorators/current-user.decorator");
var _roles = require("../core/decorators/roles.decorator");
var _jwtAuth = require("../core/guards/jwt-auth.guard");
var _roles2 = require("../core/guards/roles.guard");
var _prisma = require("../database/prisma.service");
var _attendance = require("./attendance.service");
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
var _a, _b, _c, _d;
let AttendanceController = exports.AttendanceController = class AttendanceController {
  constructor(attendanceService, prisma) {
    this.attendanceService = attendanceService;
    this.prisma = prisma;
  }
  async markAttendance(user, dto) {
    return this.attendanceService.markAttendance(dto.classId, dto.date, dto.records, user.id);
  }
  async getMyAttendance(user, from, to) {
    const student = await this.prisma.student.findUnique({
      where: {
        userId: user.id
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student profile not found');
    }
    return this.attendanceService.getStudentAttendance(student.id, from, to);
  }
  async getClassAttendance(classId, date) {
    const resolvedDate = date ?? new Date().toISOString().split('T')[0];
    return this.attendanceService.getClassAttendance(classId, resolvedDate);
  }
  async getClassSummary(classId, from, to) {
    const resolvedFrom = from ?? new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const resolvedTo = to ?? new Date().toISOString().split('T')[0];
    return this.attendanceService.getClassSummary(classId, resolvedFrom, resolvedTo);
  }
  async getClassRoster(classId) {
    return this.attendanceService.getClassRoster(classId);
  }
  async getStudentAttendance(studentId, user, from, to) {
    // Students can only view their own attendance
    if (user.role === _client.UserRole.STUDENT) {
      const student = await this.prisma.student.findUnique({
        where: {
          userId: user.id
        }
      });
      if (!student || student.id !== studentId) {
        throw new _common.ForbiddenException('You can only view your own attendance');
      }
    }
    return this.attendanceService.getStudentAttendance(studentId, from, to);
  }
};
__decorate([(0, _common.Post)(), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.SCHOOL_ADMIN), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Mark attendance for a class on a given date'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_a = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _a : Object, typeof (_b = typeof _attendance.MarkAttendanceDto !== "undefined" && _attendance.MarkAttendanceDto) === "function" ? _b : Object]), __metadata("design:returntype", Promise)], AttendanceController.prototype, "markAttendance", null);
__decorate([(0, _common.Get)('my'), (0, _roles.Roles)(_client.UserRole.STUDENT), (0, _swagger.ApiOperation)({
  summary: 'Get own attendance history (student)'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Query)('from')), __param(2, (0, _common.Query)('to')), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_c = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _c : Object, String, String]), __metadata("design:returntype", Promise)], AttendanceController.prototype, "getMyAttendance", null);
__decorate([(0, _common.Get)('class/:classId'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.SCHOOL_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Get attendance for a class on a specific date'
}), __param(0, (0, _common.Param)('classId')), __param(1, (0, _common.Query)('date')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", Promise)], AttendanceController.prototype, "getClassAttendance", null);
__decorate([(0, _common.Get)('class/:classId/summary'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.SCHOOL_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Get per-student attendance summary for a class over a date range'
}), __param(0, (0, _common.Param)('classId')), __param(1, (0, _common.Query)('from')), __param(2, (0, _common.Query)('to')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, String]), __metadata("design:returntype", Promise)], AttendanceController.prototype, "getClassSummary", null);
__decorate([(0, _common.Get)('class/:classId/roster'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.SCHOOL_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Get class roster (all students) for attendance marking'
}), __param(0, (0, _common.Param)('classId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", Promise)], AttendanceController.prototype, "getClassRoster", null);
__decorate([(0, _common.Get)('student/:studentId'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.STUDENT), (0, _swagger.ApiOperation)({
  summary: "Get a student's attendance history"
}), __param(0, (0, _common.Param)('studentId')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Query)('from')), __param(3, (0, _common.Query)('to')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_d = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _d : Object, String, String]), __metadata("design:returntype", Promise)], AttendanceController.prototype, "getStudentAttendance", null);
exports.AttendanceController = AttendanceController = __decorate([(0, _swagger.ApiTags)('Attendance'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _common.Controller)('attendance'), __param(0, (0, _common.Inject)(_attendance.AttendanceService)), __param(1, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object, Object])], AttendanceController);