"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AnalyticsModule = void 0;
var _common = require("@nestjs/common");
var _cache = require("../cache/cache.module");
var _database = require("../database/database.module");
var _analytics = require("../queue/processors/analytics.processor");
var _queue = require("../queue/queue.module");
var _analytics2 = require("./analytics.scheduler");
var _analytics3 = require("./analytics.service");
var _analytics4 = require("./presentation/controllers/analytics.controller");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let AnalyticsModule = exports.AnalyticsModule = class AnalyticsModule {};
exports.AnalyticsModule = AnalyticsModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _cache.CacheModule, _queue.QueueModule],
  controllers: [_analytics4.AnalyticsController],
  providers: [_analytics3.AnalyticsService, _analytics.AnalyticsProcessor, _analytics2.AnalyticsScheduler],
  exports: [_analytics3.AnalyticsService]
})], AnalyticsModule);