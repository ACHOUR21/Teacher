"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HealthModule = void 0;
var _axios = require("@nestjs/axios");
var _common = require("@nestjs/common");
var _terminus = require("@nestjs/terminus");
var _cache = require("../cache/cache.module");
var _database = require("../database/database.module");
var _health = require("./health.controller");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let HealthModule = exports.HealthModule = class HealthModule {};
exports.HealthModule = HealthModule = __decorate([(0, _common.Module)({
  imports: [_terminus.TerminusModule, _axios.HttpModule, _database.DatabaseModule, _cache.CacheModule],
  controllers: [_health.HealthController]
})], HealthModule);