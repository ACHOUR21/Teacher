"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AiAgentsModule = void 0;
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _ai = require("../ai/ai.module");
var _database = require("../database/database.module");
var _aiAgents = require("./ai-agents.service");
var _pipeline = require("./pipeline/pipeline.engine");
var _pipeline2 = require("./pipeline/pipeline.service");
var _aiAgents2 = require("./presentation/controllers/ai-agents.controller");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let AiAgentsModule = exports.AiAgentsModule = class AiAgentsModule {};
exports.AiAgentsModule = AiAgentsModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _ai.AiModule, _config.ConfigModule],
  controllers: [_aiAgents2.AiAgentsController],
  providers: [_aiAgents.AiAgentsService, _pipeline.PipelineEngine, _pipeline2.PipelineService],
  exports: [_aiAgents.AiAgentsService, _pipeline2.PipelineService]
})], AiAgentsModule);