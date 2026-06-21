"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LiveService = void 0;
var _common = require("@nestjs/common");
var _client = require("@prisma/client");
var _prisma = require("../database/prisma.service");
var _notifications = require("../notifications/notifications.service");
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
let LiveService = exports.LiveService = class LiveService {
  constructor(prisma, notifications) {
    this.prisma = prisma;
    this.notifications = notifications;
  }
  async createSession(teacherId, dto) {
    const session = await this.prisma.liveSession.create({
      data: {
        teacherId,
        title: dto.title,
        description: dto.description,
        scheduledAt: dto.scheduledAt,
        maxParticipants: dto.maxParticipants ?? 100,
        settings: dto.settings ?? {}
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });
    // fire-and-forget: notify any participants already added to this session
    this.prisma.liveParticipant.findMany({
      where: {
        sessionId: session.id,
        leftAt: null
      },
      select: {
        userId: true
      }
    }).then(async participants => {
      for (const p of participants) {
        await this.notifications.notifyUser(p.userId, 'New Live Session Scheduled', `"${dto.title}" has been scheduled for ${new Date(dto.scheduledAt).toLocaleString()}`, {
          type: 'GENERAL',
          sessionId: session.id
        }).catch(() => {});
      }
    }).catch(() => {});
    return session;
  }
  async findAll(tenantId, query) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = {
      teacher: {
        user: {
          tenantId
        }
      },
      ...(query.status && {
        status: query.status
      })
    };
    const [sessions, total] = await Promise.all([this.prisma.liveSession.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        scheduledAt: 'desc'
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            }
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      }
    }), this.prisma.liveSession.count({
      where
    })]);
    return {
      data: sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  async findOne(id) {
    const session = await this.prisma.liveSession.findUnique({
      where: {
        id
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            }
          }
        },
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
    if (!session) {
      throw new _common.NotFoundException('Live session not found');
    }
    return session;
  }
  async startSession(id, teacherId) {
    const session = await this.prisma.liveSession.findUnique({
      where: {
        id
      }
    });
    if (!session) {
      throw new _common.NotFoundException('Session not found');
    }
    if (session.teacherId !== teacherId) {
      throw new _common.BadRequestException('Not session owner');
    }
    if (session.status !== _client.LiveSessionStatus.SCHEDULED) {
      throw new _common.BadRequestException('Session already started or ended');
    }
    const updatedSession = await this.prisma.liveSession.update({
      where: {
        id
      },
      data: {
        status: _client.LiveSessionStatus.LIVE,
        startedAt: new Date()
      }
    });
    // notify all active participants that the session is now live
    this.prisma.liveParticipant.findMany({
      where: {
        sessionId: id,
        leftAt: null
      },
      select: {
        userId: true
      }
    }).then(async participants => {
      for (const p of participants) {
        await this.notifications.notifyUser(p.userId, 'Live Session Started', `"${session.title}" is now live. Join now!`, {
          type: 'GENERAL',
          sessionId: id
        }).catch(() => {});
      }
    }).catch(() => {});
    return updatedSession;
  }
  async endSession(id, teacherId) {
    const session = await this.prisma.liveSession.findUnique({
      where: {
        id
      }
    });
    if (!session) {
      throw new _common.NotFoundException('Session not found');
    }
    if (session.teacherId !== teacherId) {
      throw new _common.BadRequestException('Not session owner');
    }
    if (session.status !== _client.LiveSessionStatus.LIVE) {
      throw new _common.BadRequestException('Session is not live');
    }
    return this.prisma.liveSession.update({
      where: {
        id
      },
      data: {
        status: _client.LiveSessionStatus.ENDED,
        endedAt: new Date()
      }
    });
  }
  async joinSession(sessionId, userId, role = 'student') {
    const session = await this.prisma.liveSession.findUnique({
      where: {
        id: sessionId
      }
    });
    if (!session) {
      throw new _common.NotFoundException('Session not found');
    }
    if (session.status === _client.LiveSessionStatus.ENDED) {
      throw new _common.BadRequestException('Session has ended');
    }
    const existing = await this.prisma.liveParticipant.findFirst({
      where: {
        sessionId,
        userId,
        leftAt: null
      }
    });
    if (existing) {
      return existing;
    }
    return this.prisma.liveParticipant.create({
      data: {
        sessionId,
        userId,
        role
      }
    });
  }
  async leaveSession(sessionId, userId) {
    await this.prisma.liveParticipant.updateMany({
      where: {
        sessionId,
        userId,
        leftAt: null
      },
      data: {
        leftAt: new Date()
      }
    });
  }
  async getParticipants(sessionId) {
    return this.prisma.liveParticipant.findMany({
      where: {
        sessionId,
        leftAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true
          }
        }
      }
    });
  }
};
exports.LiveService = LiveService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_notifications.NotificationsService)), __metadata("design:paramtypes", [Object, Object])], LiveService);