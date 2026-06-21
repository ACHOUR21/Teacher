"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AssignmentsModule = void 0;
var _common = require("@nestjs/common");
var _apiEcosystem = require("../api-ecosystem/api-ecosystem.module");
var _database = require("../database/database.module");
var _notifications = require("../notifications/notifications.module");
var _assignments = require("./assignments.controller");
var _assignments2 = require("./assignments.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let AssignmentsModule = exports.AssignmentsModule = class AssignmentsModule {};
exports.AssignmentsModule = AssignmentsModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _notifications.NotificationsModule, _apiEcosystem.ApiEcosystemModule],
  controllers: [_assignments.AssignmentsController],
  providers: [_assignments2.AssignmentsService],
  exports: [_assignments2.AssignmentsService]
})], AssignmentsModule);