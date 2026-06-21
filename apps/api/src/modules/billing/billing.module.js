"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BillingModule = void 0;
var _common = require("@nestjs/common");
var _apiEcosystem = require("../api-ecosystem/api-ecosystem.module");
var _database = require("../database/database.module");
var _notifications = require("../notifications/notifications.module");
var _billing = require("./billing.scheduler");
var _billing2 = require("./billing.service");
var _coupon = require("./coupon.service");
var _invoice = require("./invoice.service");
var _tax = require("./tax.service");
var _billing3 = require("./presentation/controllers/billing.controller");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let BillingModule = exports.BillingModule = class BillingModule {};
exports.BillingModule = BillingModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _apiEcosystem.ApiEcosystemModule, _notifications.NotificationsModule],
  controllers: [_billing3.BillingController],
  providers: [_billing2.BillingService, _billing.BillingScheduler, _coupon.CouponService, _tax.TaxService, _invoice.InvoiceService],
  exports: [_billing2.BillingService, _coupon.CouponService, _tax.TaxService, _invoice.InvoiceService]
})], BillingModule);