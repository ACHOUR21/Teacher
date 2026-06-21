"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UserBrief = exports.PaginationMeta = void 0;
var _graphql = require("@nestjs/graphql");
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
let PaginationMeta = exports.PaginationMeta = class PaginationMeta {
  total;
  page;
  totalPages;
  limit;
};
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], PaginationMeta.prototype, "total", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], PaginationMeta.prototype, "page", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], PaginationMeta.prototype, "totalPages", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], PaginationMeta.prototype, "limit", void 0);
exports.PaginationMeta = PaginationMeta = __decorate([(0, _graphql.ObjectType)()], PaginationMeta);
let UserBrief = exports.UserBrief = class UserBrief {
  id;
  email;
  firstName;
  lastName;
  avatarUrl;
  role;
  isActive;
};
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], UserBrief.prototype, "id", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], UserBrief.prototype, "email", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], UserBrief.prototype, "firstName", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], UserBrief.prototype, "lastName", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], UserBrief.prototype, "avatarUrl", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], UserBrief.prototype, "role", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", Boolean)], UserBrief.prototype, "isActive", void 0);
exports.UserBrief = UserBrief = __decorate([(0, _graphql.ObjectType)()], UserBrief);