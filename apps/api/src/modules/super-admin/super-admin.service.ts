import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SubscriptionPlan, UserRole } from '@prisma/client';

@Injectable()
export class SuperAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

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
      this.prisma.invoice.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
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
      },
      recentTenants,
      planBreakdown: planBreakdown.map(p => ({ plan: p.plan, count: p._count.plan })),
      userGrowthChart,
    };
  }

  async getTenants(page = 1, limit = 20, search?: string, plan?: SubscriptionPlan) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (plan) where.plan = plan;
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
    if (!tenant) throw new NotFoundException('Tenant not found');

    const [courseCount, enrollmentCount, revenue] = await Promise.all([
      this.prisma.course.count({ where: { tenantId: id } }),
      this.prisma.courseProgress.count({ where: { course: { tenantId: id } } }),
      this.prisma.invoice.aggregate({
        where: { subscription: { tenantId: id }, status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

    return {
      ...tenant,
      courseCount,
      enrollmentCount,
      totalRevenue: Number(revenue._sum.amount ?? 0),
    };
  }

  async updateTenant(id: string, dto: { name?: string; plan?: SubscriptionPlan; isActive?: boolean; domain?: string }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async deleteTenant(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    await this.prisma.tenant.delete({ where: { id } });
  }

  async getUsers(page = 1, limit = 20, search?: string, role?: UserRole, tenantId?: string) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (tenantId) where.tenantId = tenantId;
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
          tenant: { select: { name: true, slug: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateUser(id: string, dto: { role?: UserRole; isActive?: boolean }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  async getBillingOverview() {
    const [totalRevenue, monthlyRevenue, planRevenue, recentInvoices, subscriptionStats] = await Promise.all([
      this.prisma.invoice.aggregate({ where: { status: 'PAID' }, _sum: { amount: true }, _count: { id: true } }),
      this.prisma.invoice.groupBy({
        by: ['issuedAt'],
        where: { status: 'PAID' },
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
        where: { status: 'PAID' },
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
      totalRevenue: Number(totalRevenue._sum.amount ?? 0),
      totalInvoices: totalRevenue._count.id,
      planRevenue: planRevenue.map(p => ({ plan: p.plan, count: p._count.plan })),
      subscriptionStats: subscriptionStats.map(s => ({ status: s.status, count: s._count.status })),
      recentInvoices,
    };
  }

  async impersonate(targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { tenant: { select: { name: true, slug: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      mfaEnabled: user.mfaEnabled,
      impersonatedBy: 'SUPER_ADMIN',
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: '1h',
    });

    return { accessToken, user: { ...payload, tenantName: user.tenant.name } };
  }

  async getSystemHealth() {
    const [dbOk, totalAuditLogs] = await Promise.all([
      this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false),
      this.prisma.auditLog.count(),
    ]);

    return {
      database: dbOk ? 'healthy' : 'unhealthy',
      totalAuditLogs,
      timestamp: new Date().toISOString(),
    };
  }
}
