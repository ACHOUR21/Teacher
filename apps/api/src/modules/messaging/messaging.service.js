"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MessagingService = void 0;
var _common = require("@nestjs/common");
var _prisma = require("../database/prisma.service");
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
let MessagingService = exports.MessagingService = class MessagingService {
  constructor(prisma) {
    this.prisma = prisma;
  }
  async getConversations(userId) {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: {
        messages: {
          _count: 'desc'
        }
      }
    });
  }
  async createDirectConversation(userId1, userId2) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'direct',
        participants: {
          every: {
            userId: {
              in: [userId1, userId2]
            }
          }
        }
      },
      include: {
        participants: true
      }
    });
    if (existing && existing.participants.length === 2) {
      return existing;
    }
    return this.prisma.conversation.create({
      data: {
        type: 'direct',
        participants: {
          create: [{
            userId: userId1
          }, {
            userId: userId2
          }]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });
  }
  async createGroupConversation(name, participantIds) {
    return this.prisma.conversation.create({
      data: {
        type: 'group',
        name,
        participants: {
          create: participantIds.map(userId => ({
            userId
          }))
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });
  }
  async getMessages(conversationId, userId, page = 1, limit = 50) {
    await this.verifyParticipant(conversationId, userId);
    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([this.prisma.message.findMany({
      where: {
        conversationId
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      }
    }), this.prisma.message.count({
      where: {
        conversationId
      }
    })]);
    return {
      data: messages.reverse(),
      total,
      page,
      limit
    };
  }
  async sendMessage(conversationId, senderId, content, type = 'text', attachments = []) {
    await this.verifyParticipant(conversationId, senderId);
    return this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        type,
        attachments
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      }
    });
  }
  async verifyParticipant(conversationId, userId) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      }
    });
    if (!participant) {
      throw new _common.ForbiddenException('Not a conversation participant');
    }
  }
};
exports.MessagingService = MessagingService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], MessagingService);