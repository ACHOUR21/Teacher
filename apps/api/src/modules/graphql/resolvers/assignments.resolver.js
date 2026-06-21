"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AssignmentsResolver = void 0;
var _common = require("@nestjs/common");
var _graphql = require("@nestjs/graphql");
var _assignments = require("../../assignments/assignments.service");
var _currentUser = require("../../core/decorators/current-user.decorator");
var _gqlAuth = require("../guards/gql-auth.guard");
var _assignment = require("../types/assignment.types");
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
var _a, _b, _c, _d, _e, _f, _g, _h;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */

let CreateAssignmentInput = class CreateAssignmentInput {
  title;
  description;
  lessonId;
  dueDate;
  maxScore;
};
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], CreateAssignmentInput.prototype, "title", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], CreateAssignmentInput.prototype, "description", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], CreateAssignmentInput.prototype, "lessonId", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], CreateAssignmentInput.prototype, "dueDate", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Float, {
  nullable: true
}), __metadata("design:type", Number)], CreateAssignmentInput.prototype, "maxScore", void 0);
CreateAssignmentInput = __decorate([(0, _graphql.InputType)()], CreateAssignmentInput);
let GradeSubmissionInput = class GradeSubmissionInput {
  score;
  feedback;
};
__decorate([(0, _graphql.Field)(() => _graphql.Float), __metadata("design:type", Number)], GradeSubmissionInput.prototype, "score", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], GradeSubmissionInput.prototype, "feedback", void 0);
GradeSubmissionInput = __decorate([(0, _graphql.InputType)()], GradeSubmissionInput);
let AssignmentsResolver = exports.AssignmentsResolver = class AssignmentsResolver {
  constructor(assignmentsService) {
    this.assignmentsService = assignmentsService;
  }
  async getAssignments(user, page, limit) {
    const isTeacher = ['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(user.role);
    const result = await this.assignmentsService.findAll(isTeacher ? user.id : undefined, !isTeacher ? user.id : undefined);
    const start = (page - 1) * limit;
    const paged = result.slice(start, start + limit);
    return {
      data: paged,
      meta: {
        total: result.length,
        page,
        totalPages: Math.ceil(result.length / limit),
        limit
      }
    };
  }
  async getMyAssignments(user) {
    return this.assignmentsService.getStudentAssignments(user.id);
  }
  async getAssignment(id) {
    return this.assignmentsService.findById(id);
  }
  async getSubmissions(assignmentId, user) {
    return this.assignmentsService.getSubmissions(assignmentId, user.id);
  }
  async createAssignment(input, user) {
    return this.assignmentsService.create(user.id, input);
  }
  async submitAssignment(assignmentId, content, user) {
    return this.assignmentsService.submit(assignmentId, user.id, {
      content
    });
  }
  async gradeSubmission(submissionId, input, user) {
    return this.assignmentsService.grade(submissionId, user.id, input);
  }
  async deleteAssignment(id, user) {
    await this.assignmentsService.delete(id, user.id);
    return true;
  }
};
__decorate([(0, _graphql.Query)(() => _assignment.AssignmentPage, {
  name: 'assignments',
  description: 'List assignments (teacher sees all, student sees own)'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _graphql.Args)('page', {
  type: () => _graphql.Int,
  nullable: true,
  defaultValue: 1
})), __param(2, (0, _graphql.Args)('limit', {
  type: () => _graphql.Int,
  nullable: true,
  defaultValue: 20
})), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Number, Number]), __metadata("design:returntype", typeof (_a = typeof Promise !== "undefined" && Promise) === "function" ? _a : Object)], AssignmentsResolver.prototype, "getAssignments", null);
__decorate([(0, _graphql.Query)(() => [_assignment.AssignmentGql], {
  name: 'myAssignments',
  description: 'Get assignments for the current student'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", typeof (_b = typeof Promise !== "undefined" && Promise) === "function" ? _b : Object)], AssignmentsResolver.prototype, "getMyAssignments", null);
__decorate([(0, _graphql.Query)(() => _assignment.AssignmentGql, {
  name: 'assignment',
  nullable: true,
  description: 'Get a single assignment by ID'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('id', {
  type: () => _graphql.ID
})), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)], AssignmentsResolver.prototype, "getAssignment", null);
__decorate([(0, _graphql.Query)(() => [_assignment.AssignmentSubmissionGql], {
  name: 'assignmentSubmissions',
  description: 'Get all submissions for an assignment'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('assignmentId', {
  type: () => _graphql.ID
})), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)], AssignmentsResolver.prototype, "getSubmissions", null);
__decorate([(0, _graphql.Mutation)(() => _assignment.AssignmentGql, {
  name: 'createAssignment',
  description: 'Create a new assignment (teacher)'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('input')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [CreateAssignmentInput, Object]), __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)], AssignmentsResolver.prototype, "createAssignment", null);
__decorate([(0, _graphql.Mutation)(() => _assignment.AssignmentSubmissionGql, {
  name: 'submitAssignment',
  description: 'Submit an assignment (student)'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('assignmentId', {
  type: () => _graphql.ID
})), __param(1, (0, _graphql.Args)('content', {
  nullable: true
})), __param(2, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, Object]), __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)], AssignmentsResolver.prototype, "submitAssignment", null);
__decorate([(0, _graphql.Mutation)(() => _assignment.AssignmentSubmissionGql, {
  name: 'gradeSubmission',
  description: 'Grade a student submission (teacher)'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('submissionId', {
  type: () => _graphql.ID
})), __param(1, (0, _graphql.Args)('input')), __param(2, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, GradeSubmissionInput, Object]), __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)], AssignmentsResolver.prototype, "gradeSubmission", null);
__decorate([(0, _graphql.Mutation)(() => Boolean, {
  name: 'deleteAssignment',
  description: 'Delete an assignment (teacher)'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('id', {
  type: () => _graphql.ID
})), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)], AssignmentsResolver.prototype, "deleteAssignment", null);
exports.AssignmentsResolver = AssignmentsResolver = __decorate([(0, _graphql.Resolver)(() => _assignment.AssignmentGql), __param(0, (0, _common.Inject)(_assignments.AssignmentsService)), __metadata("design:paramtypes", [Object])], AssignmentsResolver);