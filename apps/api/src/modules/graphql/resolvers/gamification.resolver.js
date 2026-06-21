"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GamificationResolver = void 0;
var _common = require("@nestjs/common");
var _graphql = require("@nestjs/graphql");
var _currentUser = require("../../core/decorators/current-user.decorator");
var _gamification = require("../../gamification/gamification.service");
var _gqlAuth = require("../guards/gql-auth.guard");
var _gamification2 = require("../types/gamification.types");
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
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */

let GamificationResolver = exports.GamificationResolver = class GamificationResolver {
  constructor(gamificationService) {
    this.gamificationService = gamificationService;
  }
  async getProfile(user) {
    const [pointsRecord, rawAchievements] = await Promise.all([this.gamificationService.getUserPoints(user.id), this.gamificationService.getUserAchievements(user.id)]);
    return {
      points: pointsRecord ? {
        total: pointsRecord.total,
        level: Math.floor(pointsRecord.total / 100)
      } : null,
      achievements: rawAchievements.map(ua => ({
        id: ua.achievement.id,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        points: ua.achievement.points,
        unlockedAt: ua.earnedAt
      }))
    };
  }
  async getLeaderboard(user, limit) {
    const entries = await this.gamificationService.getLeaderboard(user.tenantId, limit);
    return entries.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user.id,
      firstName: entry.user.firstName,
      lastName: entry.user.lastName,
      avatarUrl: entry.user.avatarUrl,
      points: entry.total,
      level: Math.floor(entry.total / 100)
    }));
  }
};
__decorate([(0, _graphql.Query)(() => _gamification2.GamificationProfile, {
  name: 'myGamificationProfile'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", Promise)], GamificationResolver.prototype, "getProfile", null);
__decorate([(0, _graphql.Query)(() => [_gamification2.LeaderboardEntry], {
  name: 'leaderboard'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _graphql.Args)('limit', {
  type: () => _graphql.Int,
  nullable: true,
  defaultValue: 20
})), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Number]), __metadata("design:returntype", Promise)], GamificationResolver.prototype, "getLeaderboard", null);
exports.GamificationResolver = GamificationResolver = __decorate([(0, _graphql.Resolver)(), __param(0, (0, _common.Inject)(_gamification.GamificationService)), __metadata("design:paramtypes", [Object])], GamificationResolver);