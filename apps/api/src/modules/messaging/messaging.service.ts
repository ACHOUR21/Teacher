import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
      orderBy: { messages: { _count: 'desc' } },
    });
  }

  async createDirectConversation(userId1: string, userId2: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'direct',
        participants: { every: { userId: { in: [userId1, userId2] } } },
      },
      include: { participants: true },
    });

    if (existing && existing.participants.length === 2) {return existing;}

    return this.prisma.conversation.create({
      data: {
        type: 'direct',
        participants: {
          create: [{ userId: userId1 }, { userId: userId2 }],
        },
      },
      include: { participants: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } } },
    });
  }

  async createGroupConversation(name: string, participantIds: string[]) {
    return this.prisma.conversation.create({
      data: {
        type: 'group',
        name,
        participants: { create: participantIds.map(userId => ({ userId })) },
      },
      include: { participants: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
    });
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    await this.verifyParticipant(conversationId, userId);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return { data: messages.reverse(), total, page, limit };
  }

  async sendMessage(conversationId: string, senderId: string, content: string, type = 'text', attachments: string[] = []) {
    await this.verifyParticipant(conversationId, senderId);

    return this.prisma.message.create({
      data: { conversationId, senderId, content, type, attachments },
      include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });
  }

  private async verifyParticipant(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) {throw new ForbiddenException('Not a conversation participant');}
  }
}
