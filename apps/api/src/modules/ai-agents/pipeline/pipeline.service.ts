/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { LESSON_GENERATOR_PIPELINE } from '../pipelines/lesson-generator.pipeline';
import { RESEARCH_ASSISTANT_PIPELINE } from '../pipelines/research-assistant.pipeline';
import { STUDY_PLAN_PIPELINE } from '../pipelines/study-plan.pipeline';

import { Pipeline, PipelineEngine, PipelineRun } from './pipeline.engine';

export interface AgentRunRecord {
  id: string;
  tenantId: string;
  userId: string;
  pipelineId: string;
  status: string;
  input: Record<string, unknown>;
  outputs: Record<string, unknown>;
  error?: string | null;
  tokensUsed: number;
  costUsd: number;
  startedAt: Date;
  completedAt?: Date | null;
}

const BUILT_IN_PIPELINES: Pipeline[] = [
  STUDY_PLAN_PIPELINE,
  LESSON_GENERATOR_PIPELINE,
  RESEARCH_ASSISTANT_PIPELINE,
];

const PIPELINE_METADATA: Record<string, { description: string; expectedOutputs: string[]; estimatedSeconds: number }> = {
  'study-plan': {
    description: 'Generates a personalized weekly study schedule based on your enrolled courses and performance',
    expectedOutputs: ['weeklyStudySchedule', 'flashcardSuggestions', 'weakAreasAnalysis'],
    estimatedSeconds: 45,
  },
  'lesson-generator': {
    description: 'Creates a complete lesson from any topic including content, quiz questions, and key takeaways',
    expectedOutputs: ['lessonOutline', 'sectionContent', 'quizQuestions', 'summary'],
    estimatedSeconds: 60,
  },
  'research-assistant': {
    description: 'Researches a topic and generates a structured summary, flashcards, and mind map',
    expectedOutputs: ['researchSummary', 'flashcards', 'mindMap'],
    estimatedSeconds: 60,
  },
};

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(
    private readonly engine: PipelineEngine,
    private readonly prisma: PrismaService,
  ) {}

  listPipelines() {
    return BUILT_IN_PIPELINES.map(p => ({
      id: p.id,
      name: p.name,
      description: PIPELINE_METADATA[p.id]?.description ?? '',
      expectedOutputs: PIPELINE_METADATA[p.id]?.expectedOutputs ?? [],
      estimatedSeconds: PIPELINE_METADATA[p.id]?.estimatedSeconds ?? 30,
      stepCount: p.steps.length,
    }));
  }

  getPipeline(id: string): Pipeline {
    const pipeline = BUILT_IN_PIPELINES.find(p => p.id === id);
    if (!pipeline) {
      throw new NotFoundException(`Pipeline "${id}" not found`);
    }
    return pipeline;
  }

  async runPipeline(
    pipelineId: string,
    input: Record<string, unknown>,
    userId: string,
    tenantId: string,
  ): Promise<AgentRunRecord> {
    const pipeline = this.getPipeline(pipelineId);

    // Create run record
    const runRecord = await this.prisma.agentRun.create({
      data: {
        tenantId,
        userId,
        pipelineId,
        status: 'running',
        input: input as import("@prisma/client").Prisma.InputJsonValue,
        outputs: {},
      },
    });

    // Execute pipeline (fire and update record)
    const enrichedInput = { ...input, userId, tenantId };
    let result: PipelineRun;

    try {
      result = await this.engine.run(pipeline, enrichedInput);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await this.prisma.agentRun.update({
        where: { id: runRecord.id },
        data: {
          status: 'failed',
          error: errorMsg,
          completedAt: new Date(),
        },
      });
      return {
        ...runRecord,
        status: 'failed',
        error: errorMsg,
        completedAt: new Date(),
        input: input as any,
        outputs: {},
      };
    }

    const updated = await this.prisma.agentRun.update({
      where: { id: runRecord.id },
      data: {
        status: result.status,
        outputs: result.outputs as any,
        error: result.error ?? null,
        tokensUsed: result.tokensUsed,
        costUsd: result.costUsd,
        completedAt: result.completedAt,
      },
    });

    return updated as unknown as AgentRunRecord;
  }

  async getRunById(runId: string, userId: string): Promise<AgentRunRecord> {
    const run = await this.prisma.agentRun.findFirst({
      where: { id: runId, userId },
    });
    if (!run) {
      throw new NotFoundException(`Agent run "${runId}" not found`);
    }
    return run as unknown as AgentRunRecord;
  }

  async listRuns(userId: string, tenantId: string, limit = 20): Promise<AgentRunRecord[]> {
    const runs = await this.prisma.agentRun.findMany({
      where: { userId, tenantId },
      orderBy: { startedAt: 'desc' },
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
        userId: true,
      },
    });
    return runs as unknown as AgentRunRecord[];
  }

  async runStudyPlan(userId: string, tenantId: string, subjects?: string[]): Promise<AgentRunRecord> {
    return this.runPipeline('study-plan', { subjects: subjects?.join(', ') ?? 'general', userId, tenantId }, userId, tenantId);
  }

  async runLessonGenerator(
    userId: string,
    tenantId: string,
    topic: string,
    gradeLevel = 'General',
    duration = 60,
  ): Promise<AgentRunRecord> {
    return this.runPipeline(
      'lesson-generator',
      { topic, gradeLevel, duration, userId, tenantId },
      userId,
      tenantId,
    );
  }

  async runResearchAssistant(
    userId: string,
    tenantId: string,
    topic: string,
    depth: 'brief' | 'detailed' | 'comprehensive' = 'detailed',
  ): Promise<AgentRunRecord> {
    return this.runPipeline('research-assistant', { topic, depth, userId, tenantId }, userId, tenantId);
  }

  async *streamPipelineRun(
    pipelineId: string,
    input: Record<string, unknown>,
    userId: string,
    tenantId: string,
  ): AsyncGenerator<{ step: string; status: 'started' | 'completed' | 'failed'; output?: unknown; error?: string }> {
    const pipeline = this.getPipeline(pipelineId);

    // Create run record
    const runRecord = await this.prisma.agentRun.create({
      data: {
        tenantId,
        userId,
        pipelineId,
        status: 'running',
        input: input as import("@prisma/client").Prisma.InputJsonValue,
        outputs: {},
      },
    });

    yield { step: '__run_created', status: 'started', output: { runId: runRecord.id } };

    const enrichedInput = { ...input, userId, tenantId };
    const outputs: Record<string, unknown> = {};

    // Yield step names in order so UI can show progress
    for (const step of pipeline.steps) {
      yield { step: step.id, status: 'started' };
    }

    // Actually run pipeline
    const result = await this.engine.run(pipeline, enrichedInput);

    // Emit completed steps
    for (const [stepId, output] of Object.entries(result.outputs)) {
      outputs[stepId] = output;
      yield { step: stepId, status: 'completed', output };
    }

    if (result.error) {
      yield { step: '__pipeline', status: 'failed', error: result.error };
    } else {
      yield { step: '__pipeline', status: 'completed', output: { runId: runRecord.id, tokensUsed: result.tokensUsed, costUsd: result.costUsd } };
    }

    await this.prisma.agentRun.update({
      where: { id: runRecord.id },
      data: {
        status: result.status,
        outputs: result.outputs as any,
        error: result.error ?? null,
        tokensUsed: result.tokensUsed,
        costUsd: result.costUsd,
        completedAt: result.completedAt,
      },
    });
  }
}
