"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WhiteLabelModule = void 0;
var _common = require("@nestjs/common");
var _cache = require("../cache/cache.module");
var _database = require("../database/database.module");
var _whiteLabel = require("./presentation/controllers/white-label.controller");
var _whiteLabel2 = require("./white-label.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let WhiteLabelModule = exports.WhiteLabelModule = class WhiteLabelModule {};
exports.WhiteLabelModule = WhiteLabelModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _cache.CacheModule],
  controllers: [_whiteLabel.WhiteLabelController],
  providers: [_whiteLabel2.WhiteLabelService],
  exports: [_whiteLabel2.WhiteLabelService]
})], WhiteLabelModule);