"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PipelineEngine = void 0;
var _common = require("@nestjs/common");
var _ai = require("../../ai/ai.service");
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
var PipelineEngine_1;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */

let PipelineEngine = exports.PipelineEngine = PipelineEngine_1 = class PipelineEngine {
  logger = new _common.Logger(PipelineEngine_1.name);
  constructor(aiService) {
    this.aiService = aiService;
  }
  async run(pipeline, input) {
    const run = {
      pipelineId: pipeline.id,
      status: 'running',
      outputs: {},
      startedAt: new Date(),
      tokensUsed: 0,
      costUsd: 0
    };
    const timeout = pipeline.timeout ?? 60_000;
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`Pipeline "${pipeline.name}" timed out after ${timeout}ms`)), timeout));
    try {
      await Promise.race([this.executeSteps(pipeline.steps, input, run), timeoutPromise]);
      run.status = 'completed';
    } catch (err) {
      run.status = 'failed';
      run.error = err instanceof Error ? err.message : String(err);
      this.logger.error(`Pipeline "${pipeline.name}" failed: ${run.error}`);
    }
    run.completedAt = new Date();
    return run;
  }
  async executeSteps(steps, input, run) {
    // Build dependency graph and execute in topological order
    const stepMap = new Map(steps.map(s => [s.id, s]));
    const completed = new Set();
    const executing = new Set();
    const context = {
      input
    };
    const canRun = step => {
      if (completed.has(step.id) || executing.has(step.id)) {
        return false;
      }
      if (!step.inputFrom || step.inputFrom.length === 0) {
        return true;
      }
      return step.inputFrom.every(dep => completed.has(dep));
    };
    let remaining = [...steps];
    while (remaining.length > 0) {
      const runnable = remaining.filter(s => canRun(s));
      if (runnable.length === 0) {
        const blocked = remaining.map(s => s.id).join(', ');
        throw new Error(`Pipeline deadlock: steps [${blocked}] cannot run — possible circular dependency`);
      }
      // Run all runnable steps in parallel
      runnable.forEach(s => executing.add(s.id));
      await Promise.all(runnable.map(async step => {
        this.logger.debug(`Executing step "${step.id}" (${step.type})`);
        const stepContext = this.buildStepContext(step, context, run.outputs);
        const output = await this.executeStep(step, stepContext);
        run.outputs[step.id] = output;
        context[`steps.${step.id}`] = {
          output
        };
        executing.delete(step.id);
        completed.add(step.id);
        // Accumulate token usage from ai_completion steps
        if (step.type === 'ai_completion') {
          const tokensUsed = output?._tokensUsed ?? 0;
          run.tokensUsed += tokensUsed;
          run.costUsd += tokensUsed * 0.000003;
        }
      }));
      remaining = remaining.filter(s => !completed.has(s.id));
    }
  }
  buildStepContext(step, globalContext, outputs) {
    const ctx = {
      ...globalContext
    };
    if (step.inputFrom) {
      ctx['inputs'] = Object.fromEntries(step.inputFrom.map(depId => [depId, outputs[depId]]));
    }
    // Interpolate template variables in config
    const interpolatedConfig = this.interpolate(step.config, globalContext, outputs);
    ctx['config'] = interpolatedConfig;
    return ctx;
  }
  interpolate(value, context, outputs) {
    if (typeof value === 'string') {
      return value.replace(/\{\{steps\.(\w+)\.output\}\}/g, (_match, stepId) => {
        const out = outputs[stepId];
        return out !== undefined ? String(out) : _match;
      }).replace(/\{\{input\.(\w+)\}\}/g, (_match, key) => {
        const inputObj = context['input'];
        const val = inputObj?.[key];
        return val !== undefined ? String(val) : _match;
      });
    }
    if (Array.isArray(value)) {
      return value.map(v => this.interpolate(v, context, outputs));
    }
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, this.interpolate(v, context, outputs)]));
    }
    return value;
  }
  async executeStep(step, context) {
    switch (step.type) {
      case 'ai_completion':
        return this.executeAiCompletion(step.config, context);
      case 'transform':
        return this.executeTransform(step.config, context);
      case 'condition':
        return this.evaluateCondition(step.config, context);
      case 'search':
        return this.executeSearch(step.config, context);
      case 'database_query':
        return this.executeDatabaseQuery(step.config, context);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }
  async executeAiCompletion(config, context) {
    const interpolatedConfig = this.interpolate(config, context, context['outputs'] ?? {});
    const prompt = interpolatedConfig['prompt'] ?? config['prompt'];
    const system = interpolatedConfig['system'] ?? config['system'];
    const responseFormat = config['responseFormat'];
    // Use AiService to do a generic completion via its Anthropic client
    // We call a method that allows arbitrary prompts; we adapt to the service interface
    // by using the researchAssist endpoint with a dummy userId/tenantId from context
    const userId = context['userId'] ?? 'pipeline-engine';
    const tenantId = context['tenantId'] ?? 'pipeline-engine';
    // Build the actual prompt with system and user parts
    const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;
    const result = await this.aiService.researchAssist(userId, tenantId, fullPrompt, 'detailed');
    let output = result.result;
    if (responseFormat === 'json') {
      try {
        // Extract JSON from the response if wrapped in markdown
        const jsonMatch = result.result.match(/```json\s*([\s\S]*?)\s*```/) ?? result.result.match(/```\s*([\s\S]*?)\s*```/);
        output = JSON.parse(jsonMatch ? jsonMatch[1] : result.result);
      } catch {
        output = result.result;
      }
    }
    // Attach token metadata for tracking
    return Object.assign(typeof output === 'object' && output !== null ? output : {
      text: output
    }, {
      _tokensUsed: result.tokens
    });
  }
  executeTransform(config, context) {
    const operation = config['operation'];
    const sourceStepId = config['sourceStep'];
    const inputs = context['inputs'];
    const data = sourceStepId ? inputs?.[sourceStepId] : Object.values(inputs ?? {})[0];
    switch (operation) {
      case 'json_parse':
        {
          try {
            return typeof data === 'string' ? JSON.parse(data) : data;
          } catch {
            return data;
          }
        }
      case 'extract_field':
        {
          const field = config['field'];
          return data?.[field];
        }
      case 'merge':
        {
          const all = Object.values(inputs ?? {});
          return Object.assign({}, ...all);
        }
      case 'array_from_text':
        {
          const text = typeof data === 'string' ? data : JSON.stringify(data);
          return text.split('\n').map(l => l.trim()).filter(Boolean);
        }
      case 'assemble':
        {
          // Merge all inputs into a single assembled object
          const template = config['template'];
          if (template) {
            return Object.fromEntries(Object.entries(template).map(([key, stepId]) => [key, inputs?.[stepId]]));
          }
          return Object.assign({}, ...Object.values(inputs ?? {}));
        }
      default:
        return data;
    }
  }
  evaluateCondition(config, context) {
    const inputs = context['inputs'];
    const field = config['field'];
    const operator = config['operator'];
    const value = config['value'];
    const sourceStepId = config['sourceStep'];
    const data = sourceStepId ? inputs?.[sourceStepId] : Object.values(inputs ?? {})[0];
    const actual = field.split('.').reduce((obj, key) => obj?.[key], data);
    switch (operator) {
      case 'eq':
        return actual === value;
      case 'neq':
        return actual !== value;
      case 'gt':
        return actual > value;
      case 'gte':
        return actual >= value;
      case 'lt':
        return actual < value;
      case 'lte':
        return actual <= value;
      case 'contains':
        return String(actual).includes(String(value));
      case 'exists':
        return actual !== undefined && actual !== null;
      default:
        return Boolean(actual);
    }
  }
  executeSearch(config, context) {
    // Simulated search — returns placeholder results with key concepts
    const query = config['query'] ?? '';
    const inputs = context['inputs'];
    const inputData = Object.values(inputs ?? {})[0];
    const searchQueries = Array.isArray(inputData) ? inputData.slice(0, 5) : [query];
    return {
      queries: searchQueries,
      results: searchQueries.map((q, i) => ({
        query: q,
        source: `Source ${i + 1}`,
        snippet: `Key concepts related to "${q}": This is a simulated search result containing relevant educational content and academic references.`,
        relevanceScore: 0.9 - i * 0.1
      })),
      keyConcepts: searchQueries.map(q => q.split(' ').slice(0, 3).join(' '))
    };
  }
  executeDatabaseQuery(_config, context) {
    // Returns placeholder student data; real implementation would query Prisma
    const userId = context['userId'] ?? 'unknown';
    return {
      userId,
      enrolledCourses: [],
      courseProgress: [],
      recentScores: [],
      weakTopics: []
    };
  }
};
exports.PipelineEngine = PipelineEngine = PipelineEngine_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_ai.AiService)), __metadata("design:paramtypes", [Object])], PipelineEngine);