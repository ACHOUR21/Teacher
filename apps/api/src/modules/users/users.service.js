"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UsersService = exports.UpdateUserProfileDto = exports.UpdateUserDto = void 0;
var _common = require("@nestjs/common");
var _client = require("@prisma/client");
var _redis = require("../cache/redis.service");
var _pagination = require("../core/pagination/pagination.dto");
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
var UsersService_1;
class UpdateUserDto {
  firstName;
  lastName;
  phone;
  avatarUrl;
  isActive;
}
exports.UpdateUserDto = UpdateUserDto;
class UpdateUserProfileDto {
  bio;
  timezone;
  language;
  dateOfBirth;
  gender;
  address;
  socialLinks;
  preferences;
}
exports.UpdateUserProfileDto = UpdateUserProfileDto;
let UsersService = exports.UsersService = UsersService_1 = class UsersService {
  logger = new _common.Logger(UsersService_1.name);
  constructor(prisma, redis) {
    this.prisma = prisma;
    this.redis = redis;
  }
  async findAll(tenantId, pagination, roleFilter) {
    const {
      skip,
      limit,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;
    const where = {
      tenantId,
      ...(roleFilter && {
        role: roleFilter
      }),
      ...(search && {
        OR: [{
          firstName: {
            contains: search,
            mode: 'insensitive'
          }
        }, {
          lastName: {
            contains: search,
            mode: 'insensitive'
          }
        }, {
          email: {
            contains: search,
            mode: 'insensitive'
          }
        }]
      })
    };
    const [items, total] = await Promise.all([this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        profile: {
          select: {
            timezone: true,
            language: true
          }
        }
      }
    }), this.prisma.user.count({
      where
    })]);
    return (0, _pagination.paginate)(items, total, pagination.page, limit);
  }
  async findById(id, tenantId) {
    const cacheKey = `user:${id}:profile`;
    const cached = await this.redis.getObject(cacheKey);
    if (cached) {
      return cached;
    }
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        phone: true,
        emailVerified: true,
        phoneVerified: true,
        mfaEnabled: true,
        createdAt: true,
        lastLoginAt: true,
        profile: true,
        teacherProfile: {
          select: {
            subjects: true,
            bio: true,
            rating: true,
            isVerified: true
          }
        },
        studentProfile: {
          select: {
            grade: true,
            gpa: true,
            studentId: true
          }
        }
      }
    });
    if (!user) {
      throw new _common.NotFoundException('User not found');
    }
    await this.redis.setObject(cacheKey, user, 300);
    return user;
  }
  async update(id, tenantId, dto) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId
      }
    });
    if (!user) {
      throw new _common.NotFoundException('User not found');
    }
    const updated = await this.prisma.user.update({
      where: {
        id
      },
      data: {
        ...(dto.firstName && {
          firstName: dto.firstName
        }),
        ...(dto.lastName && {
          lastName: dto.lastName
        }),
        ...(dto.phone !== undefined && {
          phone: dto.phone
        }),
        ...(dto.avatarUrl !== undefined && {
          avatarUrl: dto.avatarUrl
        }),
        ...(dto.isActive !== undefined && {
          isActive: dto.isActive
        })
      }
    });
    await this.redis.del(`user:${id}:profile`);
    return updated;
  }
  async updateProfile(userId, tenantId, dto) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId
      }
    });
    if (!user) {
      throw new _common.NotFoundException('User not found');
    }
    const profile = await this.prisma.userProfile.upsert({
      where: {
        userId
      },
      update: {
        ...(dto.bio !== undefined && {
          bio: dto.bio
        }),
        ...(dto.timezone && {
          timezone: dto.timezone
        }),
        ...(dto.language && {
          language: dto.language
        }),
        ...(dto.dateOfBirth && {
          dateOfBirth: dto.dateOfBirth
        }),
        ...(dto.gender !== undefined && {
          gender: dto.gender
        }),
        ...(dto.address && {
          address: dto.address
        }),
        ...(dto.socialLinks && {
          socialLinks: dto.socialLinks
        }),
        ...(dto.preferences && {
          preferences: dto.preferences
        })
      },
      create: {
        userId,
        bio: dto.bio,
        timezone: dto.timezone || 'UTC',
        language: dto.language || 'en',
        dateOfBirth: dto.dateOfBirth,
        gender: dto.gender,
        address: dto.address,
        socialLinks: dto.socialLinks || {},
        preferences: dto.preferences || {}
      }
    });
    await this.redis.del(`user:${userId}:profile`);
    return profile;
  }
  async delete(id, tenantId, requestingUser) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId
      }
    });
    if (!user) {
      throw new _common.NotFoundException('User not found');
    }
    if (requestingUser.role !== _client.UserRole.SUPER_ADMIN && requestingUser.role !== _client.UserRole.ADMIN && requestingUser.id !== id) {
      throw new _common.ForbiddenException('Insufficient permissions to delete this user');
    }
    await this.prisma.user.update({
      where: {
        id
      },
      data: {
        isActive: false
      }
    });
    await this.redis.del(`user:${id}:profile`);
    this.logger.log(`User ${id} deactivated by ${requestingUser.id}`);
  }
  async assignRole(userId, tenantId, role, requestingUser) {
    if (requestingUser.role !== _client.UserRole.SUPER_ADMIN && requestingUser.role !== _client.UserRole.ADMIN) {
      throw new _common.ForbiddenException('Only admins can assign roles');
    }
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId
      }
    });
    if (!user) {
      throw new _common.NotFoundException('User not found');
    }
    const updated = await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        role
      }
    });
    await this.redis.del(`user:${userId}:profile`);
    this.logger.log(`Role ${role} assigned to user ${userId} by ${requestingUser.role}`);
    return updated;
  }
  async updateMe(userId, tenantId, dto) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId
      }
    });
    if (!user) {
      throw new _common.NotFoundException('User not found');
    }
    const [updatedUser] = await this.prisma.$transaction([this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        ...(dto.firstName && {
          firstName: dto.firstName
        }),
        ...(dto.lastName && {
          lastName: dto.lastName
        }),
        ...(dto.phone !== undefined && {
          phone: dto.phone
        }),
        ...(dto.avatarUrl !== undefined && {
          avatarUrl: dto.avatarUrl
        })
      }
    }), this.prisma.userProfile.upsert({
      where: {
        userId
      },
      update: {
        ...(dto.bio !== undefined && {
          bio: dto.bio
        }),
        ...(dto.timezone && {
          timezone: dto.timezone
        }),
        ...(dto.language && {
          language: dto.language
        })
      },
      create: {
        userId,
        bio: dto.bio,
        timezone: dto.timezone ?? 'UTC',
        language: dto.language ?? 'en'
      }
    })]);
    await this.redis.del(`user:${userId}:profile`);
    return updatedUser;
  }
  async getUserDevices(userId) {
    return this.prisma.userDevice.findMany({
      where: {
        userId
      },
      orderBy: {
        lastSeenAt: 'desc'
      }
    });
  }
  async revokeDevice(userId, deviceId) {
    const device = await this.prisma.userDevice.findFirst({
      where: {
        userId,
        deviceId
      }
    });
    if (!device) {
      throw new _common.NotFoundException('Device not found');
    }
    await this.prisma.userDevice.update({
      where: {
        deviceId
      },
      data: {
        isActive: false
      }
    });
  }
  async getUserActivity(userId, tenantId) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId
      }
    });
    if (!user) {
      throw new _common.NotFoundException('User not found');
    }
    const [recentSessions, recentAuditLogs, courseProgress, achievements] = await Promise.all([this.prisma.userSession.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true
      }
    }), this.prisma.auditLog.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20,
      select: {
        action: true,
        resource: true,
        resourceId: true,
        createdAt: true
      }
    }), this.prisma.courseProgress.findMany({
      where: {
        student: {
          userId
        }
      },
      orderBy: {
        lastAccessedAt: 'desc'
      },
      take: 5,
      include: {
        course: {
          select: {
            title: true,
            slug: true
          }
        }
      }
    }), this.prisma.userAchievement.findMany({
      where: {
        userId
      },
      orderBy: {
        earnedAt: 'desc'
      },
      take: 5,
      include: {
        achievement: true
      }
    })]);
    return {
      sessions: recentSessions,
      auditLogs: recentAuditLogs,
      courseProgress,
      achievements
    };
  }
  async exportUserData(userId, _tenantId) {
    const [user, profile, sessions, devices, submissions, progress, certificates, notifications, messages, achievements] = await Promise.all([this.prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        emailVerified: true,
        avatarUrl: true
      }
    }), this.prisma.userProfile.findUnique({
      where: {
        userId
      }
    }), this.prisma.userSession.findMany({
      where: {
        userId
      },
      select: {
        createdAt: true,
        expiresAt: true
      },
      take: 100
    }), this.prisma.userDevice.findMany({
      where: {
        userId
      },
      select: {
        deviceName: true,
        deviceType: true,
        lastSeenAt: true,
        createdAt: true
      }
    }), this.prisma.submission.findMany({
      where: {
        student: {
          userId
        }
      },
      include: {
        assignment: {
          select: {
            title: true
          }
        }
      },
      take: 200
    }).catch(() => []), this.prisma.courseProgress.findMany({
      where: {
        student: {
          userId
        }
      },
      include: {
        course: {
          select: {
            title: true
          }
        }
      },
      take: 200
    }).catch(() => []), this.prisma.issuedCertificate.findMany({
      where: {
        student: {
          userId
        }
      },
      include: {
        template: {
          select: {
            name: true
          }
        }
      },
      take: 50
    }).catch(() => []), this.prisma.notification.findMany({
      where: {
        userId
      },
      select: {
        title: true,
        body: true,
        createdAt: true
      },
      take: 200,
      orderBy: {
        createdAt: 'desc'
      }
    }), this.prisma.message.findMany({
      where: {
        senderId: userId
      },
      select: {
        content: true,
        createdAt: true
      },
      take: 200,
      orderBy: {
        createdAt: 'desc'
      }
    }).catch(() => []), this.prisma.userAchievement.findMany({
      where: {
        userId
      },
      include: {
        achievement: {
          select: {
            name: true,
            description: true
          }
        }
      }
    }).catch(() => [])]);
    return {
      exportedAt: new Date().toISOString(),
      account: user,
      profile,
      sessions,
      devices,
      learningProgress: progress,
      submissions,
      certificates,
      notifications,
      messages,
      achievements
    };
  }
};
exports.UsersService = UsersService = UsersService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_redis.RedisService)), __metadata("design:paramtypes", [Object, Object])], UsersService);