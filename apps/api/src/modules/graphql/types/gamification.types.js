"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UserPoints = exports.LeaderboardEntry = exports.GamificationProfile = exports.Achievement = void 0;
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
var _a;
let UserPoints = exports.UserPoints = class UserPoints {
  total;
  level;
};
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], UserPoints.prototype, "total", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], UserPoints.prototype, "level", void 0);
exports.UserPoints = UserPoints = __decorate([(0, _graphql.ObjectType)()], UserPoints);
let Achievement = exports.Achievement = class Achievement {
  id;
  name;
  description;
  icon;
  points;
  unlockedAt;
};
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], Achievement.prototype, "id", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], Achievement.prototype, "name", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], Achievement.prototype, "description", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], Achievement.prototype, "icon", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], Achievement.prototype, "points", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)], Achievement.prototype, "unlockedAt", void 0);
exports.Achievement = Achievement = __decorate([(0, _graphql.ObjectType)()], Achievement);
let LeaderboardEntry = exports.LeaderboardEntry = class LeaderboardEntry {
  rank;
  userId;
  firstName;
  lastName;
  avatarUrl;
  points;
  level;
};
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], LeaderboardEntry.prototype, "rank", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], LeaderboardEntry.prototype, "userId", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], LeaderboardEntry.prototype, "firstName", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], LeaderboardEntry.prototype, "lastName", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], LeaderboardEntry.prototype, "avatarUrl", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], LeaderboardEntry.prototype, "points", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.Int), __metadata("design:type", Number)], LeaderboardEntry.prototype, "level", void 0);
exports.LeaderboardEntry = LeaderboardEntry = __decorate([(0, _graphql.ObjectType)()], LeaderboardEntry);
let GamificationProfile = exports.GamificationProfile = class GamificationProfile {
  points;
  achievements;
};
__decorate([(0, _graphql.Field)(() => UserPoints, {
  nullable: true
}), __metadata("design:type", UserPoints)], GamificationProfile.prototype, "points", void 0);
__decorate([(0, _graphql.Field)(() => [Achievement]), __metadata("design:type", Array)], GamificationProfile.prototype, "achievements", void 0);
exports.GamificationProfile = GamificationProfile = __decorate([(0, _graphql.ObjectType)()], GamificationProfile);