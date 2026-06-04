import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AiAgentsService } from '../../ai-agents.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../tenants/guards/tenant.guard';

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
  @ApiOperation({ summary: 'Chat with an AI agent' })
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
}
