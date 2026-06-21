"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CoursesModule = void 0;
var _common = require("@nestjs/common");
var _apiEcosystem = require("../api-ecosystem/api-ecosystem.module");
var _cache = require("../cache/cache.module");
var _database = require("../database/database.module");
var _notifications = require("../notifications/notifications.module");
var _search = require("../search/search.module");
var _storage = require("../storage/storage.module");
var _courses = require("./courses.service");
var _courses2 = require("./presentation/controllers/courses.controller");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let CoursesModule = exports.CoursesModule = class CoursesModule {};
exports.CoursesModule = CoursesModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _cache.CacheModule, _search.SearchModule, _storage.StorageModule, _apiEcosystem.ApiEcosystemModule, _notifications.NotificationsModule],
  controllers: [_courses2.CoursesController],
  providers: [_courses.CoursesService],
  exports: [_courses.CoursesService]
})], CoursesModule);