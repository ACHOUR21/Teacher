/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  Controller, Get, Post, Body, Query, Param, UseGuards, Req, Res, Sse,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Observable, Subject } from 'rxjs';

import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { TenantGuard } from '../../../core/guards/tenant.guard';
import { AiAgentsService } from '../../ai-agents.service';
import { PipelineService } from '../../pipeline/pipeline.service';

import type { Response } from 'express';

@ApiTags('ai-agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('ai/agents')
export class AiAgentsController {
  constructor(
    private readonly aiAgentsService: AiAgentsService,
    private readonly pipelineService: PipelineService,
  ) {}

  // ─── Legacy Agent Endpoints ──────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List available AI agents' })
  getAgents() {
    return this.aiAgentsService.getAvailableAgents();
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get user agent sessions' })
  getSessions(
    @Req() req: any,
    @Query('agentType') agentType?: string,
  ) {
    return this.aiAgentsService.getAgentSessions(req.tenantId, req.user.id, agentType);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with an AI agent (single-turn, non-streaming)' })
  chat(
    @Req() req: any,
    @Body() body: {
      agentType: string;
      message: string;
      sessionId?: string;
    },
  ) {
    return this.aiAgentsService.chat({
      tenantId: req.tenantId,
      userId: req.user.id,
      agentType: body.agentType as any,
      message: body.message,
      sessionId: body.sessionId,
    });
  }

  @Post('stream')
  @ApiOperation({ summary: 'Stream an agent response with real-time tool-call events (SSE)' })
  async streamChat(
    @Req() req: any,
    @Res() res: Response,
    @Body() body: {
      agentType: string;
      message: string;
      sessionId?: string;
    },
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const write = (event: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };

    try {
      const gen = this.aiAgentsService.streamChat({
        tenantId: req.tenantId,
        userId: req.user.id,
        agentType: body.agentType as any,
        message: body.message,
        sessionId: body.sessionId,
      });

      for await (const event of gen) {
        if (res.writableEnded) {break;}
        write(event);
      }
    } catch (err: any) {
      if (!res.writableEnded) {
        write({ type: 'error', message: err?.message ?? 'Unknown error' });
      }
    } finally {
      if (!res.writableEnded) {res.end();}
    }
  }

  // ─── Pipeline Endpoints ──────────────────────────────────────────────────────

  @Get('pipelines')
  @ApiOperation({ summary: 'List available multi-step agent pipelines' })
  listPipelines() {
    return this.pipelineService.listPipelines();
  }

  @Post('pipelines/:id/run')
  @ApiOperation({ summary: 'Run a pipeline with input data' })
  async runPipeline(
    @Req() req: any,
    @Param('id') id: string,
    @Body() input: Record<string, unknown>,
  ) {
    return this.pipelineService.runPipeline(id, input, req.user.id, req.tenantId);
  }

  @Sse('pipelines/:id/run/stream')
  @ApiOperation({ summary: 'Run a pipeline with SSE streaming — emits step completion events' })
  runPipelineStream(
    @Req() req: any,
    @Param('id') id: string,
    @Body() input: Record<string, unknown>,
  ): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();

    const run = async () => {
      try {
        const gen = this.pipelineService.streamPipelineRun(id, input, req.user.id, req.tenantId);
        for await (const event of gen) {
          subject.next({ data: JSON.stringify(event) } as unknown as MessageEvent);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        subject.next({ data: JSON.stringify({ step: '__error', status: 'failed', error: message }) } as unknown as MessageEvent);
      } finally {
        subject.complete();
      }
    };

    void run();
    return subject.asObservable();
  }

  @Get('runs')
  @ApiOperation({ summary: 'List recent pipeline runs for current user' })
  listRuns(@Req() req: any, @Query('limit') limit?: string) {
    return this.pipelineService.listRuns(req.user.id, req.tenantId, limit ? +limit : 20);
  }

  @Get('runs/:id')
  @ApiOperation({ summary: 'Get pipeline run status and results' })
  getRun(@Req() req: any, @Param('id') id: string) {
    return this.pipelineService.getRunById(id, req.user.id);
  }

  // ─── Shortcut Endpoints ──────────────────────────────────────────────────────

  @Post('study-plan')
  @ApiOperation({ summary: 'Generate a personalized study plan for the current user' })
  runStudyPlan(
    @Req() req: any,
    @Body() body: { subjects?: string[] },
  ) {
    return this.pipelineService.runStudyPlan(req.user.id, req.tenantId, body.subjects);
  }

  @Post('generate-lesson')
  @ApiOperation({ summary: 'Generate a complete lesson from a topic' })
  generateLesson(
    @Req() req: any,
    @Body() body: { topic: string; gradeLevel?: string; duration?: number },
  ) {
    return this.pipelineService.runLessonGenerator(
      req.user.id,
      req.tenantId,
      body.topic,
      body.gradeLevel,
      body.duration,
    );
  }

  @Post('research')
  @ApiOperation({ summary: 'Research a topic and generate study materials (summary, flashcards, mind map)' })
  runResearch(
    @Req() req: any,
    @Body() body: { topic: string; depth?: 'brief' | 'detailed' | 'comprehensive' },
  ) {
    return this.pipelineService.runResearchAssistant(
      req.user.id,
      req.tenantId,
      body.topic,
      body.depth,
    );
  }
}
