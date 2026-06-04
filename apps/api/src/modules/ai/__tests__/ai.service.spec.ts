import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../cache/redis.service';

const mockPrisma = {
  aIConversation: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  aIMessage: { create: jest.fn() },
  aIUsage: { create: jest.fn(), findFirst: jest.fn() },
  $transaction: jest.fn((cb: any) => cb(mockPrisma)),
};

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn(),
  incr: jest.fn().mockResolvedValue(1),
  expire: jest.fn(),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      ANTHROPIC_API_KEY: 'test-key',
      OPENAI_API_KEY: 'test-openai-key',
    };
    return map[key] ?? '';
  }),
};

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'I can help you with Mathematics!' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      }),
    },
  })),
}));

jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      }),
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'OpenAI response' } }],
          usage: { prompt_tokens: 100, completion_tokens: 50 },
        }),
      },
    },
  })),
}));

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    jest.clearAllMocks();
  });

  describe('tutorChat', () => {
    it('should create a new conversation when no conversationId is provided', async () => {
      mockPrisma.aIConversation.create.mockResolvedValueOnce({
        id: 'conv-1',
        messages: [],
      });
      mockPrisma.aIMessage.create.mockResolvedValue({ id: 'msg-1' });
      mockPrisma.aIUsage.create.mockResolvedValue({ id: 'usage-1' });

      const result = await service.tutorChat({
        tenantId: 'tenant-1',
        userId: 'user-1',
        message: 'What is calculus?',
        subject: 'Mathematics',
      });

      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('conversationId');
      expect(typeof result.answer).toBe('string');
    });

    it('should use existing conversation when conversationId is provided', async () => {
      const existingConversation = {
        id: 'conv-existing',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
      };
      mockPrisma.aIConversation.findUnique.mockResolvedValueOnce(existingConversation);
      mockPrisma.aIMessage.create.mockResolvedValue({ id: 'msg-1' });
      mockPrisma.aIUsage.create.mockResolvedValue({ id: 'usage-1' });

      const result = await service.tutorChat({
        tenantId: 'tenant-1',
        userId: 'user-1',
        message: 'Tell me more',
        subject: 'Mathematics',
        conversationId: 'conv-existing',
      });

      expect(result.conversationId).toBe('conv-existing');
    });
  });

  describe('generateExam', () => {
    it('should return parsed exam questions', async () => {
      const mockExamJson = JSON.stringify({
        questions: [
          {
            question: 'What is 2 + 2?',
            type: 'MULTIPLE_CHOICE',
            options: ['2', '3', '4', '5'],
            correctAnswer: '4',
            points: 10,
            explanation: '2 + 2 equals 4',
          },
        ],
      });

      // Re-mock to return exam JSON
      const Anthropic = require('@anthropic-ai/sdk').default;
      Anthropic.mockImplementationOnce(() => ({
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{ type: 'text', text: mockExamJson }],
            usage: { input_tokens: 200, output_tokens: 100 },
          }),
        },
      }));

      mockPrisma.aIUsage.create.mockResolvedValue({ id: 'usage-1' });

      const result = await service.generateExam({
        tenantId: 'tenant-1',
        userId: 'user-1',
        subject: 'Mathematics',
        topic: 'Basic Arithmetic',
        difficulty: 'BEGINNER',
        questionCount: 1,
        questionTypes: ['MULTIPLE_CHOICE'],
      });

      expect(result).toHaveProperty('questions');
      expect(Array.isArray(result.questions)).toBe(true);
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics', async () => {
      mockPrisma.aIUsage.findFirst.mockResolvedValue({
        _sum: { inputTokens: 1000, outputTokens: 500, cost: 0.05 },
        _count: { id: 20 },
      });

      const result = await service.getUsageStats({
        tenantId: 'tenant-1',
        userId: 'user-1',
      });

      expect(result).toBeDefined();
    });
  });
});
