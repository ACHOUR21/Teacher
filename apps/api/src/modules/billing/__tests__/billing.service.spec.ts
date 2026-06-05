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
  invoice: {
    create: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  coupon: { findFirst: jest.fn() },
  $transaction: jest.fn((cb: any) => cb(mockPrisma)),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      STRIPE_SECRET_KEY: 'sk_test_mock',
      STRIPE_WEBHOOK_SECRET: 'whsec_mock',
    };
    return map[key] ?? '';
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
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      items: { data: [{ price: { id: 'price_mock', unit_amount: 7900, currency: 'usd' } }] },
    }),
    update: jest.fn(),
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

const mockRedis = { get: jest.fn().mockResolvedValue(null), set: jest.fn(), del: jest.fn() };

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

  describe('createSubscription', () => {
    it('should create a Stripe customer and subscription', async () => {
      const mockTenant = {
        id: 'tenant-1',
        name: 'Test School',
        stripeCustomerId: null,
      };

      mockPrisma.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      mockPrisma.tenant.update.mockResolvedValueOnce({ ...mockTenant, stripeCustomerId: 'cus_mock123' });
      mockPrisma.subscription.upsert.mockResolvedValueOnce({
        id: 'billing-1',
        plan: 'PROFESSIONAL',
        status: 'ACTIVE',
        tenantId: 'tenant-1',
      });

      const result = await service.createSubscription('tenant-1', {
        plan: 'PROFESSIONAL' as any,
        paymentMethodId: 'pm_test_mock',
      });

      expect(mockStripe.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: { tenantId: 'tenant-1' } }),
      );
      expect(mockStripe.subscriptions.create).toHaveBeenCalled();
    });

    it('should use existing Stripe customer if already created', async () => {
      const mockTenant = {
        id: 'tenant-1',
        name: 'Test School',
        stripeCustomerId: 'cus_existing',
      };

      mockPrisma.tenant.findUnique.mockResolvedValueOnce(mockTenant);
      mockPrisma.subscription.upsert.mockResolvedValueOnce({
        id: 'billing-1',
        plan: 'PROFESSIONAL',
        status: 'ACTIVE',
        tenantId: 'tenant-1',
      });

      await service.createSubscription('tenant-1', {
        plan: 'PROFESSIONAL' as any,
        paymentMethodId: 'pm_test_mock',
      });

      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel active subscription', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValueOnce({
        id: 'billing-1',
        stripeSubscriptionId: 'sub_mock123',
        status: 'ACTIVE',
        tenantId: 'tenant-1',
      });
      mockPrisma.subscription.update.mockResolvedValueOnce({
        id: 'billing-1',
        status: 'CANCELED',
      });

      const result = await service.cancelSubscription('tenant-1');

      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_mock123');
    });
  });

  describe('getBillingPortalUrl', () => {
    it('should return Stripe portal URL', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({
        id: 'tenant-1',
        stripeCustomerId: 'cus_mock123',
      });

      const result = await service.getBillingPortalUrl('tenant-1', 'https://app.example.com/billing');

      expect(result.url).toBe('https://billing.stripe.com/session/mock');
    });
  });
});
