import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';

import { ApiEcosystemService } from '../../api-ecosystem/api-ecosystem.service';
import { RedisService } from '../../cache/redis.service';
import { PrismaService } from '../../database/prisma.service';
import { BillingService } from '../billing.service';

const mockPrisma = {
  subscription: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  tenant: { findUnique: jest.fn(), update: jest.fn() },
  user: { findUnique: jest.fn() },
  invoice: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  coupon: { findUnique: jest.fn(), update: jest.fn() },
  course: { findUnique: jest.fn() },
  student: { findFirst: jest.fn() },
  courseProgress: { findUnique: jest.fn() },
  $transaction: jest.fn((ops: any) => Promise.all(ops)),
};

const mockConfig = {
  get: jest.fn((key: string, defaultVal?: string) => {
    const map: Record<string, string> = {
      STRIPE_SECRET_KEY: 'sk_test_mock',
      STRIPE_WEBHOOK_SECRET: 'whsec_mock',
      STRIPE_CURRENCY: 'usd',
    };
    return map[key] ?? defaultVal ?? '';
  }),
};

const mockStripe = {
  customers: {
    create: jest.fn().mockResolvedValue({ id: 'cus_mock123' }),
    retrieve: jest.fn(),
  },
  subscriptions: {
    create: jest.fn().mockResolvedValue({
      id: 'sub_mock123',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      latest_invoice: { payment_intent: { client_secret: 'pi_secret_mock' } },
      metadata: {},
    }),
    update: jest.fn().mockResolvedValue({ id: 'sub_mock123', cancel_at_period_end: true }),
    cancel: jest.fn().mockResolvedValue({ id: 'sub_mock123', status: 'canceled' }),
  },
  billingPortal: {
    sessions: {
      create: jest.fn().mockResolvedValue({ url: 'https://billing.stripe.com/session/mock' }),
    },
  },
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({ id: 'cs_mock123', url: 'https://checkout.stripe.com/session/mock' }),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('stripe', () => ({ __esModule: true, default: jest.fn().mockImplementation(() => mockStripe) }));

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn(),
  del: jest.fn(),
  delPattern: jest.fn(),
};

