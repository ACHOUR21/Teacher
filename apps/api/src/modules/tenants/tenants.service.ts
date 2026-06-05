import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { PaginationDto, paginate } from '../core/pagination/pagination.dto';
import { UserRole, TenantType, Prisma } from '@prisma/client';

export class CreateTenantDto {
  name: string;
  slug: string;
  type: TenantType;
  domain?: string;
  logoUrl?: string;
  settings?: Record<string, unknown>;
}

export class UpdateTenantDto {
  name?: string;
  domain?: string;
  logoUrl?: string;
  settings?: Record<string, unknown>;
  isActive?: boolean;
}

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);
  private readonly CACHE_TTL = 300;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(pagination: PaginationDto) {
    const { skip, limit, search, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { slug: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { users: true } },
          subscription: { select: { plan: true, status: true } },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return paginate(items, total, pagination.page, limit);
  }

  async findById(id: string) {
    const cacheKey = `tenant:${id}:full`;
    const cached = await this.redis.getObject<unknown>(cacheKey);
    if (cached) return cached;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: true,
        whiteLabel: true,
        _count: { select: { users: true, schools: true, universities: true } },
      },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');

    await this.redis.setObject(cacheKey, tenant, this.CACHE_TTL);
    return tenant;
  }

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Tenant slug already taken');

    if (dto.domain) {
      const domainTaken = await this.prisma.tenant.findUnique({ where: { domain: dto.domain } });
      if (domainTaken) throw new ConflictException('Domain already in use');
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        type: dto.type,
        domain: dto.domain,
        logoUrl: dto.logoUrl,
        settings: (dto.settings || {}) as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Tenant created: ${tenant.slug}`);
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (dto.domain && dto.domain !== tenant.domain) {
      const domainTaken = await this.prisma.tenant.findFirst({
        where: { domain: dto.domain, id: { not: id } },
      });
      if (domainTaken) throw new ConflictException('Domain already in use');
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.domain !== undefined && { domain: dto.domain }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.settings && { settings: dto.settings as Prisma.InputJsonValue }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    await this.redis.delPattern(`tenant:${id}*`);
    await this.redis.delPattern(`tenant:${tenant.slug}*`);
    return updated;
  }

  async delete(id: string, requestingUserId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const requestingUser = await this.prisma.user.findFirst({
      where: { id: requestingUserId, role: UserRole.SUPER_ADMIN },
    });
    if (!requestingUser) throw new ForbiddenException('Only SUPER_ADMIN can delete tenants');

    await this.prisma.tenant.delete({ where: { id } });
    await this.redis.delPattern(`tenant:${id}*`);
    this.logger.log(`Tenant deleted: ${id} by ${requestingUserId}`);
  }

  async getStats(tenantId: string) {
    const cacheKey = `tenant:${tenantId}:stats`;
    const cached = await this.redis.getObject<unknown>(cacheKey);
    if (cached) return cached;

    const [
      userCount,
      studentCount,
      teacherCount,
      courseCount,
      activeSessions,
    ] = await Promise.all([
      this.prisma.user.count({ where: { tenantId } }),
      this.prisma.student.count({ where: { user: { tenantId } } }),
      this.prisma.teacher.count({ where: { user: { tenantId } } }),
      this.prisma.course.count({ where: { tenantId } }),
      this.prisma.liveSession.count({ where: { status: 'LIVE', teacher: { user: { tenantId } } } }),
    ]);

    const stats = {
      users: userCount,
      students: studentCount,
      teachers: teacherCount,
      courses: courseCount,
      activeSessions,
      generatedAt: new Date().toISOString(),
    };

    await this.redis.setObject(cacheKey, stats, 60);
    return stats;
  }

  async updateSettings(tenantId: string, settings: Record<string, unknown>) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const currentSettings = tenant.settings as Record<string, unknown>;
    const merged = { ...currentSettings, ...settings };

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: merged as Prisma.InputJsonValue },
    });

    await this.redis.delPattern(`tenant:${tenantId}*`);
    return updated;
  }
}
