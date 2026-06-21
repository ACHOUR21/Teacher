"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CourseSection = exports.CoursePage = exports.Course = void 0;
var _graphql = require("@nestjs/graphql");
var _common = require("./common.types");
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
var _a, _b, _c;
let CourseSection = exports.CourseSection = class CourseSection {
  id;
  title;
  order;
};
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], CourseSection.prototype, "id", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], CourseSection.prototype, "title", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], CourseSection.prototype, "order", void 0);
exports.CourseSection = CourseSection = __decorate([(0, _graphql.ObjectType)()], CourseSection);
let Course = exports.Course = class Course {
  id;
  title;
  slug;
  description;
  thumbnailUrl;
  category;
  level;
  price;
  rating;
  enrollCount;
  totalLessons;
  durationMinutes;
  isPublished;
  language;
  tags;
  createdAt;
  teacher;
};
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], Course.prototype, "id", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], Course.prototype, "title", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], Course.prototype, "slug", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], Course.prototype, "description", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], Course.prototype, "thumbnailUrl", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], Course.prototype, "category", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], Course.prototype, "level", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Float), __metadata("design:type", Number)], Course.prototype, "price", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Float, {
  nullable: true
}), __metadata("design:type", Number)], Course.prototype, "rating", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], Course.prototype, "enrollCount", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], Course.prototype, "totalLessons", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], Course.prototype, "durationMinutes", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", Boolean)], Course.prototype, "isPublished", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], Course.prototype, "language", void 0);
__decorate([(0, _graphql.Field)(() => [String]), __metadata("design:type", Array)], Course.prototype, "tags", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)], Course.prototype, "createdAt", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", typeof (_b = typeof _common.UserBrief !== "undefined" && _common.UserBrief) === "function" ? _b : Object)], Course.prototype, "teacher", void 0);
exports.Course = Course = __decorate([(0, _graphql.ObjectType)()], Course);
let CoursePage = exports.CoursePage = class CoursePage {
  data;
  meta;
};
__decorate([(0, _graphql.Field)(() => [Course]), __metadata("design:type", Array)], CoursePage.prototype, "data", void 0);
__decorate([(0, _graphql.Field)(() => _common.PaginationMeta), __metadata("design:type", typeof (_c = typeof _common.PaginationMeta !== "undefined" && _common.PaginationMeta) === "function" ? _c : Object)], CoursePage.prototype, "meta", void 0);
exports.CoursePage = CoursePage = __decorate([(0, _graphql.ObjectType)()], CoursePage);