const mockApiEcosystem = { deliverWebhook: jest.fn().mockResolvedValue(undefined) };

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
        { provide: RedisService, useValue: mockRedis },
        { provide: ApiEcosystemService, useValue: mockApiEcosystem },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    jest.clearAllMocks();
  });

  // ─── subscribe (creates Stripe Checkout Session) ────────────────────────

  describe('subscribe', () => {
    const SUCCESS_URL = 'https://app.example.com/billing/success';
    const CANCEL_URL = 'https://app.example.com/billing/cancel';

    it('should create a new Stripe customer when none exists and return checkoutUrl', async () => {
      const mockTenant = {
        id: 'tenant-1',
        name: 'Test School',
        plan: 'FREE_TRIAL',
        subscription: null,
      };
      const mockUser = { id: 'user-1', email: 'admin@test.com' };

      mockPrisma.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await service.subscribe(
        'tenant-1',
        'PROFESSIONAL' as any,
        'user-1',
        SUCCESS_URL,
        CANCEL_URL,
      );

      expect(mockStripe.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      );
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'subscription' }),
      );
      expect(result).toHaveProperty('checkoutUrl');
    });

    it('should reuse existing Stripe customer and not call customers.create', async () => {
      const mockTenant = {
        id: 'tenant-1',
        name: 'Test School',
        plan: 'FREE_TRIAL',
        subscription: { stripeCustomerId: 'cus_existing' },
      };
      const mockUser = { id: 'user-1', email: 'admin@test.com' };

      mockPrisma.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      await service.subscribe(
        'tenant-1',
        'PROFESSIONAL' as any,
        'user-1',
        SUCCESS_URL,
        CANCEL_URL,
      );

      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when tenant does not exist', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1' });

      await expect(
        service.subscribe('bad-tenant', 'PROFESSIONAL' as any, 'user-1', SUCCESS_URL, CANCEL_URL),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for FREE_TRIAL plan (no price ID)', async () => {
      const mockTenant = { id: 'tenant-1', name: 'Test', plan: 'FREE_TRIAL', subscription: null };
      const mockUser = { id: 'user-1', email: 'admin@test.com' };

      mockPrisma.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      await expect(
        service.subscribe('tenant-1', 'FREE_TRIAL' as any, 'user-1', SUCCESS_URL, CANCEL_URL),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelSubscription', () => {
    it('should schedule cancellation at period end', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValueOnce({
        id: 'billing-1',
        stripeSubscriptionId: 'sub_mock123',
        status: 'ACTIVE',
        tenantId: 'tenant-1',
      });
      mockPrisma.subscription.update.mockResolvedValueOnce({
        id: 'billing-1',
        cancelAtPeriodEnd: true,
      });

      await service.cancelSubscription('tenant-1');

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_mock123', {
        cancel_at_period_end: true,
      });
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        data: { cancelAtPeriodEnd: true },
      });
    });

    it('should throw NotFoundException when no active subscription exists', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValueOnce(null);

      await expect(service.cancelSubscription('tenant-1')).rejects.toThrow(
        new NotFoundException('No active subscription found'),
      );
    });
  });

  describe('createPortalSession', () => {
    it('should return Stripe portal URL', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValueOnce({
        id: 'billing-1',
        stripeCustomerId: 'cus_mock123',
      });

      const result = await service.createPortalSession('tenant-1', 'https://app.example.com/billing');

      expect(result).toBe('https://billing.stripe.com/session/mock');
    });
  });

  describe('applyCoupon', () => {
    const validCoupon = {
      id: 'coupon-1',
      code: 'SAVE10',
      isActive: true,
      validFrom: new Date(0),
      validUntil: null,
      maxUses: null,
      usedCount: 0,
      discountType: 'PERCENTAGE',
      discountValue: 10,
      stripeCouponId: null,
    };

    it('should throw NotFoundException when coupon does not exist', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValueOnce(null);

      await expect(service.applyCoupon('tenant-1', 'INVALID')).rejects.toThrow(
        new NotFoundException('Coupon not found'),
      );
    });

    it('should throw BadRequestException when coupon is inactive', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValueOnce({ ...validCoupon, isActive: false });

      await expect(service.applyCoupon('tenant-1', 'SAVE10')).rejects.toThrow(
        new BadRequestException('Coupon is no longer active'),
      );
    });

    it('should throw BadRequestException when coupon has expired', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValueOnce({
        ...validCoupon,
        validUntil: new Date(Date.now() - 10000),
      });

      await expect(service.applyCoupon('tenant-1', 'SAVE10')).rejects.toThrow(
        new BadRequestException('Coupon has expired'),
      );
    });

    it('should throw BadRequestException when coupon usage limit is reached', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValueOnce({
        ...validCoupon,
        usedCount: 5,
        maxUses: 5,
      });

      await expect(service.applyCoupon('tenant-1', 'SAVE10')).rejects.toThrow(
        new BadRequestException('Coupon usage limit reached'),
      );
    });

    it('should successfully apply coupon and return discount info', async () => {
      mockPrisma.coupon.findUnique.mockResolvedValueOnce(validCoupon);
      mockPrisma.subscription.findUnique.mockResolvedValueOnce(null);
      mockPrisma.coupon.update.mockResolvedValueOnce({ ...validCoupon, usedCount: 1 });

      const result = await service.applyCoupon('tenant-1', 'SAVE10');

      expect(mockPrisma.coupon.update).toHaveBeenCalledWith({
        where: { code: 'SAVE10' },
        data: { usedCount: { increment: 1 } },
      });
      expect(result).toEqual({
        couponCode: 'SAVE10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        message: 'Coupon applied successfully',
      });
    });

    it('should apply coupon to Stripe subscription when both stripeSubscriptionId and stripeCouponId exist', async () => {
      const couponWithStripe = { ...validCoupon, stripeCouponId: 'stripe_coupon_abc' };
      mockPrisma.coupon.findUnique.mockResolvedValueOnce(couponWithStripe);
      mockPrisma.subscription.findUnique.mockResolvedValueOnce({
        id: 'billing-1',
        stripeSubscriptionId: 'sub_mock123',
        tenantId: 'tenant-1',
      });
      mockPrisma.coupon.update.mockResolvedValueOnce({ ...couponWithStripe, usedCount: 1 });

      await service.applyCoupon('tenant-1', 'SAVE10');

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_mock123', {
        coupon: 'stripe_coupon_abc',
      });
    });
  });

  describe('getInvoices', () => {
    it('should throw NotFoundException when no subscription exists', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValueOnce(null);

      await expect(service.getInvoices('tenant-1')).rejects.toThrow(
        new NotFoundException('No subscription found'),
      );
    });

    it('should return paginated invoices with metadata', async () => {
      const mockSubscription = { id: 'billing-1', tenantId: 'tenant-1' };
      const mockInvoices = [
        { id: 'inv-1', amount: 99, subscriptionId: 'billing-1' },
        { id: 'inv-2', amount: 99, subscriptionId: 'billing-1' },
      ];

      mockPrisma.subscription.findUnique.mockResolvedValueOnce(mockSubscription);
      mockPrisma.invoice.findMany.mockResolvedValueOnce(mockInvoices);
      mockPrisma.invoice.count.mockResolvedValueOnce(10);

      const result = await service.getInvoices('tenant-1', 2, 2);

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { subscriptionId: 'billing-1' },
          skip: 2,
          take: 2,
        }),
      );
      expect(result).toEqual({
        invoices: mockInvoices,
        total: 10,
        page: 2,
        limit: 2,
        totalPages: 5,
      });
    });
  });

  describe('createCourseCheckoutSession', () => {
    it('should throw NotFoundException when course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValueOnce(null);
      mockPrisma.student.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.createCourseCheckoutSession('user-1', 'course-404', 'https://success.url', 'https://cancel.url'),
      ).rejects.toThrow(new NotFoundException('Course not found'));
    });

    it('should throw ConflictException when student is already enrolled in the course', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'Advanced TypeScript',
        description: 'Deep dive into TypeScript',
        price: 49.99,
        tenantId: 'tenant-1',
      };
      const mockStudent = { id: 'student-1', userId: 'user-1' };
      const mockEnrollment = { studentId: 'student-1', courseId: 'course-1' };

      mockPrisma.course.findUnique.mockResolvedValueOnce(mockCourse);
      mockPrisma.student.findFirst.mockResolvedValueOnce(mockStudent);
      mockPrisma.courseProgress.findUnique.mockResolvedValueOnce(mockEnrollment);

      await expect(
        service.createCourseCheckoutSession('user-1', 'course-1', 'https://success.url', 'https://cancel.url'),
      ).rejects.toThrow(new ConflictException('Already enrolled in this course'));
    });

    it('should return checkoutUrl and sessionId on success', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'Advanced TypeScript',
        description: 'Deep dive into TypeScript',
        price: 49.99,
        tenantId: 'tenant-1',
      };

      mockPrisma.course.findUnique.mockResolvedValueOnce(mockCourse);
      mockPrisma.student.findFirst.mockResolvedValueOnce(null);

      const result = await service.createCourseCheckoutSession(
        'user-1',
        'course-1',
        'https://success.url',
        'https://cancel.url',
      );

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          metadata: { userId: 'user-1', courseId: 'course-1' },
        }),
      );
      expect(result).toEqual({
        checkoutUrl: 'https://checkout.stripe.com/session/mock',
        sessionId: 'cs_mock123',
      });
    });
  });

  describe('getCurrentSubscription', () => {
    it('should return subscription with invoices from prisma', async () => {
      const mockSubscription = {
        id: 'billing-1',
        tenantId: 'tenant-1',
        plan: 'PROFESSIONAL',
        status: 'ACTIVE',
        invoices: [{ id: 'inv-1', amount: 99 }],
      };

      mockPrisma.subscription.findUnique.mockResolvedValueOnce(mockSubscription);

      const result = await service.getCurrentSubscription('tenant-1');

      expect(mockPrisma.subscription.findUnique).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        include: {
          invoices: { orderBy: { issuedAt: 'desc' }, take: 10 },
        },
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should return null when tenant has no subscription', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValueOnce(null);

      const result = await service.getCurrentSubscription('tenant-1');

      expect(result).toBeNull();
    });
  });

  // ─── getRevenueAnalytics ──────────────────────────────────────────────────

  describe('getRevenueAnalytics', () => {
    beforeEach(() => {
      // Provide defaults for all queries used in getRevenueAnalytics
      mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { amount: 9900 } });
      mockPrisma.invoice.findMany.mockResolvedValue([]);
      mockPrisma.subscription.findMany.mockResolvedValue([
        { plan: 'PROFESSIONAL' },
        { plan: 'STARTER' },
      ]);
      mockPrisma.subscription.groupBy.mockResolvedValue([
        { plan: 'PROFESSIONAL', _count: { plan: 1 } },
        { plan: 'STARTER', _count: { plan: 1 } },
      ]);
      mockPrisma.subscription.count.mockResolvedValue(1);
    });

    it('should return totalRevenue, mrr, arr, churnLast30Days and planDistribution', async () => {
      const result = await service.getRevenueAnalytics();

      expect(result).toHaveProperty('totalRevenue');
      expect(result).toHaveProperty('mrr');
      expect(result).toHaveProperty('arr');
      expect(result.arr).toBe(result.mrr * 12);
      expect(result).toHaveProperty('churnLast30Days');
      expect(result).toHaveProperty('planDistribution');
      expect(Array.isArray(result.planDistribution)).toBe(true);
    });

    it('should compute MRR as sum of active subscription plan prices', async () => {
      // Two active subscriptions: PROFESSIONAL ($79) + STARTER ($29) = $108
      mockPrisma.subscription.findMany.mockResolvedValueOnce([
        { plan: 'PROFESSIONAL' },
        { plan: 'STARTER' },
      ]);

      const result = await service.getRevenueAnalytics();

      expect(result.mrr).toBe(108);
    });

    it('should filter by tenantId when provided', async () => {
      await service.getRevenueAnalytics('tenant-1');

      expect(mockPrisma.invoice.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ subscription: { tenantId: 'tenant-1' } }),
        }),
      );
    });

    it('should include monthlyRevenue array sorted by month', async () => {
      const now = new Date();
      mockPrisma.invoice.findMany.mockResolvedValueOnce([
        {
          amount: 79,
          currency: 'USD',
          paidAt: new Date(now.getFullYear(), now.getMonth() - 1, 15),
        },
        {
          amount: 29,
          currency: 'USD',
          paidAt: new Date(now.getFullYear(), now.getMonth(), 5),
        },
      ]);

      const result = await service.getRevenueAnalytics();

      expect(Array.isArray(result.monthlyRevenue)).toBe(true);
      expect(result.monthlyRevenue.length).toBeGreaterThanOrEqual(1);
      // Sorted ascending by month string
      const months = result.monthlyRevenue.map(m => m.month);
      expect(months).toEqual([...months].sort());
    });
  });

  // ─── createPortalSession error case ──────────────────────────────────────

  describe('createPortalSession — error path', () => {
    it('should throw NotFoundException when no billing account exists', async () => {
      mockPrisma.subscription.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.createPortalSession('tenant-1', 'https://app.example.com/billing'),
      ).rejects.toThrow(new NotFoundException('No billing account found'));
    });
  });
});
