import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { LiveSessionStatus } from '@prisma/client';

@Injectable()
export class LiveService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(teacherId: string, dto: {
    title: string;
    description?: string;
    scheduledAt: Date;
    maxParticipants?: number;
    settings?: Record<string, unknown>;
  }) {
    return this.prisma.liveSession.create({
      data: {
        teacherId,
        title: dto.title,
        description: dto.description,
        scheduledAt: dto.scheduledAt,
        maxParticipants: dto.maxParticipants ?? 100,
        settings: dto.settings ?? {},
      },
      include: { teacher: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } } },
    });
  }

  async findAll(tenantId: string, query: { page?: number; limit?: number; status?: LiveSessionStatus }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      teacher: { user: { tenantId } },
      ...(query.status && { status: query.status }),
    };

    const [sessions, total] = await Promise.all([
      this.prisma.liveSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          teacher: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
          _count: { select: { participants: true } },
        },
      }),
      this.prisma.liveSession.count({ where }),
    ]);

    return { data: sessions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: {
        teacher: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        participants: { include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } } },
      },
    });
    if (!session) throw new NotFoundException('Live session not found');
    return session;
  }

  async startSession(id: string, teacherId: string) {
    const session = await this.prisma.liveSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.teacherId !== teacherId) throw new BadRequestException('Not session owner');
    if (session.status !== LiveSessionStatus.SCHEDULED) throw new BadRequestException('Session already started or ended');

    return this.prisma.liveSession.update({
      where: { id },
      data: { status: LiveSessionStatus.LIVE, startedAt: new Date() },
    });
  }

  async endSession(id: string, teacherId: string) {
    const session = await this.prisma.liveSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.teacherId !== teacherId) throw new BadRequestException('Not session owner');
    if (session.status !== LiveSessionStatus.LIVE) throw new BadRequestException('Session is not live');

    return this.prisma.liveSession.update({
      where: { id },
      data: { status: LiveSessionStatus.ENDED, endedAt: new Date() },
    });
  }

  async joinSession(sessionId: string, userId: string, role = 'student') {
    const session = await this.prisma.liveSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    if (session.status === LiveSessionStatus.ENDED) throw new BadRequestException('Session has ended');

    const existing = await this.prisma.liveParticipant.findFirst({
      where: { sessionId, userId, leftAt: null },
    });
    if (existing) return existing;

    return this.prisma.liveParticipant.create({
      data: { sessionId, userId, role },
    });
  }

  async leaveSession(sessionId: string, userId: string) {
    await this.prisma.liveParticipant.updateMany({
      where: { sessionId, userId, leftAt: null },
      data: { leftAt: new Date() },
    });
  }

  async getParticipants(sessionId: string) {
    return this.prisma.liveParticipant.findMany({
      where: { sessionId, leftAt: null },
      include: { user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } } },
    });
  }
}
