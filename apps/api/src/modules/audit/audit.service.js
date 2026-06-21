"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AuditService = void 0;
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
let AuditService = exports.AuditService = class AuditService {
  constructor(prisma) {
    this.prisma = prisma;
  }
  async log(dto) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: dto.tenantId,
        userId: dto.userId,
        action: dto.action,
        resource: dto.resource,
        resourceId: dto.resourceId,
        before: dto.before ? dto.before : undefined,
        after: dto.after ? dto.after : undefined,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent
      }
    });
  }
  async query(tenantId, filters) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const skip = (page - 1) * limit;
    const where = {
      tenantId
    };
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.resource) {
      where.resource = filters.resource;
    }
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) {
        where.createdAt.gte = filters.from;
      }
      if (filters.to) {
        where.createdAt.lte = filters.to;
      }
    }
    const [logs, total] = await Promise.all([this.prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    }), this.prisma.auditLog.count({
      where
    })]);
    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
};
exports.AuditService = AuditService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], AuditService);