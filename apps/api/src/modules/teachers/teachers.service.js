"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TeachersService = void 0;
var _common = require("@nestjs/common");
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
let TeachersService = exports.TeachersService = class TeachersService {
  constructor(prisma, notifications) {
    this.prisma = prisma;
    this.notifications = notifications;
  }
  async findAll(tenantId, query) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = {
      user: {
        tenantId,
        isActive: true
      }
    };
    if (query.schoolId) {
      where.schoolId = query.schoolId;
    }
    if (query.search) {
      where.user = {
        tenantId,
        isActive: true,
        OR: [{
          firstName: {
            contains: query.search,
            mode: 'insensitive'
          }
        }, {
          lastName: {
            contains: query.search,
            mode: 'insensitive'
          }
        }, {
          email: {
            contains: query.search,
            mode: 'insensitive'
          }
        }]
      };
    }
    const [teachers, total] = await Promise.all([this.prisma.teacher.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            createdAt: true
          }
        },
        school: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            courses: true,
            liveSessions: true
          }
        }
      },
      orderBy: {
        user: {
          firstName: 'asc'
        }
      }
    }), this.prisma.teacher.count({
      where
    })]);
    return {
      data: teachers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  async findByUserId(userId) {
    return this.prisma.teacher.findUnique({
      where: {
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true
          }
        },
        school: {
          select: {
            name: true
          }
        },
        courses: {
          where: {
            isPublished: true
          },
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            rating: true,
            enrollCount: true
          }
        },
        _count: {
          select: {
            courses: true,
            liveSessions: true
          }
        }
      }
    });
  }
  async findOne(id) {
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        id
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            phone: true
          }
        },
        school: {
          select: {
            name: true
          }
        },
        courses: {
          where: {
            isPublished: true
          },
          take: 5,
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            rating: true,
            enrollCount: true
          }
        },
        _count: {
          select: {
            courses: true,
            liveSessions: true
          }
        }
      }
    });
    if (!teacher) {
      throw new _common.NotFoundException('Teacher not found');
    }
    return teacher;
  }
  async update(id, dto) {
    return this.prisma.teacher.update({
      where: {
        id
      },
      data: dto
    });
  }
  async getPerformanceStats(id) {
    const [coursesCount, studentsCount, avgRating, completionsCount] = await Promise.all([this.prisma.course.count({
      where: {
        teacherId: id,
        isPublished: true
      }
    }), this.prisma.courseProgress.count({
      where: {
        course: {
          teacherId: id
        }
      }
    }), this.prisma.course.aggregate({
      where: {
        teacherId: id
      },
      _avg: {
        rating: true
      }
    }), this.prisma.courseProgress.count({
      where: {
        course: {
          teacherId: id
        },
        completedAt: {
          not: null
        }
      }
    })]);
    return {
      coursesCount,
      studentsCount,
      avgRating: avgRating._avg.rating ?? 0,
      completionsCount,
      completionRate: studentsCount > 0 ? completionsCount / studentsCount * 100 : 0
    };
  }
  async getTenantStats(tenantId) {
    const [total, activeThisMonth, totalCourses] = await Promise.all([this.prisma.teacher.count({
      where: {
        user: {
          tenantId
        }
      }
    }), this.prisma.teacher.count({
      where: {
        user: {
          tenantId
        },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    }), this.prisma.course.count({
      where: {
        teacher: {
          user: {
            tenantId
          }
        },
        isPublished: true
      }
    })]);
    return {
      total,
      activeThisMonth,
      totalCourses
    };
  }
  async inviteTeacher(tenantId, dto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId
      },
      select: {
        name: true,
        slug: true
      }
    });
    const inviteLink = `${process.env['APP_URL'] ?? 'http://localhost:3000'}/join/${tenant?.slug ?? ''}`;
    await this.notifications.sendEmail(dto.email, `You're invited to teach on ${tenant?.name ?? 'EduAI'}`, `<p>Hi ${dto.firstName ?? 'there'},</p>
       <p>You've been invited to join <strong>${tenant?.name ?? 'EduAI'}</strong> as a teacher.</p>
       <a href="${inviteLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Accept Invitation →</a>`);
    return {
      message: 'Invitation sent',
      email: dto.email,
      inviteLink
    };
  }
  async getSchedule(id) {
    const sessions = await this.prisma.liveSession.findMany({
      where: {
        teacherId: id,
        status: {
          in: ['SCHEDULED', 'LIVE']
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      },
      take: 20
    });
    return sessions;
  }
};
exports.TeachersService = TeachersService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_notifications.NotificationsService)), __metadata("design:paramtypes", [Object, Object])], TeachersService);