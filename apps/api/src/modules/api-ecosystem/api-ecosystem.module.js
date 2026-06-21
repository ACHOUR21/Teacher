"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ApiEcosystemModule = void 0;
var _common = require("@nestjs/common");
var _cache = require("../cache/cache.module");
var _database = require("../database/database.module");
var _apiEcosystem = require("./api-ecosystem.service");
var _apiKeys = require("./api-keys.guard");
var _apiKeys2 = require("./api-keys.service");
var _apiEcosystem2 = require("./presentation/controllers/api-ecosystem.controller");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let ApiEcosystemModule = exports.ApiEcosystemModule = class ApiEcosystemModule {};
exports.ApiEcosystemModule = ApiEcosystemModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _cache.CacheModule],
  controllers: [_apiEcosystem2.ApiEcosystemController],
  providers: [_apiEcosystem.ApiEcosystemService, _apiKeys2.ApiKeysService, _apiKeys.ApiKeyGuard],
  exports: [_apiEcosystem.ApiEcosystemService, _apiKeys2.ApiKeysService, _apiKeys.ApiKeyGuard]
})], ApiEcosystemModule);