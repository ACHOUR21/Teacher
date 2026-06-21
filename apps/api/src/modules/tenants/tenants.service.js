"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UpdateTenantDto = exports.TenantsService = exports.CreateTenantDto = void 0;
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
var TenantsService_1;
class CreateTenantDto {
  name;
  slug;
  type;
  domain;
  logoUrl;
  settings;
}
exports.CreateTenantDto = CreateTenantDto;
class UpdateTenantDto {
  name;
  domain;
  logoUrl;
  settings;
  isActive;
}
exports.UpdateTenantDto = UpdateTenantDto;
let TenantsService = exports.TenantsService = TenantsService_1 = class TenantsService {
  logger = new _common.Logger(TenantsService_1.name);
  CACHE_TTL = 300;
  constructor(prisma, redis) {
    this.prisma = prisma;
    this.redis = redis;
  }
  async findAll(pagination) {
    const {
      skip,
      limit,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;
    const where = search ? {
      OR: [{
        name: {
          contains: search,
          mode: 'insensitive'
        }
      }, {
        slug: {
          contains: search,
          mode: 'insensitive'
        }
      }]
    } : {};
    const [items, total] = await Promise.all([this.prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        _count: {
          select: {
            users: true
          }
        },
        subscription: {
          select: {
            plan: true,
            status: true
          }
        }
      }
    }), this.prisma.tenant.count({
      where
    })]);
    return (0, _pagination.paginate)(items, total, pagination.page, limit);
  }
  async findBySlug(slug) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        slug
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        logoUrl: true,
        isActive: true
      }
    });
    if (!tenant || !tenant.isActive) {
      throw new _common.NotFoundException('School not found');
    }
    return tenant;
  }
  async findById(id) {
    const cacheKey = `tenant:${id}:full`;
    const cached = await this.redis.getObject(cacheKey);
    if (cached) {
      return cached;
    }
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id
      },
      include: {
        subscription: true,
        whiteLabel: true,
        _count: {
          select: {
            users: true,
            schools: true,
            universities: true
          }
        }
      }
    });
    if (!tenant) {
      throw new _common.NotFoundException('Tenant not found');
    }
    await this.redis.setObject(cacheKey, tenant, this.CACHE_TTL);
    return tenant;
  }
  async create(dto) {
    const existing = await this.prisma.tenant.findUnique({
      where: {
        slug: dto.slug
      }
    });
    if (existing) {
      throw new _common.ConflictException('Tenant slug already taken');
    }
    if (dto.domain) {
      const domainTaken = await this.prisma.tenant.findUnique({
        where: {
          domain: dto.domain
        }
      });
      if (domainTaken) {
        throw new _common.ConflictException('Domain already in use');
      }
    }
    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        type: dto.type,
        domain: dto.domain,
        logoUrl: dto.logoUrl,
        settings: dto.settings || {}
      }
    });
    this.logger.log(`Tenant created: ${tenant.slug}`);
    return tenant;
  }
  async update(id, dto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id
      }
    });
    if (!tenant) {
      throw new _common.NotFoundException('Tenant not found');
    }
    if (dto.domain && dto.domain !== tenant.domain) {
      const domainTaken = await this.prisma.tenant.findFirst({
        where: {
          domain: dto.domain,
          id: {
            not: id
          }
        }
      });
      if (domainTaken) {
        throw new _common.ConflictException('Domain already in use');
      }
    }
    const updated = await this.prisma.tenant.update({
      where: {
        id
      },
      data: {
        ...(dto.name && {
          name: dto.name
        }),
        ...(dto.domain !== undefined && {
          domain: dto.domain
        }),
        ...(dto.logoUrl !== undefined && {
          logoUrl: dto.logoUrl
        }),
        ...(dto.settings && {
          settings: dto.settings
        }),
        ...(dto.isActive !== undefined && {
          isActive: dto.isActive
        })
      }
    });
    await this.redis.delPattern(`tenant:${id}*`);
    await this.redis.delPattern(`tenant:${tenant.slug}*`);
    return updated;
  }
  async delete(id, requestingUserId) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id
      }
    });
    if (!tenant) {
      throw new _common.NotFoundException('Tenant not found');
    }
    const requestingUser = await this.prisma.user.findFirst({
      where: {
        id: requestingUserId,
        role: _client.UserRole.SUPER_ADMIN
      }
    });
    if (!requestingUser) {
      throw new _common.ForbiddenException('Only SUPER_ADMIN can delete tenants');
    }
    await this.prisma.tenant.delete({
      where: {
        id
      }
    });
    await this.redis.delPattern(`tenant:${id}*`);
    this.logger.log(`Tenant deleted: ${id} by ${requestingUserId}`);
  }
  async getStats(tenantId) {
    const cacheKey = `tenant:${tenantId}:stats`;
    const cached = await this.redis.getObject(cacheKey);
    if (cached) {
      return cached;
    }
    const [userCount, studentCount, teacherCount, courseCount, activeSessions] = await Promise.all([this.prisma.user.count({
      where: {
        tenantId
      }
    }), this.prisma.student.count({
      where: {
        user: {
          tenantId
        }
      }
    }), this.prisma.teacher.count({
      where: {
        user: {
          tenantId
        }
      }
    }), this.prisma.course.count({
      where: {
        tenantId
      }
    }), this.prisma.liveSession.count({
      where: {
        status: 'LIVE',
        teacher: {
          user: {
            tenantId
          }
        }
      }
    })]);
    const stats = {
      users: userCount,
      students: studentCount,
      teachers: teacherCount,
      courses: courseCount,
      activeSessions,
      generatedAt: new Date().toISOString()
    };
    await this.redis.setObject(cacheKey, stats, 60);
    return stats;
  }
  async updateSettings(tenantId, settings) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId
      }
    });
    if (!tenant) {
      throw new _common.NotFoundException('Tenant not found');
    }
    const currentSettings = tenant.settings;
    const merged = {
      ...currentSettings,
      ...settings
    };
    const updated = await this.prisma.tenant.update({
      where: {
        id: tenantId
      },
      data: {
        settings: merged
      }
    });
    await this.redis.delPattern(`tenant:${tenantId}*`);
    return updated;
  }
  async getOnboardingStatus(tenantId) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId
      },
      select: {
        settings: true,
        logoUrl: true,
        name: true,
        slug: true
      }
    });
    if (!tenant) {
      throw new _common.NotFoundException('Tenant not found');
    }
    const s = tenant.settings ?? {};
    return {
      completed: s.onboardingCompleted ?? false,
      completedSteps: s.onboardingCompletedSteps ?? [],
      logoUrl: tenant.logoUrl,
      name: tenant.name,
      slug: tenant.slug
    };
  }
  async updateOnboarding(tenantId, completedSteps, completed) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId
      },
      select: {
        settings: true
      }
    });
    if (!tenant) {
      throw new _common.NotFoundException('Tenant not found');
    }
    const s = tenant.settings ?? {};
    await this.prisma.tenant.update({
      where: {
        id: tenantId
      },
      data: {
        settings: {
          ...s,
          onboardingCompleted: completed,
          onboardingCompletedSteps: completedSteps
        }
      }
    });
    await this.redis.delPattern(`tenant:${tenantId}*`);
    return {
      completed,
      completedSteps
    };
  }
  async updateTenantProfile(tenantId, dto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId
      },
      select: {
        settings: true
      }
    });
    if (!tenant) {
      throw new _common.NotFoundException('Tenant not found');
    }
    const s = tenant.settings ?? {};
    const updated = await this.prisma.tenant.update({
      where: {
        id: tenantId
      },
      data: {
        ...(dto.name ? {
          name: dto.name
        } : {}),
        ...(dto.logoUrl !== undefined ? {
          logoUrl: dto.logoUrl
        } : {}),
        settings: {
          ...s,
          ...(dto.description !== undefined ? {
            description: dto.description
          } : {}),
          ...(dto.website !== undefined ? {
            website: dto.website
          } : {})
        }
      }
    });
    await this.redis.delPattern(`tenant:${tenantId}*`);
    return updated;
  }
};
exports.TenantsService = TenantsService = TenantsService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_redis.RedisService)), __metadata("design:paramtypes", [Object, Object])], TenantsService);