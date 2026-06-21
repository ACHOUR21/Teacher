"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AiModule = void 0;
var _common = require("@nestjs/common");
var _cache = require("../cache/cache.module");
var _database = require("../database/database.module");
var _aiProcessing = require("../queue/processors/ai-processing.processor");
var _ai = require("./ai.service");
var _ai2 = require("./presentation/controllers/ai.controller");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let AiModule = exports.AiModule = class AiModule {};
exports.AiModule = AiModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _cache.CacheModule],
  controllers: [_ai2.AiController],
  providers: [_ai.AiService, _aiProcessing.AiProcessingProcessor],
  exports: [_ai.AiService]
})], AiModule);