"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AssignmentsController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _currentUser = require("../core/decorators/current-user.decorator");
var _roles = require("../core/decorators/roles.decorator");
var _jwtAuth = require("../core/guards/jwt-auth.guard");
var _roles2 = require("../core/guards/roles.guard");
var _prisma = require("../database/prisma.service");
var _assignments = require("./assignments.service");
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
let AssignmentsController = exports.AssignmentsController = class AssignmentsController {
  constructor(assignmentsService, prisma) {
    this.assignmentsService = assignmentsService;
    this.prisma = prisma;
  }
  async create(user, dto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        userId: user.id
      }
    });
    if (!teacher) {
      throw new _common.NotFoundException('Teacher profile not found');
    }
    return this.assignmentsService.create(teacher.id, dto);
  }
  async findAll(user, lessonId) {
    const isTeacherRole = user.role === _client.UserRole.TEACHER;
    if (isTeacherRole) {
      const teacher = await this.prisma.teacher.findUnique({
        where: {
          userId: user.id
        }
      });
      return this.assignmentsService.findAll(teacher?.id, undefined, lessonId);
    }
    const isStudentRole = user.role === _client.UserRole.STUDENT;
    if (isStudentRole) {
      const student = await this.prisma.student.findUnique({
        where: {
          userId: user.id
        }
      });
      if (!student) {
        throw new _common.NotFoundException('Student profile not found');
      }
      return this.assignmentsService.getStudentAssignments(student.id);
    }
    return this.assignmentsService.findAll(undefined, undefined, lessonId);
  }
  async myAssignments(user) {
    const student = await this.prisma.student.findUnique({
      where: {
        userId: user.id
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student profile not found');
    }
    return this.assignmentsService.getStudentAssignments(student.id);
  }
  findById(id) {
    return this.assignmentsService.findById(id);
  }
  async update(id, user, dto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        userId: user.id
      }
    });
    if (!teacher) {
      throw new _common.NotFoundException('Teacher profile not found');
    }
    return this.assignmentsService.update(id, teacher.id, dto);
  }
  async delete(id, user) {
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        userId: user.id
      }
    });
    if (!teacher) {
      throw new _common.NotFoundException('Teacher profile not found');
    }
    return this.assignmentsService.delete(id, teacher.id);
  }
  async submit(assignmentId, user, dto) {
    const student = await this.prisma.student.findUnique({
      where: {
        userId: user.id
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student profile not found');
    }
    return this.assignmentsService.submit(assignmentId, student.id, dto);
  }
  async getSubmissions(id, user) {
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        userId: user.id
      }
    });
    if (!teacher) {
      throw new _common.NotFoundException('Teacher profile not found');
    }
    return this.assignmentsService.getSubmissions(id, teacher.id);
  }
  async getMySubmission(assignmentId, user) {
    const student = await this.prisma.student.findUnique({
      where: {
        userId: user.id
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student profile not found');
    }
    return this.assignmentsService.getMySubmission(assignmentId, student.id);
  }
  async grade(submissionId, user, dto) {
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        userId: user.id
      }
    });
    if (!teacher) {
      throw new _common.NotFoundException('Teacher profile not found');
    }
    return this.assignmentsService.grade(submissionId, teacher.id, dto);
  }
};
__decorate([(0, _common.Post)(), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Create an assignment'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_a = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _a : Object, typeof (_b = typeof _assignments.CreateAssignmentDto !== "undefined" && _assignments.CreateAssignmentDto) === "function" ? _b : Object]), __metadata("design:returntype", Promise)], AssignmentsController.prototype, "create", null);
__decorate([(0, _common.Get)(), (0, _swagger.ApiOperation)({
  summary: 'List assignments (filter by lessonId, or all for teacher)'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Query)('lessonId')), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_c = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _c : Object, String]), __metadata("design:returntype", Promise)], AssignmentsController.prototype, "findAll", null);
__decorate([(0, _common.Get)('my'), (0, _roles.Roles)(_client.UserRole.STUDENT), (0, _swagger.ApiOperation)({
  summary: 'Get all assignments for the logged-in student'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_d = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _d : Object]), __metadata("design:returntype", Promise)], AssignmentsController.prototype, "myAssignments", null);
__decorate([(0, _common.Get)(':id'), (0, _swagger.ApiOperation)({
  summary: 'Get assignment by ID'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], AssignmentsController.prototype, "findById", null);
__decorate([(0, _common.Patch)(':id'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Update an assignment'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_e = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _e : Object, typeof (_f = typeof Partial !== "undefined" && Partial) === "function" ? _f : Object]), __metadata("design:returntype", Promise)], AssignmentsController.prototype, "update", null);
__decorate([(0, _common.Delete)(':id'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Delete an assignment'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_g = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _g : Object]), __metadata("design:returntype", Promise)], AssignmentsController.prototype, "delete", null);
__decorate([(0, _common.Post)(':id/submit'), (0, _roles.Roles)(_client.UserRole.STUDENT), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Submit an assignment'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_h = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _h : Object, typeof (_j = typeof _assignments.SubmitAssignmentDto !== "undefined" && _assignments.SubmitAssignmentDto) === "function" ? _j : Object]), __metadata("design:returntype", Promise)], AssignmentsController.prototype, "submit", null);
__decorate([(0, _common.Get)(':id/submissions'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Get all submissions for an assignment'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_k = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _k : Object]), __metadata("design:returntype", Promise)], AssignmentsController.prototype, "getSubmissions", null);
__decorate([(0, _common.Get)(':id/my-submission'), (0, _roles.Roles)(_client.UserRole.STUDENT), (0, _swagger.ApiOperation)({
  summary: 'Get my submission for an assignment'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_l = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _l : Object]), __metadata("design:returntype", Promise)], AssignmentsController.prototype, "getMySubmission", null);
__decorate([(0, _common.Patch)('submissions/:submissionId/grade'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Grade a submission'
}), __param(0, (0, _common.Param)('submissionId')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_m = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _m : Object, typeof (_o = typeof _assignments.GradeSubmissionDto !== "undefined" && _assignments.GradeSubmissionDto) === "function" ? _o : Object]), __metadata("design:returntype", Promise)], AssignmentsController.prototype, "grade", null);
exports.AssignmentsController = AssignmentsController = __decorate([(0, _swagger.ApiTags)('Assignments'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _common.Controller)('assignments'), __param(0, (0, _common.Inject)(_assignments.AssignmentsService)), __param(1, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object, Object])], AssignmentsController);