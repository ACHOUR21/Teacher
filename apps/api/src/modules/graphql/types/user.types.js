"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UserProfile = exports.UserPage = exports.User = void 0;
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
let UserProfile = exports.UserProfile = class UserProfile {
  bio;
  timezone;
  language;
};
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], UserProfile.prototype, "bio", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], UserProfile.prototype, "timezone", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], UserProfile.prototype, "language", void 0);
exports.UserProfile = UserProfile = __decorate([(0, _graphql.ObjectType)()], UserProfile);
let User = exports.User = class User {
  id;
  email;
  firstName;
  lastName;
  role;
  isActive;
  avatarUrl;
  phone;
  emailVerified;
  mfaEnabled;
  lastLoginAt;
  createdAt;
  profile;
};
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], User.prototype, "id", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], User.prototype, "email", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], User.prototype, "firstName", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], User.prototype, "lastName", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], User.prototype, "role", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", Boolean)], User.prototype, "isActive", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], User.prototype, "avatarUrl", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], User.prototype, "phone", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", Boolean)], User.prototype, "emailVerified", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", Boolean)], User.prototype, "mfaEnabled", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)], User.prototype, "lastLoginAt", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)], User.prototype, "createdAt", void 0);
__decorate([(0, _graphql.Field)(() => UserProfile, {
  nullable: true
}), __metadata("design:type", UserProfile)], User.prototype, "profile", void 0);
exports.User = User = __decorate([(0, _graphql.ObjectType)()], User);
let UserPage = exports.UserPage = class UserPage {
  data;
  meta;
};
__decorate([(0, _graphql.Field)(() => [User]), __metadata("design:type", Array)], UserPage.prototype, "data", void 0);
__decorate([(0, _graphql.Field)(() => _common.PaginationMeta), __metadata("design:type", typeof (_c = typeof _common.PaginationMeta !== "undefined" && _common.PaginationMeta) === "function" ? _c : Object)], UserPage.prototype, "meta", void 0);
exports.UserPage = UserPage = __decorate([(0, _graphql.ObjectType)()], UserPage);