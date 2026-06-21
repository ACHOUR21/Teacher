"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CreateCourseInput = exports.CourseLevelInput = exports.CourseFilterInput = void 0;
var _graphql = require("@nestjs/graphql");
var _classValidator = require("class-validator");
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
var CourseLevelInput;
(function (CourseLevelInput) {
  CourseLevelInput["BEGINNER"] = "BEGINNER";
  CourseLevelInput["INTERMEDIATE"] = "INTERMEDIATE";
  CourseLevelInput["ADVANCED"] = "ADVANCED";
  CourseLevelInput["EXPERT"] = "EXPERT";
})(CourseLevelInput || (exports.CourseLevelInput = CourseLevelInput = {}));
let CreateCourseInput = exports.CreateCourseInput = class CreateCourseInput {
  title;
  description;
  category;
  level;
  price;
  thumbnailUrl;
  tags;
  language;
};
__decorate([(0, _graphql.Field)(), (0, _classValidator.IsString)(), (0, _classValidator.MaxLength)(200), __metadata("design:type", String)], CreateCourseInput.prototype, "title", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateCourseInput.prototype, "description", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateCourseInput.prototype, "category", void 0);
__decorate([(0, _graphql.Field)(() => String, {
  nullable: true
}), (0, _classValidator.IsOptional)(), __metadata("design:type", String)], CreateCourseInput.prototype, "level", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Float, {
  nullable: true
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsNumber)(), (0, _classValidator.Min)(0), __metadata("design:type", Number)], CreateCourseInput.prototype, "price", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateCourseInput.prototype, "thumbnailUrl", void 0);
__decorate([(0, _graphql.Field)(() => [String], {
  nullable: true
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsArray)(), __metadata("design:type", Array)], CreateCourseInput.prototype, "tags", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateCourseInput.prototype, "language", void 0);
exports.CreateCourseInput = CreateCourseInput = __decorate([(0, _graphql.InputType)()], CreateCourseInput);
let CourseFilterInput = exports.CourseFilterInput = class CourseFilterInput {
  search;
  category;
  level;
  page;
  limit;
};
__decorate([(0, _graphql.Field)({
  nullable: true
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CourseFilterInput.prototype, "search", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CourseFilterInput.prototype, "category", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CourseFilterInput.prototype, "level", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int, {
  nullable: true
}), (0, _classValidator.IsOptional)(), __metadata("design:type", Number)], CourseFilterInput.prototype, "page", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int, {
  nullable: true
}), (0, _classValidator.IsOptional)(), __metadata("design:type", Number)], CourseFilterInput.prototype, "limit", void 0);
exports.CourseFilterInput = CourseFilterInput = __decorate([(0, _graphql.InputType)()], CourseFilterInput);