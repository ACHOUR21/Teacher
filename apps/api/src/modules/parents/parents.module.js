"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParentsModule = void 0;
var _common = require("@nestjs/common");
var _database = require("../database/database.module");
var _notifications = require("../notifications/notifications.module");
var _parentPortal = require("./parent-portal.controller");
var _parentPortal2 = require("./parent-portal.service");
var _parents = require("./presentation/controllers/parents.controller");
var _parents2 = require("./parents.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let ParentsModule = exports.ParentsModule = class ParentsModule {};
exports.ParentsModule = ParentsModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _notifications.NotificationsModule],
  controllers: [_parents.ParentsController, _parentPortal.ParentPortalController],
  providers: [_parents2.ParentsService, _parentPortal2.ParentPortalService],
  exports: [_parents2.ParentsService, _parentPortal2.ParentPortalService]
})], ParentsModule);