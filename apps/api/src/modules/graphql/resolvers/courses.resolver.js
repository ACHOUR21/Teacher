"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CoursesResolver = void 0;
var _common = require("@nestjs/common");
var _graphql = require("@nestjs/graphql");
var _currentUser = require("../../core/decorators/current-user.decorator");
var _courses = require("../../courses/courses.service");
var _gqlAuth = require("../guards/gql-auth.guard");
var _course = require("../inputs/course.input");
var _course2 = require("../types/course.types");
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
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */

let CoursesResolver = exports.CoursesResolver = class CoursesResolver {
  constructor(coursesService) {
    this.coursesService = coursesService;
  }
  async getCourses(filter = {}, user) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const result = await this.coursesService.findAll(user.tenantId, {
      page,
      limit,
      skip: (page - 1) * limit,
      search: filter.search,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }, {
      level: filter.level,
      category: filter.category ?? undefined
    });
    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit
      }
    };
  }
  getCourse(id, user) {
    return this.coursesService.findById(id, user.tenantId);
  }
  createCourse(input, user) {
    return this.coursesService.create(user.tenantId, user.id, input);
  }
  async publishCourse(id, user) {
    await this.coursesService.publish(id, user.tenantId);
    return true;
  }
  async deleteCourse(id, user) {
    await this.coursesService.delete(id, user.tenantId);
    return true;
  }
};
__decorate([(0, _graphql.Query)(() => _course2.CoursePage, {
  name: 'courses',
  description: 'List courses for the authenticated tenant'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('filter', {
  nullable: true
})), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_a = typeof _course.CourseFilterInput !== "undefined" && _course.CourseFilterInput) === "function" ? _a : Object, Object]), __metadata("design:returntype", typeof (_b = typeof Promise !== "undefined" && Promise) === "function" ? _b : Object)], CoursesResolver.prototype, "getCourses", null);
__decorate([(0, _graphql.Query)(() => _course2.Course, {
  name: 'course',
  description: 'Get a single course by ID'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('id', {
  type: () => _graphql.ID
})), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], CoursesResolver.prototype, "getCourse", null);
__decorate([(0, _graphql.Mutation)(() => _course2.Course, {
  name: 'createCourse',
  description: 'Create a new course'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('input')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_c = typeof _course.CreateCourseInput !== "undefined" && _course.CreateCourseInput) === "function" ? _c : Object, Object]), __metadata("design:returntype", void 0)], CoursesResolver.prototype, "createCourse", null);
__decorate([(0, _graphql.Mutation)(() => Boolean, {
  name: 'publishCourse',
  description: 'Publish a course'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('id', {
  type: () => _graphql.ID
})), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)], CoursesResolver.prototype, "publishCourse", null);
__decorate([(0, _graphql.Mutation)(() => Boolean, {
  name: 'deleteCourse',
  description: 'Delete a course'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('id', {
  type: () => _graphql.ID
})), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)], CoursesResolver.prototype, "deleteCourse", null);
exports.CoursesResolver = CoursesResolver = __decorate([(0, _graphql.Resolver)(() => _course2.Course), __param(0, (0, _common.Inject)(_courses.CoursesService)), __metadata("design:paramtypes", [Object])], CoursesResolver);