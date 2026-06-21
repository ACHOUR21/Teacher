"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TeachersModule = void 0;
var _common = require("@nestjs/common");
var _cache = require("../cache/cache.module");
var _database = require("../database/database.module");
var _notifications = require("../notifications/notifications.module");
var _teachers = require("./presentation/controllers/teachers.controller");
var _teachers2 = require("./teachers.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let TeachersModule = exports.TeachersModule = class TeachersModule {};
exports.TeachersModule = TeachersModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _cache.CacheModule, _notifications.NotificationsModule],
  controllers: [_teachers.TeachersController],
  providers: [_teachers2.TeachersService],
  exports: [_teachers2.TeachersService]
})], TeachersModule);