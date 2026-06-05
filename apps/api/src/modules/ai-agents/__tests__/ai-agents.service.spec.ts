import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiAgentsService } from '../ai-agents.service';
import { PrismaService } from '../../database/prisma.service';

jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn(),
      },
    })),
  };
});

const mockPrisma = {
  aIConversation: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  aIMessage: {
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
  },
  aIUsage: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  courseProgress: {
    findMany: jest.fn(),
  },
  submission: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn((arr: Promise<any>[]) => Promise.all(arr)),
};

const mockConfig = {
  get: jest.fn().mockReturnValue('mock-api-key'),
};

describe('AiAgentsService', () => {
  let service: AiAgentsService;
  let anthropicMock: jest.Mock;

  beforeEach(async () => {
    const Anthropic = require('@anthropic-ai/sdk').default;
    anthropicMock = jest.fn();
    Anthropic.mockImplementation(() => ({
      messages: { create: anthropicMock },
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAgentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AiAgentsService>(AiAgentsService);
    jest.clearAllMocks();
  });

  describe('getAvailableAgents', () => {
    it('should return agent types with metadata', async () => {
      const agents = await service.getAvailableAgents();
      expect(Array.isArray(agents)).toBe(true);
    });
  });

  describe('getAgentSessions', () => {
    it('should return conversation sessions for a user', async () => {
      const sessions = [
        { id: 'sess-1', agentType: 'STUDY_PLANNER', userId: 'u-1', updatedAt: new Date(), messages: [] },
      ];
      mockPrisma.aIConversation.findMany = jest.fn().mockResolvedValueOnce(sessions);

      const result = await service.getAgentSessions('tenant-1', 'u-1');

      expect(result).toHaveLength(1);
    });
  });

  describe('chat', () => {
    it('should create a new conversation and return a text response', async () => {
      mockPrisma.aIConversation.findFirst.mockResolvedValueOnce(null);
      const session = { id: 'sess-1', agentType: 'HOMEWORK_ASSISTANT', messages: [] };
      mockPrisma.aIConversation.create.mockResolvedValueOnce(session);
      mockPrisma.aIMessage.createMany.mockResolvedValueOnce({});
      mockPrisma.aIUsage.create.mockResolvedValueOnce({ id: 'usage-1' });

      anthropicMock.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Here is a hint for your problem.' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      });
      mockPrisma.aIConversation.update.mockResolvedValueOnce({});

      const result = await service.chat({
        userId: 'u-1',
        tenantId: 'tenant-1',
        agentType: 'HOMEWORK_ASSISTANT',
        message: 'Help me solve this equation',
      });

      expect(result.reply).toBe('Here is a hint for your problem.');
      expect(result.sessionId).toBe('sess-1');
    });

    it('should continue an existing conversation', async () => {
      const existing = {
        id: 'sess-1',
        agentType: 'STUDY_PLANNER',
        messages: [
          { role: 'user', content: 'Previous question' },
          { role: 'assistant', content: 'Previous answer' },
        ],
      };
      mockPrisma.aIConversation.findUnique.mockResolvedValueOnce(existing);
      mockPrisma.aIMessage.createMany.mockResolvedValueOnce({});
      mockPrisma.aIUsage.create.mockResolvedValueOnce({ id: 'usage-1' });

      anthropicMock.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Continuing our plan...' }],
        usage: { input_tokens: 200, output_tokens: 80 },
      });
      mockPrisma.aIConversation.update.mockResolvedValueOnce({});

      const result = await service.chat({
        userId: 'u-1',
        tenantId: 'tenant-1',
        agentType: 'STUDY_PLANNER',
        message: 'Continue my study plan',
        sessionId: 'sess-1',
      });

      expect(result.reply).toBe('Continuing our plan...');
    });
  });
});
