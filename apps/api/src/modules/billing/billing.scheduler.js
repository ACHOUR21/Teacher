"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BillingScheduler = void 0;
var _common = require("@nestjs/common");
var _schedule = require("@nestjs/schedule");
var _billing = require("./billing.service");
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
var BillingScheduler_1;
let BillingScheduler = exports.BillingScheduler = BillingScheduler_1 = class BillingScheduler {
  logger = new _common.Logger(BillingScheduler_1.name);
  constructor(billingService) {
    this.billingService = billingService;
  }
  async processExpiredGracePeriods() {
    this.logger.log('Running dunning grace period check...');
    const count = await this.billingService.processExpiredGracePeriods();
    if (count > 0) {
      this.logger.warn(`Suspended ${count} accounts after grace period expiry`);
    }
  }
};
__decorate([(0, _schedule.Cron)(_schedule.CronExpression.EVERY_HOUR), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", Promise)], BillingScheduler.prototype, "processExpiredGracePeriods", null);
exports.BillingScheduler = BillingScheduler = BillingScheduler_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_billing.BillingService)), __metadata("design:paramtypes", [Object])], BillingScheduler);