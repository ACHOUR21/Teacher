"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UsersModule = void 0;
var _common = require("@nestjs/common");
var _users = require("./presentation/controllers/users.controller");
var _users2 = require("./users.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let UsersModule = exports.UsersModule = class UsersModule {};
exports.UsersModule = UsersModule = __decorate([(0, _common.Module)({
  controllers: [_users.UsersController],
  providers: [_users2.UsersService],
  exports: [_users2.UsersService]
})], UsersModule);