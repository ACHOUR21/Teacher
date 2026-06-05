import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BillingService } from '../billing.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../cache/redis.service';

const mockPrisma = {
  subscription: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  tenant: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  invoice: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  coupon: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((cb: any) => cb(mockPrisma)),
};

const mockConfig = {
  get: jest.fn((key: string, defaultVal?: string) => {
    const map: Record<string, string> = {
      STRIPE_SECRET_KEY: 'sk_test_mock',
      STRIPE_WEBHOOK_SECRET: 'whsec_mock',
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
      latest_invoice: {
        payment_intent: { client_secret: 'pi_secret_mock' },
      },
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

describe('BillingService', () => {
  let service: BillingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    jest.clearAllMocks();
  });

  describe('subscribe', () => {
    it('should create a Stripe customer and subscription', async () => {
      const mockTenant = {
        id: 'tenant-1',
        name: 'Test School',
        plan: 'FREE_TRIAL',
        subscription: null,
      };
      const mockUser = { id: 'user-1', email: 'admin@test.com' };

      mockPrisma.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrisma.subscription.upsert.mockResolvedValueOnce({
        id: 'billing-1',
        plan: 'PROFESSIONAL',
        status: 'ACTIVE',
        tenantId: 'tenant-1',
      });
      mockPrisma.tenant.update.mockResolvedValueOnce({ ...mockTenant, plan: 'PROFESSIONAL' });

      const result = await service.subscribe('tenant-1', 'PROFESSIONAL' as any, 'user-1');

      expect(mockStripe.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      );
      expect(mockStripe.subscriptions.create).toHaveBeenCalled();
      expect(result).toHaveProperty('subscription');
    });

    it('should use existing Stripe customer if already created', async () => {
      const mockTenant = {
        id: 'tenant-1',
        name: 'Test School',
        plan: 'FREE_TRIAL',
        subscription: { stripeCustomerId: 'cus_existing' },
      };
      const mockUser = { id: 'user-1', email: 'admin@test.com' };

      mockPrisma.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrisma.subscription.upsert.mockResolvedValueOnce({
        id: 'billing-1',
        plan: 'PROFESSIONAL',
        status: 'ACTIVE',
        tenantId: 'tenant-1',
      });
      mockPrisma.tenant.update.mockResolvedValueOnce({ ...mockTenant, plan: 'PROFESSIONAL' });

      await service.subscribe('tenant-1', 'PROFESSIONAL' as any, 'user-1');

      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });
  });

  describe('cancelSubscription', () => {
    it('should schedule cancellation of active subscription', async () => {
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
});
