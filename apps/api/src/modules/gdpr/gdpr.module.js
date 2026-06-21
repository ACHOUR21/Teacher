"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GdprModule = void 0;
var _common = require("@nestjs/common");
var _database = require("../database/database.module");
var _gdpr = require("./gdpr.controller");
var _gdpr2 = require("./gdpr.scheduler");
var _gdpr3 = require("./gdpr.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let GdprModule = exports.GdprModule = class GdprModule {};
exports.GdprModule = GdprModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule],
  controllers: [_gdpr.GdprController],
  providers: [_gdpr3.GdprService, _gdpr2.GdprScheduler],
  exports: [_gdpr3.GdprService]
})], GdprModule);