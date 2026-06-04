import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditAction } from '@prisma/client';

interface CreateAuditLogDto {
  tenantId: string;
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: dto.tenantId,
        userId: dto.userId,
        action: dto.action,
        resource: dto.resource,
        resourceId: dto.resourceId,
        before: dto.before ? (dto.before as object) : undefined,
        after: dto.after ? (dto.after as object) : undefined,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      },
    });
  }

  async query(tenantId: string, filters: {
    userId?: string;
    action?: AuditAction;
    resource?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { tenantId };
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.resource) where.resource = filters.resource;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) (where.createdAt as Record<string, Date>).gte = filters.from;
      if (filters.to) (where.createdAt as Record<string, Date>).lte = filters.to;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
