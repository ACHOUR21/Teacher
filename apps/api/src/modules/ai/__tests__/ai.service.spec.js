"use strict";

var _testing = require("@nestjs/testing");
var _resilience = require("../../core/services/resilience.service");
var _prisma = require("../../database/prisma.service");
var _ai = require("../ai.service");
const mockPrisma = {
  aIConversation: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  aIMessage: {
    create: jest.fn()
  },
  aIUsage: {
    create: jest.fn(),
    findFirst: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn().mockResolvedValue({
      _sum: {
        tokens: 0
      }
    })
  },
  user: {
    findUnique: jest.fn()
  },
  subscription: {
    findFirst: jest.fn().mockResolvedValue({
      plan: 'PROFESSIONAL',
      status: 'ACTIVE'
    })
  },
  $transaction: jest.fn(cb => cb(mockPrisma))
};
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: 'I can help you with Mathematics!'
        }],
        usage: {
          input_tokens: 100,
          output_tokens: 50
        }
      })
    }
  }))
}));
const mockExamJson = JSON.stringify({
  title: 'Math Test',
  questions: [{
    id: 1,
    type: 'multiple_choice',
    question: 'What is 2+2?',
    options: ['2', '3', '4', '5'],
    answer: '4',
    explanation: 'Basic arithmetic',
    points: 10
  }]
});
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{
          embedding: new Array(1536).fill(0.1)
        }]
      })
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: mockExamJson
            }
          }],
          usage: {
            total_tokens: 150
          }
        })
      }
    },
    moderations: {
      create: jest.fn().mockResolvedValue({
        results: [{
          flagged: false,
          categories: {},
          category_scores: {}
        }]
      })
    }
  }))
}));
describe('AiService', () => {
  let service;
  beforeEach(async () => {
    const module = await _testing.Test.createTestingModule({
      providers: [_ai.AiService, {
        provide: _prisma.PrismaService,
        useValue: mockPrisma
      }, {
        provide: _resilience.ResilienceService,
        useValue: {
          withRetry: jest.fn().mockImplementation((_name, fn) => fn()),
          withCircuitBreaker: jest.fn().mockImplementation((_name, fn) => fn()),
          withResilience: jest.fn().mockImplementation((_name, fn) => fn())
        }
      }]
    }).compile();
    service = module.get(_ai.AiService);
    jest.clearAllMocks();
  });
  describe('tutorChat', () => {
    it('should create a new conversation when no conversationId is provided', async () => {
      mockPrisma.aIConversation.create.mockResolvedValueOnce({
        id: 'conv-1',
        messages: []
      });
      mockPrisma.aIMessage.create.mockResolvedValue({
        id: 'msg-1'
      });
      mockPrisma.aIUsage.create.mockResolvedValue({
        id: 'usage-1'
      });
      const result = await service.tutorChat('user-1', 'tenant-1', 'What is calculus?', 'Mathematics');
      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('conversationId');
      expect(typeof result.answer).toBe('string');
    });
    it('should use existing conversation when conversationId is provided', async () => {
      const existingConversation = {
        id: 'conv-existing',
        messages: [{
          role: 'user',
          content: 'Hello'
        }, {
          role: 'assistant',
          content: 'Hi there!'
        }]
      };
      mockPrisma.aIConversation.findUnique.mockResolvedValueOnce(existingConversation);
      mockPrisma.aIMessage.create.mockResolvedValue({
        id: 'msg-1'
      });
      mockPrisma.aIUsage.create.mockResolvedValue({
        id: 'usage-1'
      });
      const result = await service.tutorChat('user-1', 'tenant-1', 'Tell me more', 'Mathematics', 'conv-existing');
      expect(result.conversationId).toBe('conv-existing');
    });
  });
  describe('generateExam', () => {
    it('should return parsed exam questions', async () => {
      mockPrisma.aIUsage.create.mockResolvedValue({
        id: 'usage-1'
      });
      const result = await service.generateExam('user-1', 'tenant-1', 'Basic Arithmetic', 1, 'beginner', ['multiple_choice']);
      expect(result).toHaveProperty('exam');
      expect(result.exam).toHaveProperty('questions');
    });
  });
  describe('getUsageStats', () => {
    it('should return usage statistics', async () => {
      mockPrisma.aIUsage.groupBy.mockResolvedValue([{
        module: 'TUTOR',
        _sum: {
          tokens: 1000,
          cost: 0.003
        },
        _count: {
          id: 10
        }
      }]);
      const result = await service.getUsageStats('tenant-1', 'month');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});