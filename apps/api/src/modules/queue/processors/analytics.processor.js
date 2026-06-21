"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AnalyticsProcessor = void 0;
var _bull = require("@nestjs/bull");
var _common = require("@nestjs/common");
var _bull2 = require("bull");
var _analytics = require("../../analytics/analytics.service");
var _queue = require("../queue.module");
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
var AnalyticsProcessor_1;
var _a, _b, _c;
let AnalyticsProcessor = exports.AnalyticsProcessor = AnalyticsProcessor_1 = class AnalyticsProcessor {
  logger = new _common.Logger(AnalyticsProcessor_1.name);
  constructor(analyticsService) {
    this.analyticsService = analyticsService;
  }
  async handlePlatformStats(job) {
    const {
      tenantId
    } = job.data;
    this.logger.log(`Aggregating platform stats for tenant ${tenantId}`);
    return this.analyticsService.getPlatformStats(tenantId);
  }
  async handleUserGrowth(job) {
    const {
      tenantId,
      days
    } = job.data;
    this.logger.log(`Aggregating user growth for tenant ${tenantId} (${days ?? 30} days)`);
    return this.analyticsService.getUserGrowth(tenantId, days);
  }
  async handleCourseStats(job) {
    const {
      tenantId
    } = job.data;
    this.logger.log(`Aggregating course stats for tenant ${tenantId}`);
    return this.analyticsService.getCourseStats(tenantId);
  }
};
__decorate([(0, _bull.Process)('aggregate-platform-stats'), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_a = typeof _bull2.Job !== "undefined" && _bull2.Job) === "function" ? _a : Object]), __metadata("design:returntype", Promise)], AnalyticsProcessor.prototype, "handlePlatformStats", null);
__decorate([(0, _bull.Process)('aggregate-user-growth'), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_b = typeof _bull2.Job !== "undefined" && _bull2.Job) === "function" ? _b : Object]), __metadata("design:returntype", Promise)], AnalyticsProcessor.prototype, "handleUserGrowth", null);
__decorate([(0, _bull.Process)('aggregate-course-stats'), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_c = typeof _bull2.Job !== "undefined" && _bull2.Job) === "function" ? _c : Object]), __metadata("design:returntype", Promise)], AnalyticsProcessor.prototype, "handleCourseStats", null);
exports.AnalyticsProcessor = AnalyticsProcessor = AnalyticsProcessor_1 = __decorate([(0, _bull.Processor)(_queue.QUEUE_ANALYTICS), __param(0, (0, _common.Inject)(_analytics.AnalyticsService)), __metadata("design:paramtypes", [Object])], AnalyticsProcessor);