"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SuperAdminModule = void 0;
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _jwt = require("@nestjs/jwt");
var _database = require("../database/database.module");
var _superAdmin = require("./super-admin.controller");
var _superAdmin2 = require("./super-admin.guard");
var _superAdmin3 = require("./super-admin.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let SuperAdminModule = exports.SuperAdminModule = class SuperAdminModule {};
exports.SuperAdminModule = SuperAdminModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _jwt.JwtModule.registerAsync({
    imports: [_config.ConfigModule],
    useFactory: config => ({
      secret: config.get('JWT_SECRET'),
      signOptions: {
        expiresIn: '15m'
      }
    }),
    inject: [_config.ConfigService]
  })],
  controllers: [_superAdmin.SuperAdminController],
  providers: [_superAdmin3.SuperAdminService, _superAdmin2.SuperAdminGuard],
  exports: [_superAdmin3.SuperAdminService, _superAdmin2.SuperAdminGuard]
})], SuperAdminModule);