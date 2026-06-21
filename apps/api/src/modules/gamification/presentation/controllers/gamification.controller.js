"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GamificationController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _featureFlags = require("../../../feature-flags/feature-flags.constants");
var _featureFlag = require("../../../feature-flags/feature-flag.guard");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _gamification = require("../../gamification.service");
var _xp = require("../../xp.service");
var _streak = require("../../streak.service");
var _achievement = require("../../achievement.service");
var _leaderboard = require("../../leaderboard.service");
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
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

let GamificationController = exports.GamificationController = class GamificationController {
  constructor(gamificationService, xpService, streakService, achievementService, leaderboardService) {
    this.gamificationService = gamificationService;
    this.xpService = xpService;
    this.streakService = streakService;
    this.achievementService = achievementService;
    this.leaderboardService = leaderboardService;
  }
  // ---------------------------------------------------------------------------
  // Legacy endpoints (preserved for backwards compatibility)
  // ---------------------------------------------------------------------------
  myStats(user, req) {
    return this.gamificationService.getMyStats(user.id, req.tenant?.id);
  }
  myPoints(user) {
    return this.gamificationService.getUserPoints(user.id);
  }
  allAchievements() {
    return this.gamificationService.getAllAchievements();
  }
  myAchievements(user) {
    return this.gamificationService.getUserAchievements(user.id);
  }
  recentEvents(user, limit) {
    return this.gamificationService.getRecentEvents(user.id, limit ? parseInt(limit, 10) : 20);
  }
  recordEvent(user, body) {
    return this.gamificationService.processEvent(user.id, body.eventType, body.metadata);
  }
  // ---------------------------------------------------------------------------
  // New enhanced endpoints
  // ---------------------------------------------------------------------------
  async getMe(user, req) {
    const tenantId = req.tenant?.id ?? '';
    const [stats, streak, achievements] = await Promise.all([this.gamificationService.getMyStats(user.id, tenantId), this.streakService.getStreak(user.id), this.achievementService.getUserAchievements(user.id)]);
    const progress = this.xpService.getProgressToNextLevel(stats.totalPoints);
    return {
      totalXp: stats.totalPoints,
      weeklyXp: stats.weeklyPoints,
      level: progress.level,
      xpProgress: progress,
      streak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActivityDate: streak.lastActivityDate,
      rank: stats.rank,
      achievementsCount: achievements.length
    };
  }
  async getLeaderboard(req, period, limit) {
    const tenantId = req.tenant?.id ?? '';
    const validPeriod = ['weekly', 'monthly', 'all-time'].includes(period) ? period : 'all-time';
    return this.leaderboardService.getLeaderboard(tenantId, validPeriod, limit ? parseInt(limit, 10) : 50);
  }
  async getMyRank(user, req, period) {
    const tenantId = req.tenant?.id ?? '';
    const validPeriod = ['weekly', 'monthly', 'all-time'].includes(period) ? period : 'all-time';
    return this.leaderboardService.getUserRank(user.id, tenantId, validPeriod);
  }
  async getMyAchievements(user) {
    return this.achievementService.getUserAchievements(user.id);
  }
  async getXpHistory(user) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const events = await this.gamificationService.getRecentEvents(user.id, 500);
    const filtered = events.filter(e => new Date(e.createdAt) >= thirtyDaysAgo);
    // Aggregate by day
    const byDay = new Map();
    for (const event of filtered) {
      const day = new Date(event.createdAt).toISOString().split('T')[0];
      byDay.set(day, (byDay.get(day) ?? 0) + event.xpAwarded);
    }
    // Build a 30-day array with zeros for missing days
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        xp: byDay.get(dateStr) ?? 0
      });
    }
    return result;
  }
  async recordDailyLogin(user, req) {
    const tenantId = req.tenant?.id ?? '';
    // Award XP via the main gamification pipeline (handles dedup/daily cap)
    const eventResult = await this.gamificationService.processEvent(user.id, 'daily_login');
    // Update streak
    const streakResult = await this.streakService.recordActivity(user.id, tenantId);
    // Check streak-based achievements if streak changed
    let newAchievements = [];
    if (streakResult.isNewDay) {
      newAchievements = await this.achievementService.checkAndUnlock(user.id, tenantId, 'STREAK_MILESTONE');
    }
    return {
      xpAwarded: eventResult.xpAwarded,
      levelUp: eventResult.newLevel !== null,
      newLevel: eventResult.newLevel,
      streak: streakResult.streak,
      isNewDay: streakResult.isNewDay,
      streakBroken: streakResult.streakBroken,
      newAchievements
    };
  }
};
__decorate([(0, _common.Get)('stats'), (0, _swagger.ApiOperation)({
  summary: 'Get current user gamification stats'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], GamificationController.prototype, "myStats", null);
__decorate([(0, _common.Get)('points'), (0, _swagger.ApiOperation)({
  summary: 'Get current user points'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], GamificationController.prototype, "myPoints", null);
__decorate([(0, _common.Get)('achievements'), (0, _swagger.ApiOperation)({
  summary: 'Get all available achievements'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], GamificationController.prototype, "allAchievements", null);
__decorate([(0, _common.Get)('achievements/my'), (0, _swagger.ApiOperation)({
  summary: 'Get current user achievements'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], GamificationController.prototype, "myAchievements", null);
__decorate([(0, _common.Get)('events'), (0, _swagger.ApiOperation)({
  summary: 'Get recent XP activity feed for current user'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], GamificationController.prototype, "recentEvents", null);
__decorate([(0, _common.Post)('event'), (0, _swagger.ApiOperation)({
  summary: 'Record a gamification event (internal / debug)'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], GamificationController.prototype, "recordEvent", null);
__decorate([(0, _common.Get)('me'), (0, _swagger.ApiOperation)({
  summary: 'Get XP, level, progress to next level, streak, and achievement count'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", Promise)], GamificationController.prototype, "getMe", null);
__decorate([(0, _common.Get)('leaderboard'), (0, _swagger.ApiOperation)({
  summary: 'Get tenant leaderboard with optional period filter'
}), (0, _swagger.ApiQuery)({
  name: 'period',
  enum: ['weekly', 'monthly', 'all-time'],
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'limit',
  required: false
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Query)('period')), __param(2, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, String]), __metadata("design:returntype", Promise)], GamificationController.prototype, "getLeaderboard", null);
__decorate([(0, _common.Get)('my-rank'), (0, _swagger.ApiOperation)({
  summary: "Get current user's rank in the leaderboard"
}), (0, _swagger.ApiQuery)({
  name: 'period',
  enum: ['weekly', 'monthly', 'all-time'],
  required: false
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __param(2, (0, _common.Query)('period')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, String]), __metadata("design:returntype", Promise)], GamificationController.prototype, "getMyRank", null);
__decorate([(0, _common.Get)('my-achievements'), (0, _swagger.ApiOperation)({
  summary: "Get current user's unlocked achievements with icons and dates"
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", Promise)], GamificationController.prototype, "getMyAchievements", null);
__decorate([(0, _common.Get)('xp-history'), (0, _swagger.ApiOperation)({
  summary: 'Get last 30 days of XP earned per day (for chart)'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", Promise)], GamificationController.prototype, "getXpHistory", null);
__decorate([(0, _common.Post)('daily-login'), (0, _swagger.ApiOperation)({
  summary: 'Record daily login, award XP, and check streak'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", Promise)], GamificationController.prototype, "recordDailyLogin", null);
exports.GamificationController = GamificationController = __decorate([(0, _swagger.ApiTags)('Gamification'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _featureFlag.FeatureFlagGuard), (0, _featureFlag.RequireFeature)(_featureFlags.FEATURE_FLAGS.GAMIFICATION), (0, _common.Controller)('gamification'), __param(0, (0, _common.Inject)(_gamification.GamificationService)), __param(1, (0, _common.Inject)(_xp.XpService)), __param(2, (0, _common.Inject)(_streak.StreakService)), __param(3, (0, _common.Inject)(_achievement.AchievementService)), __param(4, (0, _common.Inject)(_leaderboard.LeaderboardService)), __metadata("design:paramtypes", [Object, Object, Object, Object, Object])], GamificationController);