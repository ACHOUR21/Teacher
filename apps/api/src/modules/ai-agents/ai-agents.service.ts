import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import Anthropic from '@anthropic-ai/sdk';
import { ConfigService } from '@nestjs/config';

type AgentType = 'STUDY_PLANNER' | 'HOMEWORK_ASSISTANT' | 'RESEARCH_ASSISTANT' | 'CAREER_ADVISOR' | 'PERFORMANCE_COACH';

interface AgentConfig {
  systemPrompt: string;
  tools: Anthropic.Tool[];
}

@Injectable()
export class AiAgentsService {
  private readonly anthropic: Anthropic;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.anthropic = new Anthropic({ apiKey: this.config.get('ANTHROPIC_API_KEY') });
  }

  private getAgentConfig(type: AgentType): AgentConfig {
    const configs: Record<AgentType, AgentConfig> = {
      STUDY_PLANNER: {
        systemPrompt: `You are an AI Study Planner. Your role is to help students create personalized study schedules,
          set learning goals, track progress, and optimize their study habits. You have access to the student's
          enrolled courses, upcoming deadlines, and past performance data. Provide actionable, specific plans.`,
        tools: [
          {
            name: 'get_student_schedule',
            description: 'Retrieve the student current course schedule and deadlines',
            input_schema: {
              type: 'object' as const,
              properties: { userId: { type: 'string', description: 'Student user ID' } },
              required: ['userId'],
            },
          },
          {
            name: 'create_study_plan',
            description: 'Create or update a personalized study plan',
            input_schema: {
              type: 'object' as const,
              properties: {
                userId: { type: 'string' },
                plan: { type: 'array', items: { type: 'object' }, description: 'Array of study sessions' },
              },
              required: ['userId', 'plan'],
            },
          },
        ],
      },
      HOMEWORK_ASSISTANT: {
        systemPrompt: `You are an AI Homework Assistant. Guide students through problems step by step
          without giving direct answers. Help them understand concepts, identify their mistakes, and
          develop problem-solving skills. Always encourage critical thinking.`,
        tools: [
          {
            name: 'search_knowledge_base',
            description: 'Search educational knowledge base for relevant concepts',
            input_schema: {
              type: 'object' as const,
              properties: {
                query: { type: 'string', description: 'Search query' },
                subject: { type: 'string', description: 'Subject area' },
              },
              required: ['query'],
            },
          },
        ],
      },
      RESEARCH_ASSISTANT: {
        systemPrompt: `You are an AI Research Assistant. Help students find credible sources,
          summarize academic content, structure research papers, and properly cite sources.
          Encourage academic integrity and critical evaluation of sources.`,
        tools: [
          {
            name: 'search_academic_sources',
            description: 'Search for academic papers and credible sources',
            input_schema: {
              type: 'object' as const,
              properties: {
                topic: { type: 'string' },
                dateRange: { type: 'string', description: 'e.g. last_5_years' },
              },
              required: ['topic'],
            },
          },
          {
            name: 'format_citation',
            description: 'Format a citation in APA, MLA, or Chicago style',
            input_schema: {
              type: 'object' as const,
              properties: {
                sourceData: { type: 'object' },
                style: { type: 'string', enum: ['APA', 'MLA', 'Chicago'] },
              },
              required: ['sourceData', 'style'],
            },
          },
        ],
      },
      CAREER_ADVISOR: {
        systemPrompt: `You are an AI Career Advisor for students. Help them explore career paths,
          identify skill gaps, prepare for interviews, write resumes and cover letters, and make
          informed decisions about their educational and professional journey.`,
        tools: [
          {
            name: 'get_career_insights',
            description: 'Get market insights for a specific career path',
            input_schema: {
              type: 'object' as const,
              properties: {
                career: { type: 'string' },
                location: { type: 'string' },
              },
              required: ['career'],
            },
          },
        ],
      },
      PERFORMANCE_COACH: {
        systemPrompt: `You are an AI Performance Coach. Analyze student performance data,
          identify strengths and weaknesses, predict at-risk situations, and provide personalized
          coaching to improve academic outcomes. Be encouraging and constructive.`,
        tools: [
          {
            name: 'get_performance_metrics',
            description: 'Retrieve detailed performance metrics for a student',
            input_schema: {
              type: 'object' as const,
              properties: {
                userId: { type: 'string' },
                timeframe: { type: 'string', description: 'e.g. last_30_days, semester' },
              },
              required: ['userId'],
            },
          },
        ],
      },
    };

    return configs[type];
  }

  async chat(params: {
    tenantId: string;
    userId: string;
    agentType: AgentType;
    message: string;
    sessionId?: string;
  }) {
    const { tenantId, userId, agentType, message, sessionId } = params;
    const config = this.getAgentConfig(agentType);

    let history: Anthropic.MessageParam[] = [];

    if (sessionId) {
      const session = await this.prisma.aIConversation.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      if (session) {
        history = session.messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
      }
    }

    history.push({ role: 'user', content: message });

    const response = await this.anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      system: config.systemPrompt,
      tools: config.tools,
      messages: history,
    });

    let reply = '';
    const toolResults: { tool: string; input: any; output: string }[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        reply = block.text;
      } else if (block.type === 'tool_use') {
        const toolOutput = await this.executeTool(block.name, block.input as Record<string, any>, userId, tenantId);
        toolResults.push({ tool: block.name, input: block.input, output: toolOutput });
      }
    }

    if (toolResults.length > 0 && !reply) {
      const followUp = await this.anthropic.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 2048,
        system: config.systemPrompt,
        messages: [
          ...history,
          { role: 'assistant', content: response.content },
          {
            role: 'user',
            content: toolResults.map(tr => ({
              type: 'tool_result' as const,
              tool_use_id: tr.tool,
              content: tr.output,
            })),
          },
        ],
      });
      reply = followUp.content.find(b => b.type === 'text')?.text ?? '';
    }

    const convId = sessionId ?? (await this.prisma.aIConversation.create({
      data: { tenantId, userId, module: 'AI_AGENTS', title: `${agentType} - ${new Date().toLocaleDateString()}` },
    })).id;

    await this.prisma.$transaction([
      this.prisma.aIMessage.create({ data: { conversationId: convId, role: 'user', content: message } }),
      this.prisma.aIMessage.create({ data: { conversationId: convId, role: 'assistant', content: reply } }),
      this.prisma.aIUsage.create({
        data: {
          tenantId,
          userId,
          module: 'AI_AGENTS',
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cost: (response.usage.input_tokens * 0.000015 + response.usage.output_tokens * 0.000075),
          model: 'claude-opus-4-8',
        },
      }),
    ]);

    return { reply, sessionId: convId, toolResults };
  }

  private async executeTool(toolName: string, input: Record<string, any>, userId: string, tenantId: string): Promise<string> {
    switch (toolName) {
      case 'get_student_schedule':
        const enrollments = await this.prisma.enrollment.findMany({
          where: { userId, course: { tenantId } },
          include: { course: { select: { title: true, sections: { include: { lessons: { select: { title: true } } } } } } },
          take: 5,
        });
        return JSON.stringify(enrollments.map(e => ({ course: e.course.title })));

      case 'get_performance_metrics':
        const progress = await this.prisma.courseProgress.findMany({
          where: { userId },
          include: { course: { select: { title: true } } },
        });
        return JSON.stringify(progress.map(p => ({
          course: p.course.title,
          percent: p.progressPercent,
        })));

      default:
        return JSON.stringify({ message: `Tool ${toolName} executed`, input });
    }
  }

  async getAgentSessions(tenantId: string, userId: string, agentType?: string) {
    return this.prisma.aIConversation.findMany({
      where: {
        tenantId,
        userId,
        module: 'AI_AGENTS',
        ...(agentType && { title: { contains: agentType } }),
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
  }

  async getAvailableAgents() {
    return [
      { type: 'STUDY_PLANNER', name: 'Study Planner', description: 'Creates personalized study schedules and tracks progress', icon: '📚' },
      { type: 'HOMEWORK_ASSISTANT', name: 'Homework Assistant', description: 'Guides you through problems step by step', icon: '✏️' },
      { type: 'RESEARCH_ASSISTANT', name: 'Research Assistant', description: 'Helps find sources and structure academic papers', icon: '🔬' },
      { type: 'CAREER_ADVISOR', name: 'Career Advisor', description: 'Explores career paths and professional development', icon: '🎯' },
      { type: 'PERFORMANCE_COACH', name: 'Performance Coach', description: 'Analyzes performance and provides personalized coaching', icon: '📊' },
    ];
  }
}
