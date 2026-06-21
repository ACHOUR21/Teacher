"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UniversityErpController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _roles = require("../../../core/decorators/roles.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _universityErp = require("../../university-erp.service");
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

let UniversityErpController = exports.UniversityErpController = class UniversityErpController {
  constructor(universityErpService) {
    this.universityErpService = universityErpService;
  }
  create(req, body) {
    return this.universityErpService.createUniversity(req.tenant?.id, body);
  }
  findAll(req) {
    return this.universityErpService.getUniversities(req.tenant?.id);
  }
  findOne(id) {
    return this.universityErpService.getUniversity(id);
  }
  updateUniversity(id, body) {
    return this.universityErpService.updateUniversity(id, body);
  }
  faculties(id) {
    return this.universityErpService.getFaculties(id);
  }
  createFaculty(id, body) {
    return this.universityErpService.createFaculty(id, body);
  }
  deleteFaculty(id) {
    return this.universityErpService.deleteFaculty(id);
  }
  createDepartment(facultyId, body) {
    return this.universityErpService.createUniDepartment(facultyId, body);
  }
  getDepartments(facultyId) {
    return this.universityErpService.getDepartments(facultyId);
  }
  createProgram(id, body) {
    return this.universityErpService.createProgram(id, body);
  }
  programs(id) {
    return this.universityErpService.getPrograms(id);
  }
  programStats(programId) {
    return this.universityErpService.getProgramEnrollmentStats(programId);
  }
  enroll(programId, body) {
    return this.universityErpService.enrollStudent(body.studentId, programId);
  }
  enrollments(programId) {
    return this.universityErpService.getEnrollments(programId);
  }
  updateStatus(id, body) {
    return this.universityErpService.updateEnrollmentStatus(id, body.status);
  }
  academicRecord(studentId, universityId) {
    return this.universityErpService.getStudentAcademicRecord(studentId, universityId);
  }
};
__decorate([(0, _common.Post)('universities'), (0, _roles.Roles)('ADMIN', 'UNIVERSITY_ADMIN', 'SUPER_ADMIN'), (0, _swagger.ApiOperation)({
  summary: 'Create a university'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], UniversityErpController.prototype, "create", null);
__decorate([(0, _common.Get)('universities'), (0, _swagger.ApiOperation)({
  summary: 'List universities'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], UniversityErpController.prototype, "findAll", null);
__decorate([(0, _common.Get)('universities/:id'), (0, _swagger.ApiOperation)({
  summary: 'Get a university by ID'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], UniversityErpController.prototype, "findOne", null);
__decorate([(0, _common.Patch)('universities/:id'), (0, _roles.Roles)('ADMIN', 'UNIVERSITY_ADMIN'), (0, _swagger.ApiOperation)({
  summary: 'Update university fields'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], UniversityErpController.prototype, "updateUniversity", null);
__decorate([(0, _common.Get)('universities/:id/faculties'), (0, _swagger.ApiOperation)({
  summary: 'List faculties in university'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], UniversityErpController.prototype, "faculties", null);
__decorate([(0, _common.Post)('universities/:id/faculties'), (0, _roles.Roles)('ADMIN', 'UNIVERSITY_ADMIN'), (0, _swagger.ApiOperation)({
  summary: 'Create a faculty'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], UniversityErpController.prototype, "createFaculty", null);
__decorate([(0, _common.Delete)('faculties/:id'), (0, _roles.Roles)('ADMIN', 'UNIVERSITY_ADMIN'), (0, _swagger.ApiOperation)({
  summary: 'Delete a faculty'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], UniversityErpController.prototype, "deleteFaculty", null);
__decorate([(0, _common.Post)('faculties/:facultyId/departments'), (0, _roles.Roles)('ADMIN', 'UNIVERSITY_ADMIN'), (0, _swagger.ApiOperation)({
  summary: 'Create a department under a faculty'
}), __param(0, (0, _common.Param)('facultyId')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], UniversityErpController.prototype, "createDepartment", null);
__decorate([(0, _common.Get)('faculties/:facultyId/departments'), (0, _swagger.ApiOperation)({
  summary: 'List departments in a faculty'
}), __param(0, (0, _common.Param)('facultyId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], UniversityErpController.prototype, "getDepartments", null);
__decorate([(0, _common.Post)('universities/:id/programs'), (0, _roles.Roles)('ADMIN', 'UNIVERSITY_ADMIN'), (0, _swagger.ApiOperation)({
  summary: 'Create an academic program'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], UniversityErpController.prototype, "createProgram", null);
__decorate([(0, _common.Get)('universities/:id/programs'), (0, _swagger.ApiOperation)({
  summary: 'List programs in university'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], UniversityErpController.prototype, "programs", null);
__decorate([(0, _common.Get)('programs/:programId/stats'), (0, _swagger.ApiOperation)({
  summary: 'Get enrollment stats for a program'
}), __param(0, (0, _common.Param)('programId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], UniversityErpController.prototype, "programStats", null);
__decorate([(0, _common.Post)('programs/:programId/enroll'), (0, _roles.Roles)('ADMIN', 'UNIVERSITY_ADMIN'), (0, _swagger.ApiOperation)({
  summary: 'Enroll a student in a program'
}), __param(0, (0, _common.Param)('programId')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], UniversityErpController.prototype, "enroll", null);
__decorate([(0, _common.Get)('programs/:programId/enrollments'), (0, _swagger.ApiOperation)({
  summary: 'Get program enrollments'
}), __param(0, (0, _common.Param)('programId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], UniversityErpController.prototype, "enrollments", null);
__decorate([(0, _common.Patch)('enrollments/:id/status'), (0, _roles.Roles)('ADMIN', 'UNIVERSITY_ADMIN'), (0, _swagger.ApiOperation)({
  summary: 'Update enrollment status'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], UniversityErpController.prototype, "updateStatus", null);
__decorate([(0, _common.Get)('students/:studentId/academic-record'), (0, _swagger.ApiOperation)({
  summary: 'Get full academic record for a student'
}), __param(0, (0, _common.Param)('studentId')), __param(1, (0, _common.Query)('universityId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], UniversityErpController.prototype, "academicRecord", null);
exports.UniversityErpController = UniversityErpController = __decorate([(0, _swagger.ApiTags)('University ERP'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Controller)('university-erp'), __param(0, (0, _common.Inject)(_universityErp.UniversityErpService)), __metadata("design:paramtypes", [Object])], UniversityErpController);