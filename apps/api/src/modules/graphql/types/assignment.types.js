"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AssignmentSubmissionGql = exports.AssignmentPage = exports.AssignmentGql = void 0;
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
var _a, _b, _c, _d;
let AssignmentGql = exports.AssignmentGql = class AssignmentGql {
  id;
  title;
  description;
  dueDate;
  maxScore;
  status;
  createdAt;
  lessonId;
  teacherId;
};
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], AssignmentGql.prototype, "id", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], AssignmentGql.prototype, "title", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], AssignmentGql.prototype, "description", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)], AssignmentGql.prototype, "dueDate", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Float, {
  nullable: true
}), __metadata("design:type", Number)], AssignmentGql.prototype, "maxScore", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], AssignmentGql.prototype, "status", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)], AssignmentGql.prototype, "createdAt", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], AssignmentGql.prototype, "lessonId", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], AssignmentGql.prototype, "teacherId", void 0);
exports.AssignmentGql = AssignmentGql = __decorate([(0, _graphql.ObjectType)()], AssignmentGql);
let AssignmentPage = exports.AssignmentPage = class AssignmentPage {
  data;
  meta;
};
__decorate([(0, _graphql.Field)(() => [AssignmentGql]), __metadata("design:type", Array)], AssignmentPage.prototype, "data", void 0);
__decorate([(0, _graphql.Field)(() => _common.PaginationMeta), __metadata("design:type", typeof (_c = typeof _common.PaginationMeta !== "undefined" && _common.PaginationMeta) === "function" ? _c : Object)], AssignmentPage.prototype, "meta", void 0);
exports.AssignmentPage = AssignmentPage = __decorate([(0, _graphql.ObjectType)()], AssignmentPage);
let AssignmentSubmissionGql = exports.AssignmentSubmissionGql = class AssignmentSubmissionGql {
  id;
  assignmentId;
  studentId;
  status;
  content;
  score;
  feedback;
  createdAt;
};
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], AssignmentSubmissionGql.prototype, "id", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], AssignmentSubmissionGql.prototype, "assignmentId", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], AssignmentSubmissionGql.prototype, "studentId", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], AssignmentSubmissionGql.prototype, "status", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], AssignmentSubmissionGql.prototype, "content", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Float, {
  nullable: true
}), __metadata("design:type", Number)], AssignmentSubmissionGql.prototype, "score", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], AssignmentSubmissionGql.prototype, "feedback", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", typeof (_d = typeof Date !== "undefined" && Date) === "function" ? _d : Object)], AssignmentSubmissionGql.prototype, "createdAt", void 0);
exports.AssignmentSubmissionGql = AssignmentSubmissionGql = __decorate([(0, _graphql.ObjectType)()], AssignmentSubmissionGql);