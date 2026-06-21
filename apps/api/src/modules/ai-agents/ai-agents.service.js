"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AiAgentsService = void 0;
var _sdk = _interopRequireDefault(require("@anthropic-ai/sdk"));
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _client = require("@prisma/client");
var _prisma = require("../database/prisma.service");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
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
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

let AiAgentsService = exports.AiAgentsService = class AiAgentsService {
  anthropic;
  constructor(prisma, config) {
    this.prisma = prisma;
    this.config = config;
    this.anthropic = new _sdk.default({
      apiKey: this.config.get('ANTHROPIC_API_KEY') ?? 'placeholder-key'
    });
  }
  getAgentConfig(type) {
    const configs = {
      STUDY_PLANNER: {
        systemPrompt: `You are an AI Study Planner. Your role is to help students create personalized study schedules,
          set learning goals, track progress, and optimize their study habits. You have access to the student's
          enrolled courses, upcoming deadlines, and past performance data. Provide actionable, specific plans.`,
        tools: [{
          name: 'get_student_schedule',
          description: 'Retrieve the student current course schedule and deadlines',
          input_schema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'Student user ID'
              }
            },
            required: ['userId']
          }
        }, {
          name: 'create_study_plan',
          description: 'Create or update a personalized study plan',
          input_schema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string'
              },
              plan: {
                type: 'array',
                items: {
                  type: 'object'
                },
                description: 'Array of study sessions'
              }
            },
            required: ['userId', 'plan']
          }
        }]
      },
      HOMEWORK_ASSISTANT: {
        systemPrompt: `You are an AI Homework Assistant. Guide students through problems step by step
          without giving direct answers. Help them understand concepts, identify their mistakes, and
          develop problem-solving skills. Always encourage critical thinking.`,
        tools: [{
          name: 'search_knowledge_base',
          description: 'Search educational knowledge base for relevant concepts',
          input_schema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query'
              },
              subject: {
                type: 'string',
                description: 'Subject area'
              }
            },
            required: ['query']
          }
        }]
      },
      RESEARCH_ASSISTANT: {
        systemPrompt: `You are an AI Research Assistant. Help students find credible sources,
          summarize academic content, structure research papers, and properly cite sources.
          Encourage academic integrity and critical evaluation of sources.`,
        tools: [{
          name: 'search_academic_sources',
          description: 'Search for academic papers and credible sources',
          input_schema: {
            type: 'object',
            properties: {
              topic: {
                type: 'string'
              },
              dateRange: {
                type: 'string',
                description: 'e.g. last_5_years'
              }
            },
            required: ['topic']
          }
        }, {
          name: 'format_citation',
          description: 'Format a citation in APA, MLA, or Chicago style',
          input_schema: {
            type: 'object',
            properties: {
              sourceData: {
                type: 'object'
              },
              style: {
                type: 'string',
                enum: ['APA', 'MLA', 'Chicago']
              }
            },
            required: ['sourceData', 'style']
          }
        }]
      },
      CAREER_ADVISOR: {
        systemPrompt: `You are an AI Career Advisor for students. Help them explore career paths,
          identify skill gaps, prepare for interviews, write resumes and cover letters, and make
          informed decisions about their educational and professional journey.`,
        tools: [{
          name: 'get_career_insights',
          description: 'Get market insights for a specific career path',
          input_schema: {
            type: 'object',
            properties: {
              career: {
                type: 'string'
              },
              location: {
                type: 'string'
              }
            },
            required: ['career']
          }
        }]
      },
      PERFORMANCE_COACH: {
        systemPrompt: `You are an AI Performance Coach. Analyze student performance data,
          identify strengths and weaknesses, predict at-risk situations, and provide personalized
          coaching to improve academic outcomes. Be encouraging and constructive.`,
        tools: [{
          name: 'get_performance_metrics',
          description: 'Retrieve detailed performance metrics for a student',
          input_schema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string'
              },
              timeframe: {
                type: 'string',
                description: 'e.g. last_30_days, semester'
              }
            },
            required: ['userId']
          }
        }]
      }
    };
    return configs[type];
  }
  async chat(params) {
    const {
      tenantId,
      userId,
      agentType,
      message,
      sessionId
    } = params;
    const config = this.getAgentConfig(agentType);
    let history = [];
    if (sessionId) {
      const session = await this.prisma.aIConversation.findUnique({
        where: {
          id: sessionId
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });
      if (session) {
        history = session.messages.map(m => ({
          role: m.role,
          content: m.content
        }));
      }
    }
    history.push({
      role: 'user',
      content: message
    });
    const response = await this.anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      system: config.systemPrompt,
      tools: config.tools,
      messages: history
    });
    let reply = '';
    const toolResults = [];
    for (const block of response.content) {
      if (block.type === 'text') {
        reply = block.text;
      } else if (block.type === 'tool_use') {
        const toolOutput = await this.executeTool(block.name, block.input, userId, tenantId);
        toolResults.push({
          tool: block.name,
          input: block.input,
          output: toolOutput
        });
      }
    }
    if (toolResults.length > 0 && !reply) {
      const followUp = await this.anthropic.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 2048,
        system: config.systemPrompt,
        messages: [...history, {
          role: 'assistant',
          content: response.content
        }, {
          role: 'user',
          content: toolResults.map(tr => ({
            type: 'tool_result',
            tool_use_id: tr.tool,
            content: tr.output
          }))
        }]
      });
      reply = followUp.content.find(b => b.type === 'text')?.text ?? '';
    }
    const convId = sessionId ?? (await this.prisma.aIConversation.create({
      data: {
        tenantId,
        userId,
        module: _client.AIModuleType.AI_AGENTS,
        title: `${agentType} - ${new Date().toLocaleDateString()}`
      }
    })).id;
    await this.prisma.$transaction([this.prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: 'user',
        content: message
      }
    }), this.prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: 'assistant',
        content: reply
      }
    }), this.prisma.aIUsage.create({
      data: {
        tenantId,
        userId,
        module: _client.AIModuleType.AI_AGENTS,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cost: response.usage.input_tokens * 0.000015 + response.usage.output_tokens * 0.000075,
        model: 'claude-opus-4-8'
      }
    })]);
    return {
      reply,
      sessionId: convId,
      toolResults
    };
  }
  async *streamChat(params) {
    const {
      tenantId,
      userId,
      agentType,
      message,
      sessionId
    } = params;
    const config = this.getAgentConfig(agentType);
    const MAX_ITERATIONS = 10;
    // Load conversation history
    let history = [];
    if (sessionId) {
      const session = await this.prisma.aIConversation.findUnique({
        where: {
          id: sessionId
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });
      if (session) {
        history = session.messages.map(m => ({
          role: m.role,
          content: m.content
        }));
      }
    }
    history.push({
      role: 'user',
      content: message
    });
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let finalText = '';
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      yield {
        type: 'status',
        phase: 'thinking'
      };
      yield {
        type: 'status',
        phase: 'responding'
      };
      const finalMsg = await this.anthropic.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 2048,
        system: config.systemPrompt,
        tools: config.tools,
        messages: history
      });
      let _iterationText = '';
      for (const block of finalMsg.content) {
        if (block.type === 'text') {
          _iterationText += block.text;
          finalText += block.text;
          yield {
            type: 'delta',
            text: block.text
          };
        }
      }
      totalInputTokens += finalMsg.usage.input_tokens;
      totalOutputTokens += finalMsg.usage.output_tokens;
      history.push({
        role: 'assistant',
        content: finalMsg.content
      });
      if (finalMsg.stop_reason !== 'tool_use') {
        break;
      }
      // Execute tools and continue the loop
      yield {
        type: 'status',
        phase: 'tool_calling'
      };
      const toolResultContent = [];
      for (const block of finalMsg.content) {
        if (block.type !== 'tool_use') {
          continue;
        }
        yield {
          type: 'tool_call',
          id: block.id,
          name: block.name,
          input: block.input
        };
        const output = await this.executeTool(block.name, block.input, userId, tenantId);
        yield {
          type: 'tool_result',
          id: block.id,
          name: block.name,
          output
        };
        toolResultContent.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: output
        });
      }
      history.push({
        role: 'user',
        content: toolResultContent
      });
    }
    // Persist conversation
    const convId = sessionId ?? (await this.prisma.aIConversation.create({
      data: {
        tenantId,
        userId,
        module: _client.AIModuleType.AI_AGENTS,
        title: `${agentType} — ${new Date().toLocaleDateString()}`
      }
    })).id;
    await this.prisma.$transaction([this.prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: 'user',
        content: message
      }
    }), this.prisma.aIMessage.create({
      data: {
        conversationId: convId,
        role: 'assistant',
        content: finalText
      }
    }), this.prisma.aIUsage.create({
      data: {
        tenantId,
        userId,
        module: _client.AIModuleType.AI_AGENTS,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cost: totalInputTokens * 0.000015 + totalOutputTokens * 0.000075,
        model: 'claude-opus-4-8'
      }
    })]);
    yield {
      type: 'done',
      sessionId: convId,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens
    };
  }
  async executeTool(toolName, input, userId, _tenantId) {
    switch (toolName) {
      case 'get_student_schedule':
        {
          const enrollments = await this.prisma.enrollment.findMany({
            where: {
              studentId: userId
            },
            select: {
              id: true,
              programId: true,
              status: true,
              startedAt: true
            },
            take: 5
          });
          return JSON.stringify(enrollments.map(e => ({
            programId: e.programId,
            status: e.status
          })));
        }
      case 'get_performance_metrics':
        {
          const progress = await this.prisma.courseProgress.findMany({
            where: {
              studentId: userId
            },
            select: {
              courseId: true,
              progressPercent: true,
              lastAccessedAt: true
            }
          });
          return JSON.stringify(progress.map(p => ({
            courseId: p.courseId,
            percent: p.progressPercent
          })));
        }
      default:
        return JSON.stringify({
          message: `Tool ${toolName} executed`,
          input
        });
    }
  }
  async getAgentSessions(tenantId, userId, agentType) {
    return this.prisma.aIConversation.findMany({
      where: {
        tenantId,
        userId,
        module: _client.AIModuleType.AI_AGENTS,
        ...(agentType && {
          title: {
            contains: agentType
          }
        })
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 20,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
  getAvailableAgents() {
    return [{
      type: 'STUDY_PLANNER',
      name: 'Study Planner',
      description: 'Creates personalized study schedules and tracks progress',
      icon: '📚'
    }, {
      type: 'HOMEWORK_ASSISTANT',
      name: 'Homework Assistant',
      description: 'Guides you through problems step by step',
      icon: '✏️'
    }, {
      type: 'RESEARCH_ASSISTANT',
      name: 'Research Assistant',
      description: 'Helps find sources and structure academic papers',
      icon: '🔬'
    }, {
      type: 'CAREER_ADVISOR',
      name: 'Career Advisor',
      description: 'Explores career paths and professional development',
      icon: '🎯'
    }, {
      type: 'PERFORMANCE_COACH',
      name: 'Performance Coach',
      description: 'Analyzes performance and provides personalized coaching',
      icon: '📊'
    }];
  }
};
exports.AiAgentsService = AiAgentsService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_config.ConfigService)), __metadata("design:paramtypes", [Object, Object])], AiAgentsService);