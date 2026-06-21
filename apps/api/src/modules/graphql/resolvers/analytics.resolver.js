"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AnalyticsResolver = void 0;
var _common = require("@nestjs/common");
var _graphql = require("@nestjs/graphql");
var _analytics = require("../../analytics/analytics.service");
var _currentUser = require("../../core/decorators/current-user.decorator");
var _gqlAuth = require("../guards/gql-auth.guard");
var _analytics2 = require("../types/analytics.types");
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

let AnalyticsResolver = exports.AnalyticsResolver = class AnalyticsResolver {
  constructor(analyticsService) {
    this.analyticsService = analyticsService;
  }
  async getPlatformStats(user) {
    return this.analyticsService.getPlatformStats(user.tenantId);
  }
  async getUserGrowth(days, user) {
    return this.analyticsService.getUserGrowth(user.tenantId, days);
  }
  async getStudentActivity(days, user) {
    return this.analyticsService.getStudentActivity(user.tenantId, days);
  }
  async getRevenueAnalytics(months, user) {
    return this.analyticsService.getRevenueAnalytics(user.tenantId, months);
  }
  async getAIUsageStats(user) {
    const raw = await this.analyticsService.getAIUsageStats(user.tenantId);
    return raw.map(r => ({
      module: r.module,
      requestCount: r._count.id,
      totalTokens: r._sum.tokens ?? 0,
      totalCost: r._sum.cost ?? 0
    }));
  }
};
__decorate([(0, _graphql.Query)(() => _analytics2.PlatformStats, {
  name: 'platformStats',
  description: 'Platform-wide statistics'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", typeof (_a = typeof Promise !== "undefined" && Promise) === "function" ? _a : Object)], AnalyticsResolver.prototype, "getPlatformStats", null);
__decorate([(0, _graphql.Query)(() => [_analytics2.DailyGrowth], {
  name: 'userGrowth',
  description: 'Daily user registrations over N days'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('days', {
  type: () => _graphql.Int,
  nullable: true,
  defaultValue: 30
})), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Number, Object]), __metadata("design:returntype", typeof (_b = typeof Promise !== "undefined" && Promise) === "function" ? _b : Object)], AnalyticsResolver.prototype, "getUserGrowth", null);
__decorate([(0, _graphql.Query)(() => _analytics2.StudentActivity, {
  name: 'studentActivity',
  description: 'Student engagement metrics'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('days', {
  type: () => _graphql.Int,
  nullable: true,
  defaultValue: 7
})), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Number, Object]), __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)], AnalyticsResolver.prototype, "getStudentActivity", null);
__decorate([(0, _graphql.Query)(() => [_analytics2.MonthlyRevenue], {
  name: 'revenueAnalytics',
  description: 'Monthly revenue breakdown'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('months', {
  type: () => _graphql.Int,
  nullable: true,
  defaultValue: 6
})), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Number, Object]), __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)], AnalyticsResolver.prototype, "getRevenueAnalytics", null);
__decorate([(0, _graphql.Query)(() => [_analytics2.AIModuleUsage], {
  name: 'aiUsageStats',
  description: 'AI token usage by module'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)], AnalyticsResolver.prototype, "getAIUsageStats", null);
exports.AnalyticsResolver = AnalyticsResolver = __decorate([(0, _graphql.Resolver)(), __param(0, (0, _common.Inject)(_analytics.AnalyticsService)), __metadata("design:paramtypes", [Object])], AnalyticsResolver);