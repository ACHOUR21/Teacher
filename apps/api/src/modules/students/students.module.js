"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StudentsModule = void 0;
var _common = require("@nestjs/common");
var _database = require("../database/database.module");
var _gamification = require("../gamification/gamification.module");
var _notifications = require("../notifications/notifications.module");
var _students = require("./presentation/controllers/students.controller");
var _students2 = require("./students.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let StudentsModule = exports.StudentsModule = class StudentsModule {};
exports.StudentsModule = StudentsModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _gamification.GamificationModule, _notifications.NotificationsModule],
  controllers: [_students.StudentsController],
  providers: [_students2.StudentsService],
  exports: [_students2.StudentsService]
})], StudentsModule);