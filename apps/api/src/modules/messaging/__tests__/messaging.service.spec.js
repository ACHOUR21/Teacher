"use strict";

var _common = require("@nestjs/common");
var _testing = require("@nestjs/testing");
var _prisma = require("../../database/prisma.service");
var _messaging = require("../messaging.service");
const mockPrisma = {
  conversation: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn()
  },
  conversationParticipant: {
    findUnique: jest.fn()
  },
  message: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn()
  }
};
describe('MessagingService', () => {
  let service;
  beforeEach(async () => {
    const module = await _testing.Test.createTestingModule({
      providers: [_messaging.MessagingService, {
        provide: _prisma.PrismaService,
        useValue: mockPrisma
      }]
    }).compile();
    service = module.get(_messaging.MessagingService);
    jest.clearAllMocks();
  });
  describe('getConversations', () => {
    it('should return conversations for a user', async () => {
      const convos = [{
        id: 'c-1',
        type: 'direct',
        participants: [],
        messages: [],
        _count: {
          messages: 5
        }
      }];
      mockPrisma.conversation.findMany.mockResolvedValueOnce(convos);
      const result = await service.getConversations('user-1');
      expect(result).toHaveLength(1);
      expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          participants: {
            some: {
              userId: 'user-1'
            }
          }
        }
      }));
    });
  });
  describe('createDirectConversation', () => {
    it('should return existing conversation if one exists', async () => {
      const existing = {
        id: 'c-1',
        participants: [{
          userId: 'u-1'
        }, {
          userId: 'u-2'
        }]
      };
      mockPrisma.conversation.findFirst.mockResolvedValueOnce(existing);
      const result = await service.createDirectConversation('u-1', 'u-2');
      expect(result.id).toBe('c-1');
      expect(mockPrisma.conversation.create).not.toHaveBeenCalled();
    });
    it('should create new conversation when none exists', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValueOnce(null);
      const created = {
        id: 'c-new',
        type: 'direct',
        participants: []
      };
      mockPrisma.conversation.create.mockResolvedValueOnce(created);
      const result = await service.createDirectConversation('u-1', 'u-2');
      expect(result.id).toBe('c-new');
      expect(mockPrisma.conversation.create).toHaveBeenCalled();
    });
  });
  describe('createGroupConversation', () => {
    it('should create a group conversation', async () => {
      const created = {
        id: 'g-1',
        name: 'Study Group',
        type: 'group',
        participants: []
      };
      mockPrisma.conversation.create.mockResolvedValueOnce(created);
      const result = await service.createGroupConversation('Study Group', ['u-1', 'u-2', 'u-3']);
      expect(result.name).toBe('Study Group');
    });
  });
  describe('getMessages', () => {
    it('should return paginated messages for a participant', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValueOnce({
        conversationId: 'c-1',
        userId: 'u-1'
      });
      mockPrisma.message.findMany.mockResolvedValueOnce([{
        id: 'm-1',
        content: 'Hello',
        sender: {
          id: 'u-1',
          firstName: 'Alice'
        }
      }]);
      mockPrisma.message.count.mockResolvedValueOnce(1);
      const result = await service.getMessages('c-1', 'u-1');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
    it('should throw ForbiddenException for non-participant', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValueOnce(null);
      await expect(service.getMessages('c-1', 'outsider')).rejects.toThrow(_common.ForbiddenException);
    });
  });
  describe('sendMessage', () => {
    it('should create a message for a participant', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValueOnce({
        conversationId: 'c-1',
        userId: 'u-1'
      });
      const msg = {
        id: 'm-1',
        content: 'Hi!',
        sender: {
          id: 'u-1',
          firstName: 'Alice'
        }
      };
      mockPrisma.message.create.mockResolvedValueOnce(msg);
      const result = await service.sendMessage('c-1', 'u-1', 'Hi!');
      expect(result.content).toBe('Hi!');
    });
    it('should throw ForbiddenException when sender is not a participant', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValueOnce(null);
      await expect(service.sendMessage('c-1', 'outsider', 'Hi!')).rejects.toThrow(_common.ForbiddenException);
    });
  });
});