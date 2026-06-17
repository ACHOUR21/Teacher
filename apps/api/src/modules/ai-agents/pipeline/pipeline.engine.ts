/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';

import { AiService } from '../../ai/ai.service';

export interface PipelineStep {
  id: string;
  type: 'ai_completion' | 'search' | 'database_query' | 'transform' | 'condition';
  config: Record<string, unknown>;
  /** Step IDs whose output feeds into this step */
  inputFrom?: string[];
}

export interface Pipeline {
  id: string;
  name: string;
  steps: PipelineStep[];
  /** Timeout in ms, default 60000 */
  timeout?: number;
}

export interface PipelineRun {
  pipelineId: string;
  status: 'running' | 'completed' | 'failed';
  /** step ID → output */
  outputs: Record<string, unknown>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  tokensUsed: number;
  costUsd: number;
}

@Injectable()
export class PipelineEngine {
  private readonly logger = new Logger(PipelineEngine.name);

  constructor(private readonly aiService: AiService) {}

  async run(pipeline: Pipeline, input: Record<string, unknown>): Promise<PipelineRun> {
    const run: PipelineRun = {
      pipelineId: pipeline.id,
      status: 'running',
      outputs: {},
      startedAt: new Date(),
      tokensUsed: 0,
      costUsd: 0,
    };

    const timeout = pipeline.timeout ?? 60_000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Pipeline "${pipeline.name}" timed out after ${timeout}ms`)), timeout),
    );

    try {
      await Promise.race([this.executeSteps(pipeline.steps, input, run), timeoutPromise]);
      run.status = 'completed';
    } catch (err: unknown) {
      run.status = 'failed';
      run.error = err instanceof Error ? err.message : String(err);
      this.logger.error(`Pipeline "${pipeline.name}" failed: ${run.error}`);
    }

    run.completedAt = new Date();
    return run;
  }

  private async executeSteps(
    steps: PipelineStep[],
    input: Record<string, unknown>,
    run: PipelineRun,
  ): Promise<void> {
    // Build dependency graph and execute in topological order
    const stepMap = new Map(steps.map(s => [s.id, s]));
    const completed = new Set<string>();
    const executing = new Set<string>();

    const context: Record<string, unknown> = { input };

    const canRun = (step: PipelineStep): boolean => {
      if (completed.has(step.id) || executing.has(step.id)) {return false;}
      if (!step.inputFrom || step.inputFrom.length === 0) {return true;}
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

      await Promise.all(
        runnable.map(async (step) => {
          this.logger.debug(`Executing step "${step.id}" (${step.type})`);
          const stepContext = this.buildStepContext(step, context, run.outputs);
          const output = await this.executeStep(step, stepContext);
          run.outputs[step.id] = output;
          context[`steps.${step.id}`] = { output };
          executing.delete(step.id);
          completed.add(step.id);

          // Accumulate token usage from ai_completion steps
          if (step.type === 'ai_completion') {
            const tokensUsed = (output as any)?._tokensUsed ?? 0;
            run.tokensUsed += tokensUsed;
            run.costUsd += tokensUsed * 0.000003;
          }
        }),
      );

      remaining = remaining.filter(s => !completed.has(s.id));
    }
  }

  private buildStepContext(
    step: PipelineStep,
    globalContext: Record<string, unknown>,
    outputs: Record<string, unknown>,
  ): Record<string, unknown> {
    const ctx: Record<string, unknown> = { ...globalContext };

    if (step.inputFrom) {
      ctx['inputs'] = Object.fromEntries(
        step.inputFrom.map(depId => [depId, outputs[depId]]),
      );
    }

    // Interpolate template variables in config
    const interpolatedConfig = this.interpolate(step.config, globalContext, outputs);
    ctx['config'] = interpolatedConfig;

    return ctx;
  }

  private interpolate(
    value: unknown,
    context: Record<string, unknown>,
    outputs: Record<string, unknown>,
  ): unknown {
    if (typeof value === 'string') {
      return value.replace(/\{\{steps\.(\w+)\.output\}\}/g, (_match, stepId: string) => {
        const out = outputs[stepId];
        return out !== undefined ? String(out) : _match;
      }).replace(/\{\{input\.(\w+)\}\}/g, (_match, key: string) => {
        const inputObj = context['input'] as Record<string, unknown> | undefined;
        const val = inputObj?.[key];
        return val !== undefined ? String(val) : _match;
      });
    }
    if (Array.isArray(value)) {
      return value.map(v => this.interpolate(v, context, outputs));
    }
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, this.interpolate(v, context, outputs)]),
      );
    }
    return value;
  }

  private async executeStep(step: PipelineStep, context: Record<string, unknown>): Promise<unknown> {
    switch (step.type) {
      case 'ai_completion':
        return this.executeAiCompletion(step.config as Record<string, unknown>, context);
      case 'transform':
        return this.executeTransform(step.config as Record<string, unknown>, context);
      case 'condition':
        return this.evaluateCondition(step.config as Record<string, unknown>, context);
      case 'search':
        return this.executeSearch(step.config as Record<string, unknown>, context);
      case 'database_query':
        return this.executeDatabaseQuery(step.config as Record<string, unknown>, context);
      default:
        throw new Error(`Unknown step type: ${(step as any).type}`);
    }
  }

  private async executeAiCompletion(
    config: Record<string, unknown>,
    context: Record<string, unknown>,
  ): Promise<unknown> {
    const interpolatedConfig = this.interpolate(config, context, (context['outputs'] as Record<string, unknown>) ?? {}) as Record<string, unknown>;

    const prompt = interpolatedConfig['prompt'] as string ?? (config['prompt'] as string);
    const system = interpolatedConfig['system'] as string | undefined ?? (config['system'] as string | undefined);
    const responseFormat = config['responseFormat'] as string | undefined;

    // Use AiService to do a generic completion via its Anthropic client
    // We call a method that allows arbitrary prompts; we adapt to the service interface
    // by using the researchAssist endpoint with a dummy userId/tenantId from context
    const userId = (context['userId'] as string) ?? 'pipeline-engine';
    const tenantId = (context['tenantId'] as string) ?? 'pipeline-engine';

    // Build the actual prompt with system and user parts
    const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;

    const result = await this.aiService.researchAssist(userId, tenantId, fullPrompt, 'detailed');

    let output: unknown = result.result;

    if (responseFormat === 'json') {
      try {
        // Extract JSON from the response if wrapped in markdown
        const jsonMatch = result.result.match(/```json\s*([\s\S]*?)\s*```/) ??
          result.result.match(/```\s*([\s\S]*?)\s*```/);
        output = JSON.parse(jsonMatch ? jsonMatch[1] : result.result);
      } catch {
        output = result.result;
      }
    }

    // Attach token metadata for tracking
    return Object.assign(
      typeof output === 'object' && output !== null ? output : { text: output },
      { _tokensUsed: result.tokens },
    );
  }

  private executeTransform(
    config: Record<string, unknown>,
    context: Record<string, unknown>,
  ): unknown {
    const operation = config['operation'] as string;
    const sourceStepId = config['sourceStep'] as string | undefined;
    const inputs = context['inputs'] as Record<string, unknown> | undefined;

    const data = sourceStepId
      ? inputs?.[sourceStepId]
      : (Object.values(inputs ?? {})[0]);

    switch (operation) {
      case 'json_parse': {
        try {
          return typeof data === 'string' ? JSON.parse(data) : data;
        } catch {
          return data;
        }
      }
      case 'extract_field': {
        const field = config['field'] as string;
        return (data as Record<string, unknown>)?.[field];
      }
      case 'merge': {
        const all = Object.values(inputs ?? {});
        return Object.assign({}, ...all);
      }
      case 'array_from_text': {
        const text = typeof data === 'string' ? data : JSON.stringify(data);
        return text.split('\n').map((l: string) => l.trim()).filter(Boolean);
      }
      case 'assemble': {
        // Merge all inputs into a single assembled object
        const template = config['template'] as Record<string, string> | undefined;
        if (template) {
          return Object.fromEntries(
            Object.entries(template).map(([key, stepId]) => [key, inputs?.[stepId]]),
          );
        }
        return Object.assign({}, ...(Object.values(inputs ?? {})));
      }
      default:
        return data;
    }
  }

  private evaluateCondition(
    config: Record<string, unknown>,
    context: Record<string, unknown>,
  ): boolean {
    const inputs = context['inputs'] as Record<string, unknown> | undefined;
    const field = config['field'] as string;
    const operator = config['operator'] as string;
    const value = config['value'];

    const sourceStepId = config['sourceStep'] as string | undefined;
    const data = sourceStepId
      ? inputs?.[sourceStepId]
      : Object.values(inputs ?? {})[0];

    const actual = field.split('.').reduce((obj: unknown, key) => (obj as Record<string, unknown>)?.[key], data);

    switch (operator) {
      case 'eq': return actual === value;
      case 'neq': return actual !== value;
      case 'gt': return (actual as number) > (value as number);
      case 'gte': return (actual as number) >= (value as number);
      case 'lt': return (actual as number) < (value as number);
      case 'lte': return (actual as number) <= (value as number);
      case 'contains': return String(actual).includes(String(value));
      case 'exists': return actual !== undefined && actual !== null;
      default: return Boolean(actual);
    }
  }

  private executeSearch(
    config: Record<string, unknown>,
    context: Record<string, unknown>,
  ): unknown {
    // Simulated search — returns placeholder results with key concepts
    const query = config['query'] as string ?? '';
    const inputs = context['inputs'] as Record<string, unknown> | undefined;
    const inputData = Object.values(inputs ?? {})[0];
    const searchQueries = Array.isArray(inputData)
      ? (inputData as string[]).slice(0, 5)
      : [query];

    return {
      queries: searchQueries,
      results: searchQueries.map((q: string, i: number) => ({
        query: q,
        source: `Source ${i + 1}`,
        snippet: `Key concepts related to "${q}": This is a simulated search result containing relevant educational content and academic references.`,
        relevanceScore: 0.9 - i * 0.1,
      })),
      keyConcepts: searchQueries.map((q: string) => q.split(' ').slice(0, 3).join(' ')),
    };
  }

  private executeDatabaseQuery(
    _config: Record<string, unknown>,
    context: Record<string, unknown>,
  ): unknown {
    // Returns placeholder student data; real implementation would query Prisma
    const userId = (context['userId'] as string) ?? 'unknown';
    return {
      userId,
      enrolledCourses: [],
      courseProgress: [],
      recentScores: [],
      weakTopics: [],
    };
  }
}
