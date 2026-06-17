import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionPlan, UserRole, PaymentStatus, AuditAction } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ─── Audit helper ───────────────────────────────────────────────────────────

  private async auditLog(data: {
    tenantId: string;
    userId?: string;
    action: AuditAction;
    resource: string;
    resourceId?: string;
    before?: unknown;
    after?: unknown;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          before: data.before ? (data.before as object) : undefined,
          after: data.after ? (data.after as object) : undefined,
          ipAddress: data.ipAddress,
        },
      });
    } catch {
      // Audit log failures must never break the primary operation
    }
  }

  // ─── Platform Overview ──────────────────────────────────────────────────────

  async getPlatformOverview() {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      activeUsers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      totalRevenue,
      recentTenants,
      planBreakdown,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.course.count(),
      this.prisma.course.count({ where: { isPublished: true } }),
      this.prisma.courseProgress.count(),
      this.prisma.invoice.aggregate({ where: { status: PaymentStatus.COMPLETED }, _sum: { amount: true } }),
      this.prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, name: true, slug: true, type: true, plan: true,
          isActive: true, createdAt: true,
          _count: { select: { users: true } },
        },
      }),
      this.prisma.tenant.groupBy({
        by: ['plan'],
        _count: { plan: true },
      }),
    ]);

    // Tenant growth last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const tenantGrowth = await this.prisma.tenant.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: { createdAt: { gte: twelveMonthsAgo } },
      orderBy: { createdAt: 'asc' },
    });

    const userGrowth = await this.prisma.user.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().slice(0, 10);
    });
    const userGrowthMap = new Map(
      userGrowth.map(g => [g.createdAt.toISOString().slice(0, 10), g._count.id])
    );
    const userGrowthChart = last30Days.map(date => ({
      date,
      users: userGrowthMap.get(date) ?? 0,
    }));

    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return d.toISOString().slice(0, 7);
    });
    const tenantGrowthMap = new Map(
      tenantGrowth.map(g => [g.createdAt.toISOString().slice(0, 7), g._count.id])
    );
    const tenantGrowthChart = last12Months.map(month => ({
      month,
      tenants: tenantGrowthMap.get(month) ?? 0,
    }));

    return {
      stats: {
        totalTenants,
        activeTenants,
        totalUsers,
        activeUsers,
        totalCourses,
        publishedCourses,
        totalEnrollments,
        totalRevenue: Number(totalRevenue._sum.amount ?? 0),
        // Placeholders — would be populated from metrics store in production
        mrr: 0,
        aiCostToday: 0,
        pendingSupportTickets: 0,
        uptimePercent: 99.9,
      },
      recentTenants,
      planBreakdown: planBreakdown.map(p => ({ plan: p.plan, count: p._count.plan })),
      userGrowthChart,
      tenantGrowthChart,
    };
  }

  // ─── Tenants ────────────────────────────────────────────────────────────────

  async getTenants(
    page = 1,
    limit = 50,
    search?: string,
    plan?: SubscriptionPlan,
    status?: 'active' | 'suspended',
  ) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (plan) { where.plan = plan; }
    if (status === 'active') { where.isActive = true; }
    if (status === 'suspended') { where.isActive = false; }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscription: { select: { status: true, currentPeriodEnd: true } },
          _count: { select: { users: true, schools: true, universities: true } },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTenantDetails(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: true,
        _count: { select: { users: true, schools: true, universities: true } },
      },
    });
    if (!tenant) { throw new NotFoundException('Tenant not found'); }

    const [courseCount, enrollmentCount, revenue, activeUserCount] = await Promise.all([
      this.prisma.course.count({ where: { tenantId: id } }),
      this.prisma.courseProgress.count({ where: { course: { tenantId: id } } }),
      this.prisma.invoice.aggregate({
        where: { subscription: { tenantId: id }, status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
      }),
      this.prisma.user.count({ where: { tenantId: id, isActive: true } }),
    ]);

    return {
      ...tenant,
      courseCount,
      enrollmentCount,
      activeUserCount,
      totalRevenue: Number(revenue._sum.amount ?? 0),
      storageUsedMb: 0, // Would come from storage service in production
      featureFlags: {}, // Would come from feature flag service in production
    };
  }

  async updateTenantStatus(id: string, isActive: boolean, adminId: string, ipAddress?: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) { throw new NotFoundException('Tenant not found'); }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { isActive },
    });

    await this.auditLog({
      tenantId: id,
      userId: adminId,
      action: AuditAction.UPDATE,
      resource: 'Tenant',
      resourceId: id,
      before: { isActive: tenant.isActive },
      after: { isActive },
      ipAddress,
    });

    return updated;
  }

  async overrideTenantPlan(id: string, plan: SubscriptionPlan, adminId: string, ipAddress?: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) { throw new NotFoundException('Tenant not found'); }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { plan },
    });

    await this.auditLog({
      tenantId: id,
      userId: adminId,
      action: AuditAction.UPDATE,
      resource: 'TenantPlan',
      resourceId: id,
      before: { plan: tenant.plan },
      after: { plan },
      ipAddress,
    });

    return updated;
  }

  /** Legacy PATCH handler */
  async updateTenantLegacy(
    id: string,
    dto: { name?: string; plan?: SubscriptionPlan; isActive?: boolean; domain?: string },
    adminId: string,
    ipAddress?: string,
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) { throw new NotFoundException('Tenant not found'); }

    const updated = await this.prisma.tenant.update({ where: { id }, data: dto });

    await this.auditLog({
      tenantId: id,
      userId: adminId,
      action: AuditAction.UPDATE,
      resource: 'Tenant',
      resourceId: id,
      before: { name: tenant.name, plan: tenant.plan, isActive: tenant.isActive, domain: tenant.domain },
      after: dto,
      ipAddress,
    });

    return updated;
  }

  async deleteTenant(id: string, adminId: string, ipAddress?: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) { throw new NotFoundException('Tenant not found'); }

    await this.prisma.tenant.delete({ where: { id } });

    await this.auditLog({
      tenantId: id,
      userId: adminId,
      action: AuditAction.DELETE,
      resource: 'Tenant',
      resourceId: id,
      before: { name: tenant.name, plan: tenant.plan },
      ipAddress,
    });
  }

  async impersonateTenantAdmin(tenantId: string, superAdminId: string, ipAddress?: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { users: { where: { role: { in: [UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.UNIVERSITY_ADMIN] } }, take: 1 } },
    });
    if (!tenant) { throw new NotFoundException('Tenant not found'); }

    const adminUser = tenant.users[0];
    if (!adminUser) { throw new NotFoundException('No admin user found in this tenant'); }

    return this.impersonateUser(adminUser.id, superAdminId, ipAddress, tenantId);
  }

  // ─── Users ──────────────────────────────────────────────────────────────────

  async getUsers(
    page = 1,
    limit = 50,
    search?: string,
    role?: UserRole,
    tenantId?: string,
    status?: 'active' | 'inactive',
  ) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (role) { where.role = role; }
    if (tenantId) { where.tenantId = tenantId; }
    if (status === 'active') { where.isActive = true; }
    if (status === 'inactive') { where.isActive = false; }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, firstName: true, lastName: true, email: true,
          role: true, isActive: true, createdAt: true, tenantId: true,
          lastLoginAt: true,
          tenant: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async changeUserRole(id: string, role: UserRole, adminId: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) { throw new NotFoundException('User not found'); }

    const updated = await this.prisma.user.update({ where: { id }, data: { role } });

    await this.auditLog({
      tenantId: user.tenantId,
      userId: adminId,
      action: AuditAction.UPDATE,
      resource: 'UserRole',
      resourceId: id,
      before: { role: user.role },
      after: { role },
      ipAddress,
    });

    return updated;
  }

  async deleteUser(id: string, adminId: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) { throw new NotFoundException('User not found'); }

    await this.prisma.user.delete({ where: { id } });

    await this.auditLog({
      tenantId: user.tenantId,
      userId: adminId,
      action: AuditAction.DELETE,
      resource: 'User',
      resourceId: id,
      before: { email: user.email, role: user.role },
      ipAddress,
    });
  }

  /** Legacy PATCH handler */
  async updateUserLegacy(
    id: string,
    dto: { role?: UserRole; isActive?: boolean },
    adminId: string,
    ipAddress?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) { throw new NotFoundException('User not found'); }

    const updated = await this.prisma.user.update({ where: { id }, data: dto });

    await this.auditLog({
      tenantId: user.tenantId,
      userId: adminId,
      action: AuditAction.UPDATE,
      resource: 'User',
      resourceId: id,
      before: { role: user.role, isActive: user.isActive },
      after: dto,
      ipAddress,
    });

    return updated;
  }

  // ─── Impersonation ──────────────────────────────────────────────────────────

  async impersonateUser(targetUserId: string, superAdminId: string, ipAddress?: string, _overrideTenantId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { tenant: { select: { name: true, slug: true } } },
    });
    if (!user) { throw new NotFoundException('User not found'); }

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      mfaEnabled: user.mfaEnabled,
      impersonatedBy: superAdminId,
      isImpersonation: true,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: '1h',
    });

    await this.auditLog({
      tenantId: user.tenantId,
      userId: superAdminId,
      action: AuditAction.LOGIN,
      resource: 'Impersonation',
      resourceId: targetUserId,
      after: { targetEmail: user.email, tenantName: user.tenant?.name },
      ipAddress,
    });

    return {
      accessToken,
      user: {
        ...payload,
        tenantName: user.tenant?.name,
      },
    };
  }

  // ─── AI Usage ───────────────────────────────────────────────────────────────

  async getAiUsage(from?: Date, to?: Date) {
    // In production this would query an AI usage/metering table.
    // For now we return a structured placeholder derived from existing data.
    const tenants = await this.prisma.tenant.findMany({
      select: { id: true, name: true, slug: true, plan: true },
      where: { isActive: true },
      take: 10,
    });

    // Mock cost data proportional to tenant count (replace with real metering table)
    const topConsumers = tenants.map((t, i) => ({
      tenantId: t.id,
      tenantName: t.name,
      plan: t.plan,
      tokensToday: Math.max(0, 10000 - i * 800),
      costToday: Math.max(0, (10000 - i * 800) * 0.000002),
      tokensMonth: Math.max(0, 300000 - i * 24000),
      costMonth: Math.max(0, (300000 - i * 24000) * 0.000002),
    }));

    const totalCostToday = topConsumers.reduce((s, t) => s + t.costToday, 0);
    const totalCostMonth = topConsumers.reduce((s, t) => s + t.costMonth, 0);

    const modelBreakdown = [
      { model: 'claude-3-5-sonnet', requests: 4200, costToday: totalCostToday * 0.55, pct: 55 },
      { model: 'claude-3-haiku', requests: 3100, costToday: totalCostToday * 0.25, pct: 25 },
      { model: 'claude-3-opus', requests: 800, costToday: totalCostToday * 0.15, pct: 15 },
      { model: 'whisper-1 (STT)', requests: 300, costToday: totalCostToday * 0.05, pct: 5 },
    ];

    return {
      summary: {
        totalCostToday,
        totalCostMonth,
        totalCostAllTime: totalCostMonth * 6, // rough estimate
        totalRequestsToday: modelBreakdown.reduce((s, m) => s + m.requests, 0),
        from: from?.toISOString(),
        to: to?.toISOString(),
      },
      topConsumers,
      modelBreakdown,
    };
  }

  // ─── Platform Audit Log ─────────────────────────────────────────────────────

  async getPlatformAuditLog(
    page = 1,
    limit = 50,
    filters: {
      tenantId?: string;
      userId?: string;
      action?: AuditAction;
      from?: Date;
      to?: Date;
    },
  ) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (filters.tenantId) { where.tenantId = filters.tenantId; }
    if (filters.userId) { where.userId = filters.userId; }
    if (filters.action) { where.action = filters.action; }
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) { (where.createdAt as Record<string, Date>).gte = filters.from; }
      if (filters.to) { (where.createdAt as Record<string, Date>).lte = filters.to; }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          tenant: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data: logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── System Health ──────────────────────────────────────────────────────────

  async getSystemHealth() {
    const [dbOk, totalAuditLogs] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      this.prisma.auditLog.count(),
    ]);

    return {
      services: {
        api: 'healthy',
        database: dbOk ? 'healthy' : 'unhealthy',
        redis: 'unknown', // would ping Redis in production
        queue: 'unknown', // would check BullMQ in production
        ai: 'unknown',    // would ping AI providers in production
      },
      database: dbOk ? 'healthy' : 'unhealthy',
      totalAuditLogs,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── Billing ────────────────────────────────────────────────────────────────

  async getBillingOverview() {
    const [totalRevenue, _monthlyRevenue, planRevenue, recentInvoices, subscriptionStats] = await Promise.all([
      this.prisma.invoice.aggregate({ where: { status: PaymentStatus.COMPLETED }, _sum: { amount: true }, _count: { id: true } }),
      this.prisma.invoice.groupBy({
        by: ['issuedAt'],
        where: { status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.subscription.groupBy({
        by: ['plan'],
        _count: { plan: true },
        where: { status: 'ACTIVE' },
      }),
      this.prisma.invoice.findMany({
        where: { status: PaymentStatus.COMPLETED },
        orderBy: { issuedAt: 'desc' },
        take: 10,
        include: { subscription: { include: { tenant: { select: { name: true, slug: true } } } } },
      }),
      this.prisma.subscription.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    return {
      totalRevenue: Number(totalRevenue._sum?.amount ?? 0),
      totalInvoices: totalRevenue._count?.id ?? 0,
      planRevenue: planRevenue.map(p => ({ plan: p.plan, count: p._count.plan })),
      subscriptionStats: subscriptionStats.map(s => ({ status: s.status, count: s._count.status })),
      recentInvoices,
    };
  }

  /** Legacy impersonate — used by existing frontend */
  async impersonate(targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { tenant: { select: { name: true, slug: true } } },
    });
    if (!user) { throw new NotFoundException('User not found'); }

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      mfaEnabled: user.mfaEnabled,
      impersonatedBy: 'SUPER_ADMIN',
      isImpersonation: true,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: '1h',
    });

    return { accessToken, user: { ...payload, tenantName: user.tenant?.name } };
  }
}
