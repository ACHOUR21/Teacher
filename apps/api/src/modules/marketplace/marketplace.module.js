"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MarketplaceModule = void 0;
var _common = require("@nestjs/common");
var _billing = require("../billing/billing.module");
var _database = require("../database/database.module");
var _notifications = require("../notifications/notifications.module");
var _search = require("../search/search.module");
var _marketplace = require("./marketplace.service");
var _marketplace2 = require("./presentation/controllers/marketplace.controller");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let MarketplaceModule = exports.MarketplaceModule = class MarketplaceModule {};
exports.MarketplaceModule = MarketplaceModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _search.SearchModule, _billing.BillingModule, _notifications.NotificationsModule],
  controllers: [_marketplace2.MarketplaceController],
  providers: [_marketplace.MarketplaceService],
  exports: [_marketplace.MarketplaceService]
})], MarketplaceModule);