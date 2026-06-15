import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { SubscriptionPlan, UserRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { SuperAdminService } from '../super-admin.service';

const mockPrisma = {
  tenant: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    groupBy: jest.fn(),
  },
  user: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    groupBy: jest.fn(),
  },
  course: {
    count: jest.fn(),
  },
  courseProgress: {
    count: jest.fn(),
  },
  invoice: {
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
  },
  subscription: {
    groupBy: jest.fn(),
  },
  auditLog: {
    count: jest.fn(),
    create: jest.fn().mockResolvedValue({}),
  },
  $queryRaw: jest.fn(),
};

const mockJwt = { sign: jest.fn().mockReturnValue('mock-token') };
const mockConfig = { get: jest.fn().mockReturnValue('test-secret') };

describe('SuperAdminService', () => {
  let service: SuperAdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<SuperAdminService>(SuperAdminService);
    jest.clearAllMocks();
  });

  // Helper to set up all the mock calls needed for getPlatformOverview
  function setupPlatformOverviewMocks(overrides: {
    totalTenants?: number;
    activeTenants?: number;
    totalUsers?: number;
    activeUsers?: number;
    totalCourses?: number;
    publishedCourses?: number;
    totalEnrollments?: number;
    invoiceAmount?: number | null;
    recentTenants?: unknown[];
    planBreakdown?: unknown[];
  } = {}) {
    const {
      totalTenants = 0,
      activeTenants = 0,
      totalUsers = 0,
      activeUsers = 0,
      totalCourses = 0,
      publishedCourses = 0,
      totalEnrollments = 0,
      invoiceAmount = null,
      recentTenants = [],
      planBreakdown = [],
    } = overrides;

    // Promise.all batch: tenant.count×2, user.count×2, course.count×2, courseProgress.count, invoice.aggregate, tenant.findMany, tenant.groupBy
    mockPrisma.tenant.count
      .mockResolvedValueOnce(totalTenants)
      .mockResolvedValueOnce(activeTenants);
    mockPrisma.user.count
      .mockResolvedValueOnce(totalUsers)
      .mockResolvedValueOnce(activeUsers);
    mockPrisma.course.count
      .mockResolvedValueOnce(totalCourses)
      .mockResolvedValueOnce(publishedCourses);
    mockPrisma.courseProgress.count.mockResolvedValueOnce(totalEnrollments);
    mockPrisma.invoice.aggregate.mockResolvedValueOnce({ _sum: { amount: invoiceAmount } });
    mockPrisma.tenant.findMany.mockResolvedValueOnce(recentTenants);
    // First tenant.groupBy call → plan breakdown
    mockPrisma.tenant.groupBy.mockResolvedValueOnce(planBreakdown);
    // Second tenant.groupBy call → tenant growth (sequential, after Promise.all)
    mockPrisma.tenant.groupBy.mockResolvedValueOnce([]);
    // user.groupBy → user growth (sequential)
    mockPrisma.user.groupBy.mockResolvedValueOnce([]);
  }

  describe('getPlatformOverview', () => {
    it('should return aggregated platform stats', async () => {
      setupPlatformOverviewMocks({
        totalTenants: 10,
        activeTenants: 8,
        totalUsers: 500,
        activeUsers: 420,
        totalCourses: 80,
        publishedCourses: 60,
        totalEnrollments: 1200,
        invoiceAmount: 9500,
        recentTenants: [
          { id: 't-1', name: 'Acme School', slug: 'acme', type: 'SCHOOL', plan: 'PROFESSIONAL', isActive: true, createdAt: new Date(), _count: { users: 50 } },
        ],
        planBreakdown: [
          { plan: 'PROFESSIONAL', _count: { plan: 5 } },
          { plan: 'STARTER', _count: { plan: 3 } },
        ],
      });

      const result = await service.getPlatformOverview();

      expect(result.stats.totalTenants).toBe(10);
      expect(result.stats.activeTenants).toBe(8);
      expect(result.stats.totalUsers).toBe(500);
      expect(result.stats.totalRevenue).toBe(9500);
      expect(result.recentTenants).toHaveLength(1);
      expect(result.planBreakdown).toHaveLength(2);
      expect(result.userGrowthChart).toHaveLength(30);
    });

    it('should return zero totalRevenue when no paid invoices exist', async () => {
      setupPlatformOverviewMocks({ invoiceAmount: null });

      const result = await service.getPlatformOverview();

      expect(result.stats.totalRevenue).toBe(0);
    });
  });

  describe('getTenants', () => {
    it('should return paginated tenants', async () => {
      const tenants = [
        { id: 't-1', name: 'Acme', plan: 'PROFESSIONAL', isActive: true },
        { id: 't-2', name: 'Beta Corp', plan: 'STARTER', isActive: false },
      ];
      mockPrisma.tenant.findMany.mockResolvedValueOnce(tenants);
      mockPrisma.tenant.count.mockResolvedValueOnce(2);

      const result = await service.getTenants(1, 20);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should filter tenants by plan', async () => {
      mockPrisma.tenant.findMany.mockResolvedValueOnce([]);
      mockPrisma.tenant.count.mockResolvedValueOnce(0);

      await service.getTenants(1, 20, undefined, SubscriptionPlan.ENTERPRISE);

      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ plan: SubscriptionPlan.ENTERPRISE }),
        }),
      );
    });

    it('should filter tenants by search query across name, slug, and domain', async () => {
      mockPrisma.tenant.findMany.mockResolvedValueOnce([]);
      mockPrisma.tenant.count.mockResolvedValueOnce(0);

      await service.getTenants(1, 20, 'acme');

      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'acme' }) }),
            ]),
          }),
        }),
      );
    });

    it('should calculate correct skip for page 2', async () => {
      mockPrisma.tenant.findMany.mockResolvedValueOnce([]);
      mockPrisma.tenant.count.mockResolvedValueOnce(25);

      const result = await service.getTenants(2, 10);

      expect(result.totalPages).toBe(3);
      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });
  });

  describe('getTenantDetails', () => {
    it('should return detailed tenant info with course and revenue stats', async () => {
      const tenant = {
        id: 't-1',
        name: 'Acme',
        subscription: { status: 'ACTIVE', currentPeriodEnd: new Date() },
        _count: { users: 50, schools: 2, universities: 1 },
      };
      mockPrisma.tenant.findUnique.mockResolvedValueOnce(tenant);
      mockPrisma.course.count.mockResolvedValueOnce(15);
      mockPrisma.courseProgress.count.mockResolvedValueOnce(300);
      mockPrisma.invoice.aggregate.mockResolvedValueOnce({ _sum: { amount: 4500 } });

      const result = await service.getTenantDetails('t-1');

      expect(result.name).toBe('Acme');
      expect(result.courseCount).toBe(15);
      expect(result.enrollmentCount).toBe(300);
      expect(result.totalRevenue).toBe(4500);
    });

    it('should throw NotFoundException when tenant does not exist', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce(null);

      await expect(service.getTenantDetails('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTenantLegacy', () => {
    it('should update tenant fields', async () => {
      const existing = { id: 't-1', name: 'Old Name', plan: 'STARTER', domain: null, isActive: true };
      const updated = { id: 't-1', name: 'New Name', plan: 'PROFESSIONAL' };
      mockPrisma.tenant.findUnique.mockResolvedValueOnce(existing);
      mockPrisma.tenant.update.mockResolvedValueOnce(updated);

      const result = await service.updateTenantLegacy('t-1', { name: 'New Name', plan: SubscriptionPlan.PROFESSIONAL }, 'admin-1');

      expect(result.name).toBe('New Name');
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 't-1' } }),
      );
    });

    it('should throw NotFoundException when tenant does not exist', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce(null);

      await expect(service.updateTenantLegacy('nonexistent', { name: 'X' }, 'admin-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteTenant', () => {
    it('should delete tenant when it exists', async () => {
      const existing = { id: 't-1', name: 'Acme', plan: 'STARTER' };
      mockPrisma.tenant.findUnique.mockResolvedValueOnce(existing);
      mockPrisma.tenant.delete.mockResolvedValueOnce(existing);

      await service.deleteTenant('t-1', 'admin-1');

      expect(mockPrisma.tenant.delete).toHaveBeenCalledWith({ where: { id: 't-1' } });
    });

    it('should throw NotFoundException when tenant does not exist', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce(null);

      await expect(service.deleteTenant('nonexistent', 'admin-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const users = [
        { id: 'u-1', firstName: 'Alice', lastName: 'Smith', email: 'alice@test.com', role: 'TEACHER' },
      ];
      mockPrisma.user.findMany.mockResolvedValueOnce(users);
      mockPrisma.user.count.mockResolvedValueOnce(1);

      const result = await service.getUsers(1, 20);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter users by role', async () => {
      mockPrisma.user.findMany.mockResolvedValueOnce([]);
      mockPrisma.user.count.mockResolvedValueOnce(0);

      await service.getUsers(1, 20, undefined, UserRole.TEACHER);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ role: UserRole.TEACHER }),
        }),
      );
    });

    it('should filter users by tenantId', async () => {
      mockPrisma.user.findMany.mockResolvedValueOnce([]);
      mockPrisma.user.count.mockResolvedValueOnce(0);

      await service.getUsers(1, 20, undefined, undefined, 'tenant-1');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-1' }),
        }),
      );
    });

    it('should filter users by search term', async () => {
      mockPrisma.user.findMany.mockResolvedValueOnce([]);
      mockPrisma.user.count.mockResolvedValueOnce(0);

      await service.getUsers(1, 20, 'alice');

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ email: expect.objectContaining({ contains: 'alice' }) }),
            ]),
          }),
        }),
      );
    });
  });

  describe('updateUserLegacy', () => {
    it('should update user role and active status', async () => {
      const existing = { id: 'u-1', role: 'STUDENT', isActive: true, tenantId: 'tenant-1' };
      const updated = { id: 'u-1', role: 'TEACHER', isActive: false };
      mockPrisma.user.findUnique.mockResolvedValueOnce(existing);
      mockPrisma.user.update.mockResolvedValueOnce(updated);

      const result = await service.updateUserLegacy('u-1', { role: UserRole.TEACHER, isActive: false }, 'admin-1');

      expect(result.role).toBe('TEACHER');
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.updateUserLegacy('nonexistent', { isActive: false }, 'admin-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBillingOverview', () => {
    it('should return billing stats with plan breakdown', async () => {
      mockPrisma.invoice.aggregate.mockResolvedValueOnce({ _sum: { amount: 12000 }, _count: { id: 40 } });
      mockPrisma.invoice.groupBy.mockResolvedValueOnce([]);
      mockPrisma.subscription.groupBy
        .mockResolvedValueOnce([{ plan: 'PROFESSIONAL', _count: { plan: 8 } }])
        .mockResolvedValueOnce([{ status: 'ACTIVE', _count: { status: 8 } }]);
      mockPrisma.invoice.findMany.mockResolvedValueOnce([]);

      const result = await service.getBillingOverview();

      expect(result.totalRevenue).toBe(12000);
      expect(result.totalInvoices).toBe(40);
      expect(result.planRevenue).toHaveLength(1);
      expect(result.subscriptionStats).toHaveLength(1);
    });

    it('should return zero revenue when no paid invoices exist', async () => {
      mockPrisma.invoice.aggregate.mockResolvedValueOnce({ _sum: { amount: null }, _count: { id: 0 } });
      mockPrisma.invoice.groupBy.mockResolvedValueOnce([]);
      mockPrisma.subscription.groupBy.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      mockPrisma.invoice.findMany.mockResolvedValueOnce([]);

      const result = await service.getBillingOverview();

      expect(result.totalRevenue).toBe(0);
    });
  });

  describe('impersonate', () => {
    it('should return an access token for a valid user', async () => {
      const user = {
        id: 'u-1',
        email: 'alice@test.com',
        tenantId: 'tenant-1',
        role: 'TEACHER',
        firstName: 'Alice',
        lastName: 'Smith',
        mfaEnabled: false,
        tenant: { name: 'Acme School', slug: 'acme' },
      };
      mockPrisma.user.findUnique.mockResolvedValueOnce(user);
      mockJwt.sign.mockReturnValueOnce('impersonate-token');

      const result = await service.impersonate('u-1');

      expect(result.accessToken).toBe('impersonate-token');
      expect(result.user.impersonatedBy).toBe('SUPER_ADMIN');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'u-1', impersonatedBy: 'SUPER_ADMIN' }),
        expect.objectContaining({ secret: 'test-secret', expiresIn: '1h' }),
      );
    });

    it('should throw NotFoundException when target user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.impersonate('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSystemHealth', () => {
    it('should return healthy status when DB is reachable', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
      mockPrisma.auditLog.count.mockResolvedValueOnce(500);

      const result = await service.getSystemHealth();

      expect(result.database).toBe('healthy');
      expect(result.totalAuditLogs).toBe(500);
      expect(result.timestamp).toBeDefined();
    });

    it('should return unhealthy status when DB query fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('Connection refused'));
      mockPrisma.auditLog.count.mockResolvedValueOnce(0);

      const result = await service.getSystemHealth();

      expect(result.database).toBe('unhealthy');
    });
  });
});
