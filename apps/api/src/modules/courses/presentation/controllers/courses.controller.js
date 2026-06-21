"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CoursesController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _classValidator = require("class-validator");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _roles = require("../../../core/decorators/roles.decorator");
var _tenant = require("../../../core/decorators/tenant.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _roles2 = require("../../../core/guards/roles.guard");
var _pagination = require("../../../core/pagination/pagination.dto");
var _courses = require("../../courses.service");
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
class AddReviewDto {
  rating;
  comment;
}
__decorate([(0, _swagger.ApiProperty)({
  minimum: 1,
  maximum: 5
}), (0, _classValidator.IsInt)(), (0, _classValidator.Min)(1), (0, _classValidator.Max)(5), __metadata("design:type", Number)], AddReviewDto.prototype, "rating", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], AddReviewDto.prototype, "comment", void 0);
class EnrollDto {
  studentId;
}
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], EnrollDto.prototype, "studentId", void 0);
let CoursesController = exports.CoursesController = class CoursesController {
  constructor(coursesService) {
    this.coursesService = coursesService;
  }
  findAll(tenantId, pagination, category, level, teacherId, published) {
    return this.coursesService.findAll(tenantId, pagination, {
      category,
      level,
      teacherId,
      published: published !== undefined ? published === 'true' : undefined
    });
  }
  search(tenantId, query) {
    return this.coursesService.search(tenantId, query);
  }
  findById(id, tenantId) {
    return this.coursesService.findById(id, tenantId);
  }
  create(tenantId, user, dto) {
    return this.coursesService.create(tenantId, user.id, dto);
  }
  update(id, tenantId, user, dto) {
    return this.coursesService.update(id, tenantId, dto, user.id);
  }
  publish(id, tenantId) {
    return this.coursesService.publish(id, tenantId);
  }
  unpublish(id, tenantId) {
    return this.coursesService.unpublish(id, tenantId);
  }
  delete(id, tenantId) {
    return this.coursesService.delete(id, tenantId);
  }
  createSection(courseId, tenantId, dto) {
    return this.coursesService.createSection(courseId, tenantId, dto);
  }
  updateSection(sectionId, tenantId, dto) {
    return this.coursesService.updateSection(sectionId, tenantId, dto);
  }
  deleteSection(sectionId, tenantId) {
    return this.coursesService.deleteSection(sectionId, tenantId);
  }
  createLesson(sectionId, tenantId, dto) {
    return this.coursesService.createLesson(sectionId, tenantId, dto);
  }
  updateLesson(lessonId, tenantId, dto) {
    return this.coursesService.updateLesson(lessonId, tenantId, dto);
  }
  deleteLesson(lessonId, tenantId) {
    return this.coursesService.deleteLesson(lessonId, tenantId);
  }
  enroll(courseId, tenantId, dto) {
    return this.coursesService.enrollStudent(courseId, dto.studentId, tenantId);
  }
  updateProgress(courseId, lessonId, tenantId, user) {
    return this.coursesService.updateProgress(courseId, user.id, lessonId, tenantId);
  }
  addReview(courseId, user, dto) {
    return this.coursesService.addReview(courseId, user.id, dto.rating, dto.comment);
  }
};
__decorate([(0, _common.Get)(), (0, _swagger.ApiOperation)({
  summary: 'List all courses in tenant'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Query)()), __param(2, (0, _common.Query)('category')), __param(3, (0, _common.Query)('level')), __param(4, (0, _common.Query)('teacherId')), __param(5, (0, _common.Query)('published')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_a = typeof _pagination.PaginationDto !== "undefined" && _pagination.PaginationDto) === "function" ? _a : Object, String, typeof (_b = typeof _client.CourseLevel !== "undefined" && _client.CourseLevel) === "function" ? _b : Object, String, String]), __metadata("design:returntype", void 0)], CoursesController.prototype, "findAll", null);
