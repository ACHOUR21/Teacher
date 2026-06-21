"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MessagingModule = void 0;
var _common = require("@nestjs/common");
var _database = require("../database/database.module");
var _messaging = require("./messaging.service");
var _messaging2 = require("./presentation/controllers/messaging.controller");
var _messaging3 = require("./presentation/gateways/messaging.gateway");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let MessagingModule = exports.MessagingModule = class MessagingModule {};
exports.MessagingModule = MessagingModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule],
  controllers: [_messaging2.MessagingController],
  providers: [_messaging.MessagingService, _messaging3.MessagingGateway],
  exports: [_messaging.MessagingService]
})], MessagingModule);