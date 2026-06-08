import { Controller, Get, Post, Body, Query, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiAgentsService } from '../../ai-agents.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { TenantGuard } from '../../../core/guards/tenant.guard';
import type { Response } from 'express';

@ApiTags('ai-agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('ai/agents')
export class AiAgentsController {
  constructor(private readonly aiAgentsService: AiAgentsService) {}

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
        if (res.writableEnded) break;
        write(event);
      }
    } catch (err: any) {
      if (!res.writableEnded) {
        write({ type: 'error', message: err?.message ?? 'Unknown error' });
      }
    } finally {
      if (!res.writableEnded) res.end();
    }
  }
}
