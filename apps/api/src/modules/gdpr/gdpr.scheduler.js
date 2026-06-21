"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GdprScheduler = void 0;
var _common = require("@nestjs/common");
var _schedule = require("@nestjs/schedule");
var _gdpr = require("./gdpr.service");
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
var GdprScheduler_1;
let GdprScheduler = exports.GdprScheduler = GdprScheduler_1 = class GdprScheduler {
  logger = new _common.Logger(GdprScheduler_1.name);
  constructor(gdpr) {
    this.gdpr = gdpr;
  }
  async processScheduledDeletions() {
    this.logger.log('Running scheduled GDPR deletion pass');
    const count = await this.gdpr.processScheduledDeletions();
    this.logger.log(`GDPR deletion pass complete: ${count} user(s) anonymized`);
  }
};
__decorate([(0, _schedule.Cron)(_schedule.CronExpression.EVERY_DAY_AT_2AM), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", Promise)], GdprScheduler.prototype, "processScheduledDeletions", null);
exports.GdprScheduler = GdprScheduler = GdprScheduler_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_gdpr.GdprService)), __metadata("design:paramtypes", [Object])], GdprScheduler);