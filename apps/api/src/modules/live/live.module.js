"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LiveModule = void 0;
var _common = require("@nestjs/common");
var _jwt = require("@nestjs/jwt");
var _config = require("@nestjs/config");
var _cache = require("../cache/cache.module");
var _database = require("../database/database.module");
var _notifications = require("../notifications/notifications.module");
var _jitsi = require("./jitsi.service");
var _live = require("./live.service");
var _live2 = require("./presentation/controllers/live.controller");
var _live3 = require("./presentation/gateways/live.gateway");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let LiveModule = exports.LiveModule = class LiveModule {};
exports.LiveModule = LiveModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _cache.CacheModule, _notifications.NotificationsModule, _jwt.JwtModule.registerAsync({
    imports: [_config.ConfigModule],
    inject: [_config.ConfigService],
    useFactory: config => ({
      secret: config.get('JWT_SECRET', 'changeme')
    })
  })],
  controllers: [_live2.LiveController],
  providers: [_live.LiveService, _live3.LiveGateway, _jitsi.JitsiService],
  exports: [_live.LiveService]
})], LiveModule);