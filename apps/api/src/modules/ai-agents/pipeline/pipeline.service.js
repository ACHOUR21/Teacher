"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PipelineService = void 0;
var _common = require("@nestjs/common");
var _prisma = require("../../database/prisma.service");
var _lessonGenerator = require("../pipelines/lesson-generator.pipeline");
var _researchAssistant = require("../pipelines/research-assistant.pipeline");
var _studyPlan = require("../pipelines/study-plan.pipeline");
var _pipeline = require("./pipeline.engine");
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
var PipelineService_1;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

const BUILT_IN_PIPELINES = [_studyPlan.STUDY_PLAN_PIPELINE, _lessonGenerator.LESSON_GENERATOR_PIPELINE, _researchAssistant.RESEARCH_ASSISTANT_PIPELINE];
const PIPELINE_METADATA = {
  'study-plan': {
    description: 'Generates a personalized weekly study schedule based on your enrolled courses and performance',
    expectedOutputs: ['weeklyStudySchedule', 'flashcardSuggestions', 'weakAreasAnalysis'],
    estimatedSeconds: 45
  },
  'lesson-generator': {
    description: 'Creates a complete lesson from any topic including content, quiz questions, and key takeaways',
    expectedOutputs: ['lessonOutline', 'sectionContent', 'quizQuestions', 'summary'],
    estimatedSeconds: 60
  },
  'research-assistant': {
    description: 'Researches a topic and generates a structured summary, flashcards, and mind map',
    expectedOutputs: ['researchSummary', 'flashcards', 'mindMap'],
    estimatedSeconds: 60
  }
};
let PipelineService = exports.PipelineService = PipelineService_1 = class PipelineService {
  logger = new _common.Logger(PipelineService_1.name);
  constructor(engine, prisma) {
    this.engine = engine;
    this.prisma = prisma;
  }
  listPipelines() {
    return BUILT_IN_PIPELINES.map(p => ({
      id: p.id,
      name: p.name,
      description: PIPELINE_METADATA[p.id]?.description ?? '',
      expectedOutputs: PIPELINE_METADATA[p.id]?.expectedOutputs ?? [],
      estimatedSeconds: PIPELINE_METADATA[p.id]?.estimatedSeconds ?? 30,
      stepCount: p.steps.length
    }));
  }
  getPipeline(id) {
    const pipeline = BUILT_IN_PIPELINES.find(p => p.id === id);
    if (!pipeline) {
      throw new _common.NotFoundException(`Pipeline "${id}" not found`);
    }
    return pipeline;
  }
  async runPipeline(pipelineId, input, userId, tenantId) {
    const pipeline = this.getPipeline(pipelineId);
    // Create run record
    const runRecord = await this.prisma.agentRun.create({
      data: {
        tenantId,
        userId,
        pipelineId,
        status: 'running',
        input: input,
        outputs: {}
      }
    });
    // Execute pipeline (fire and update record)
    const enrichedInput = {
      ...input,
      userId,
      tenantId
    };
    let result;
    try {
      result = await this.engine.run(pipeline, enrichedInput);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await this.prisma.agentRun.update({
        where: {
          id: runRecord.id
        },
        data: {
          status: 'failed',
          error: errorMsg,
          completedAt: new Date()
        }
      });
      return {
        ...runRecord,
        status: 'failed',
        error: errorMsg,
        completedAt: new Date(),
        input: input,
        outputs: {}
      };
    }
    const updated = await this.prisma.agentRun.update({
      where: {
        id: runRecord.id
      },
      data: {
        status: result.status,
        outputs: result.outputs,
        error: result.error ?? null,
        tokensUsed: result.tokensUsed,
        costUsd: result.costUsd,
        completedAt: result.completedAt
      }
    });
    return updated;
  }
  async getRunById(runId, userId) {
    const run = await this.prisma.agentRun.findFirst({
      where: {
        id: runId,
        userId
      }
    });
    if (!run) {
      throw new _common.NotFoundException(`Agent run "${runId}" not found`);
    }
    return run;
  }
  async listRuns(userId, tenantId, limit = 20) {
    const runs = await this.prisma.agentRun.findMany({
      where: {
        userId,
        tenantId
      },
      orderBy: {
        startedAt: 'desc'
      },
      take: limit,
      select: {
        id: true,
        pipelineId: true,
        status: true,
        tokensUsed: true,
        costUsd: true,
        startedAt: true,
        completedAt: true,
        error: true,
        input: true,
        outputs: true,
        tenantId: true,
        userId: true
      }
    });
    return runs;
  }
  async runStudyPlan(userId, tenantId, subjects) {
    return this.runPipeline('study-plan', {
      subjects: subjects?.join(', ') ?? 'general',
      userId,
      tenantId
    }, userId, tenantId);
  }
  async runLessonGenerator(userId, tenantId, topic, gradeLevel = 'General', duration = 60) {
    return this.runPipeline('lesson-generator', {
      topic,
      gradeLevel,
      duration,
      userId,
      tenantId
    }, userId, tenantId);
  }
  async runResearchAssistant(userId, tenantId, topic, depth = 'detailed') {
    return this.runPipeline('research-assistant', {
      topic,
      depth,
      userId,
      tenantId
    }, userId, tenantId);
  }
  async *streamPipelineRun(pipelineId, input, userId, tenantId) {
    const pipeline = this.getPipeline(pipelineId);
    // Create run record
    const runRecord = await this.prisma.agentRun.create({
      data: {
        tenantId,
        userId,
        pipelineId,
        status: 'running',
        input: input,
        outputs: {}
      }
    });
    yield {
      step: '__run_created',
      status: 'started',
      output: {
        runId: runRecord.id
      }
    };
    const enrichedInput = {
      ...input,
      userId,
      tenantId
    };
    const outputs = {};
    // Yield step names in order so UI can show progress
    for (const step of pipeline.steps) {
      yield {
        step: step.id,
        status: 'started'
      };
    }
    // Actually run pipeline
    const result = await this.engine.run(pipeline, enrichedInput);
    // Emit completed steps
    for (const [stepId, output] of Object.entries(result.outputs)) {
      outputs[stepId] = output;
      yield {
        step: stepId,
        status: 'completed',
        output
      };
    }
    if (result.error) {
      yield {
        step: '__pipeline',
        status: 'failed',
        error: result.error
      };
    } else {
      yield {
        step: '__pipeline',
        status: 'completed',
        output: {
          runId: runRecord.id,
          tokensUsed: result.tokensUsed,
          costUsd: result.costUsd
        }
      };
    }
    await this.prisma.agentRun.update({
      where: {
        id: runRecord.id
      },
      data: {
        status: result.status,
        outputs: result.outputs,
        error: result.error ?? null,
        tokensUsed: result.tokensUsed,
        costUsd: result.costUsd,
        completedAt: result.completedAt
      }
    });
  }
};
exports.PipelineService = PipelineService = PipelineService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_pipeline.PipelineEngine)), __param(1, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object, Object])], PipelineService);