__decorate([(0, _common.Get)('search'), (0, _swagger.ApiOperation)({
  summary: 'Full-text search courses via Elasticsearch'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Query)('q')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], CoursesController.prototype, "search", null);
__decorate([(0, _common.Get)(':id'), (0, _swagger.ApiOperation)({
  summary: 'Get course by ID with sections and lessons'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], CoursesController.prototype, "findById", null);
__decorate([(0, _common.Post)(), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Create a new course'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_c = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _c : Object, typeof (_d = typeof _courses.CreateCourseDto !== "undefined" && _courses.CreateCourseDto) === "function" ? _d : Object]), __metadata("design:returntype", void 0)], CoursesController.prototype, "create", null);
__decorate([(0, _common.Put)(':id'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Update course details'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _tenant.TenantId)()), __param(2, (0, _currentUser.CurrentUser)()), __param(3, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, typeof (_e = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _e : Object, typeof (_f = typeof _courses.UpdateCourseDto !== "undefined" && _courses.UpdateCourseDto) === "function" ? _f : Object]), __metadata("design:returntype", void 0)], CoursesController.prototype, "update", null);
__decorate([(0, _common.Post)(':id/publish'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Publish a course'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], CoursesController.prototype, "publish", null);
__decorate([(0, _common.Post)(':id/unpublish'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Unpublish a course'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], CoursesController.prototype, "unpublish", null);
__decorate([(0, _common.Delete)(':id'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Delete a course'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], CoursesController.prototype, "delete", null);
__decorate([(0, _common.Post)(':id/sections'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Add section to course'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _tenant.TenantId)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, typeof (_g = typeof _courses.CreateSectionDto !== "undefined" && _courses.CreateSectionDto) === "function" ? _g : Object]), __metadata("design:returntype", void 0)], CoursesController.prototype, "createSection", null);
__decorate([(0, _common.Patch)('sections/:sectionId'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Update a section'
}), __param(0, (0, _common.Param)('sectionId')), __param(1, (0, _tenant.TenantId)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, Object]), __metadata("design:returntype", void 0)], CoursesController.prototype, "updateSection", null);
__decorate([(0, _common.Delete)('sections/:sectionId'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Delete a section and its lessons'
}), __param(0, (0, _common.Param)('sectionId')), __param(1, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], CoursesController.prototype, "deleteSection", null);
__decorate([(0, _common.Post)('sections/:sectionId/lessons'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Add lesson to section'
}), __param(0, (0, _common.Param)('sectionId')), __param(1, (0, _tenant.TenantId)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, typeof (_h = typeof _courses.CreateLessonDto !== "undefined" && _courses.CreateLessonDto) === "function" ? _h : Object]), __metadata("design:returntype", void 0)], CoursesController.prototype, "createLesson", null);
__decorate([(0, _common.Patch)('sections/:sectionId/lessons/:lessonId'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Update a lesson'
}), __param(0, (0, _common.Param)('lessonId')), __param(1, (0, _tenant.TenantId)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, Object]), __metadata("design:returntype", void 0)], CoursesController.prototype, "updateLesson", null);
__decorate([(0, _common.Delete)('sections/:sectionId/lessons/:lessonId'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Delete a lesson'
}), __param(0, (0, _common.Param)('lessonId')), __param(1, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], CoursesController.prototype, "deleteLesson", null);
__decorate([(0, _common.Post)(':id/enroll'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Enroll a student in a course'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _tenant.TenantId)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, EnrollDto]), __metadata("design:returntype", void 0)], CoursesController.prototype, "enroll", null);
__decorate([(0, _common.Put)(':id/progress/:lessonId'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Update lesson completion progress'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Param)('lessonId')), __param(2, (0, _tenant.TenantId)()), __param(3, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, String, typeof (_j = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _j : Object]), __metadata("design:returntype", void 0)], CoursesController.prototype, "updateProgress", null);
__decorate([(0, _common.Post)(':id/reviews'), (0, _swagger.ApiOperation)({
  summary: 'Add a review for a course'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_k = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _k : Object, AddReviewDto]), __metadata("design:returntype", void 0)], CoursesController.prototype, "addReview", null);
exports.CoursesController = CoursesController = __decorate([(0, _swagger.ApiTags)('Courses'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _common.Controller)('courses'), __param(0, (0, _common.Inject)(_courses.CoursesService)), __metadata("design:paramtypes", [Object])], CoursesController);