"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AiAgentsController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _rxjs = require("rxjs");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _tenant = require("../../../core/guards/tenant.guard");
var _aiAgents = require("../../ai-agents.service");
var _pipeline = require("../../pipeline/pipeline.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = void 0 && (void 0).__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = void 0 && (void 0).__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
var _a, _b, _c;
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

let AiAgentsController = exports.AiAgentsController = class AiAgentsController {
  constructor(aiAgentsService, pipelineService) {
    this.aiAgentsService = aiAgentsService;
    this.pipelineService = pipelineService;
  }
  // ─── Legacy Agent Endpoints ──────────────────────────────────────────────────
  getAgents() {
    return this.aiAgentsService.getAvailableAgents();
  }
  getSessions(req, agentType) {
    return this.aiAgentsService.getAgentSessions(req.tenantId, req.user.id, agentType);
  }
  chat(req, body) {
    return this.aiAgentsService.chat({
      tenantId: req.tenantId,
      userId: req.user.id,
      agentType: body.agentType,
      message: body.message,
      sessionId: body.sessionId
    });
  }
  async streamChat(req, res, body) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    const write = event => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };
    try {
      const gen = this.aiAgentsService.streamChat({
        tenantId: req.tenantId,
        userId: req.user.id,
        agentType: body.agentType,
        message: body.message,
        sessionId: body.sessionId
      });
      for await (const event of gen) {
        if (res.writableEnded) {
          break;
        }
        write(event);
      }
    } catch (err) {
      if (!res.writableEnded) {
        write({
          type: 'error',
          message: err?.message ?? 'Unknown error'
        });
      }
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }
  }
  // ─── Pipeline Endpoints ──────────────────────────────────────────────────────
  listPipelines() {
    return this.pipelineService.listPipelines();
  }
  async runPipeline(req, id, input) {
    return this.pipelineService.runPipeline(id, input, req.user.id, req.tenantId);
  }
  runPipelineStream(req, id, input) {
    const subject = new _rxjs.Subject();
    const run = async () => {
      try {
        const gen = this.pipelineService.streamPipelineRun(id, input, req.user.id, req.tenantId);
        for await (const event of gen) {
          subject.next({
            data: JSON.stringify(event)
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        subject.next({
          data: JSON.stringify({
            step: '__error',
            status: 'failed',
            error: message
          })
        });
      } finally {
        subject.complete();
      }
    };
    void run();
    return subject.asObservable();
  }
  listRuns(req, limit) {
    return this.pipelineService.listRuns(req.user.id, req.tenantId, limit ? +limit : 20);
  }
  getRun(req, id) {
    return this.pipelineService.getRunById(id, req.user.id);
  }
  // ─── Shortcut Endpoints ──────────────────────────────────────────────────────
  runStudyPlan(req, body) {
    return this.pipelineService.runStudyPlan(req.user.id, req.tenantId, body.subjects);
  }
  generateLesson(req, body) {
    return this.pipelineService.runLessonGenerator(req.user.id, req.tenantId, body.topic, body.gradeLevel, body.duration);
  }
  runResearch(req, body) {
    return this.pipelineService.runResearchAssistant(req.user.id, req.tenantId, body.topic, body.depth);
  }
};
__decorate([(0, _common.Get)(), (0, _swagger.ApiOperation)({
  summary: 'List available AI agents'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], AiAgentsController.prototype, "getAgents", null);
__decorate([(0, _common.Get)('sessions'), (0, _swagger.ApiOperation)({
  summary: 'Get user agent sessions'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Query)('agentType')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], AiAgentsController.prototype, "getSessions", null);
__decorate([(0, _common.Post)('chat'), (0, _swagger.ApiOperation)({
  summary: 'Chat with an AI agent (single-turn, non-streaming)'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], AiAgentsController.prototype, "chat", null);
__decorate([(0, _common.Post)('stream'), (0, _swagger.ApiOperation)({
  summary: 'Stream an agent response with real-time tool-call events (SSE)'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Res)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, Object]), __metadata("design:returntype", Promise)], AiAgentsController.prototype, "streamChat", null);
__decorate([(0, _common.Get)('pipelines'), (0, _swagger.ApiOperation)({
  summary: 'List available multi-step agent pipelines'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], AiAgentsController.prototype, "listPipelines", null);
__decorate([(0, _common.Post)('pipelines/:id/run'), (0, _swagger.ApiOperation)({
  summary: 'Run a pipeline with input data'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('id')), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, typeof (_a = typeof Record !== "undefined" && Record) === "function" ? _a : Object]), __metadata("design:returntype", Promise)], AiAgentsController.prototype, "runPipeline", null);
__decorate([(0, _common.Sse)('pipelines/:id/run/stream'), (0, _swagger.ApiOperation)({
  summary: 'Run a pipeline with SSE streaming — emits step completion events'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('id')), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, typeof (_b = typeof Record !== "undefined" && Record) === "function" ? _b : Object]), __metadata("design:returntype", typeof (_c = typeof _rxjs.Observable !== "undefined" && _rxjs.Observable) === "function" ? _c : Object)], AiAgentsController.prototype, "runPipelineStream", null);
__decorate([(0, _common.Get)('runs'), (0, _swagger.ApiOperation)({
  summary: 'List recent pipeline runs for current user'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], AiAgentsController.prototype, "listRuns", null);
__decorate([(0, _common.Get)('runs/:id'), (0, _swagger.ApiOperation)({
  summary: 'Get pipeline run status and results'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], AiAgentsController.prototype, "getRun", null);
__decorate([(0, _common.Post)('study-plan'), (0, _swagger.ApiOperation)({
  summary: 'Generate a personalized study plan for the current user'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], AiAgentsController.prototype, "runStudyPlan", null);
__decorate([(0, _common.Post)('generate-lesson'), (0, _swagger.ApiOperation)({
  summary: 'Generate a complete lesson from a topic'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], AiAgentsController.prototype, "generateLesson", null);
__decorate([(0, _common.Post)('research'), (0, _swagger.ApiOperation)({
  summary: 'Research a topic and generate study materials (summary, flashcards, mind map)'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], AiAgentsController.prototype, "runResearch", null);
exports.AiAgentsController = AiAgentsController = __decorate([(0, _swagger.ApiTags)('ai-agents'), (0, _swagger.ApiBearerAuth)(), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _tenant.TenantGuard), (0, _common.Controller)('ai/agents'), __param(0, (0, _common.Inject)(_aiAgents.AiAgentsService)), __param(1, (0, _common.Inject)(_pipeline.PipelineService)), __metadata("design:paramtypes", [Object, Object])], AiAgentsController);