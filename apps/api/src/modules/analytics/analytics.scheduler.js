"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AnalyticsScheduler = void 0;
var _bull = require("@nestjs/bull");
var _common = require("@nestjs/common");
var _schedule = require("@nestjs/schedule");
var _bull2 = require("bull");
var _prisma = require("../database/prisma.service");
var _queue = require("../queue/queue.module");
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
var AnalyticsScheduler_1;
let AnalyticsScheduler = exports.AnalyticsScheduler = AnalyticsScheduler_1 = class AnalyticsScheduler {
  logger = new _common.Logger(AnalyticsScheduler_1.name);
  constructor(analyticsQueue, prisma) {
    this.analyticsQueue = analyticsQueue;
    this.prisma = prisma;
  }
  async aggregateAllTenants() {
    const tenants = await this.prisma.tenant.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true
      }
    });
    this.logger.log(`Scheduling analytics aggregation for ${tenants.length} tenants`);
    for (const tenant of tenants) {
      await this.analyticsQueue.add('aggregate-platform-stats', {
        tenantId: tenant.id
      }, {
        priority: 10
      });
    }
  }
  async aggregateDailyStats() {
    const tenants = await this.prisma.tenant.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true
      }
    });
    for (const tenant of tenants) {
      await Promise.all([this.analyticsQueue.add('aggregate-user-growth', {
        tenantId: tenant.id,
        days: 30
      }), this.analyticsQueue.add('aggregate-course-stats', {
        tenantId: tenant.id
      })]);
    }
    this.logger.log('Daily analytics aggregation scheduled');
  }
};
__decorate([(0, _schedule.Cron)(_schedule.CronExpression.EVERY_HOUR), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", Promise)], AnalyticsScheduler.prototype, "aggregateAllTenants", null);
__decorate([(0, _schedule.Cron)(_schedule.CronExpression.EVERY_DAY_AT_MIDNIGHT), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", Promise)], AnalyticsScheduler.prototype, "aggregateDailyStats", null);
exports.AnalyticsScheduler = AnalyticsScheduler = AnalyticsScheduler_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _bull.InjectQueue)(_queue.QUEUE_ANALYTICS)), __param(1, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object, Object])], AnalyticsScheduler);