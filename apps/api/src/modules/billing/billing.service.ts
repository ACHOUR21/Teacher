import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import Stripe from 'stripe';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import Decimal from 'decimal.js';

const PLAN_PRICES: Record<SubscriptionPlan, string> = {
  FREE_TRIAL: '',
  STARTER: 'price_starter_monthly',
  PROFESSIONAL: 'price_professional_monthly',
  BUSINESS: 'price_business_monthly',
  ENTERPRISE: 'price_enterprise_monthly',
  LIFETIME: 'price_lifetime_once',
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY', 'sk_test_placeholder'),
      { apiVersion: '2024-04-10' as Stripe.LatestApiVersion },
    );
  }

  async subscribe(tenantId: string, plan: SubscriptionPlan, userId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Get or create Stripe customer
    let stripeCustomerId = tenant.subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: tenant.name,
        metadata: { tenantId, userId },
      });
      stripeCustomerId = customer.id;
    }

    const priceId = PLAN_PRICES[plan];
    if (!priceId) throw new BadRequestException('Invalid plan or plan requires manual setup');

    // Create subscription
    const stripeSubscription = await this.stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: { tenantId, plan },
    });

    const now = new Date();
    const periodEnd = new Date(stripeSubscription.current_period_end * 1000);

    const subscription = await this.prisma.subscription.upsert({
      where: { tenantId },
      update: {
        plan,
        status: SubscriptionStatus.ACTIVE,
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      create: {
        tenantId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    await this.prisma.tenant.update({ where: { id: tenantId }, data: { plan } });
    await this.redis.delPattern(`tenant:${tenantId}*`);

    const invoice = stripeSubscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    return {
      subscription,
      clientSecret: paymentIntent?.client_secret,
      stripeSubscriptionId: stripeSubscription.id,
    };
  }

  async createPortalSession(tenantId: string, returnUrl: string): Promise<string> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });
    if (!subscription?.stripeCustomerId) {
      throw new NotFoundException('No billing account found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  async cancelSubscription(tenantId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });
    if (!subscription?.stripeSubscriptionId) {
      throw new NotFoundException('No active subscription found');
    }

    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.prisma.subscription.update({
      where: { tenantId },
      data: { cancelAtPeriodEnd: true },
    });

    this.logger.log(`Subscription cancellation scheduled for tenant ${tenantId}`);
  }

  async applyCoupon(tenantId: string, couponCode: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: couponCode } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (!coupon.isActive) throw new BadRequestException('Coupon is no longer active');

    const now = new Date();
    if (now < coupon.validFrom) throw new BadRequestException('Coupon is not yet valid');
    if (coupon.validUntil && now > coupon.validUntil) throw new BadRequestException('Coupon has expired');
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new BadRequestException('Coupon usage limit reached');

    const subscription = await this.prisma.subscription.findUnique({ where: { tenantId } });

    // Apply to Stripe subscription if exists
    if (subscription?.stripeSubscriptionId && coupon.stripeCouponId) {
      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        coupon: coupon.stripeCouponId,
      });
    }

    // Increment usage
    await this.prisma.coupon.update({
      where: { code: couponCode },
      data: { usedCount: { increment: 1 } },
    });

    return {
      couponCode,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      message: 'Coupon applied successfully',
    };
  }

  async getInvoices(tenantId: string, page = 1, limit = 20) {
    const subscription = await this.prisma.subscription.findUnique({ where: { tenantId } });
    if (!subscription) throw new NotFoundException('No subscription found');

    const skip = (page - 1) * limit;
    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { subscriptionId: subscription.id },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where: { subscriptionId: subscription.id } }),
    ]);

    return { invoices, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createCourseCheckoutSession(
    userId: string,
    courseId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    const [course, student] = await Promise.all([
      this.prisma.course.findUnique({ where: { id: courseId } }),
      this.prisma.student.findFirst({ where: { userId } }),
    ]);
    if (!course) throw new NotFoundException('Course not found');

    if (student) {
      const enrolled = await this.prisma.courseProgress.findUnique({
        where: { studentId_courseId: { studentId: student.id, courseId } },
      });
      if (enrolled) throw new ConflictException('Already enrolled in this course');
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: this.configService.get<string>('STRIPE_CURRENCY', 'usd'),
            product_data: {
              name: course.title,
              description: course.description ?? undefined,
              images: (course as any).thumbnailUrl ? [(course as any).thumbnailUrl] : undefined,
            },
            unit_amount: Math.round(Number(course.price) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { userId, courseId },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
    });

    return { checkoutUrl: session.url, sessionId: session.id };
  }

  async getCurrentSubscription(tenantId: string) {
    return this.prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        invoices: { orderBy: { issuedAt: 'desc' }, take: 10 },
      },
    });
  }

  async handleStripeWebhook(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET', '');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${(err as Error).message}`);
    }

    this.logger.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.trial_will_end':
        await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription) return;
    const subscription = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });
    if (!subscription) return;

    const amountValue = invoice.amount_paid / 100;
    await this.prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        amount: new Decimal(amountValue),
        currency: invoice.currency.toUpperCase(),
        status: 'COMPLETED',
        stripeInvoiceId: invoice.id,
        pdf: invoice.invoice_pdf || undefined,
        paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
      },
    });

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.ACTIVE },
    });

    this.logger.log(`Invoice paid for subscription ${subscription.id}`);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription) return;
    const subscription = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string },
    });
    if (!subscription) return;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.PAST_DUE },
    });

    this.logger.warn(`Payment failed for subscription ${subscription.id}`);
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });
    if (!subscription) return;

    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELLED,
      trialing: SubscriptionStatus.TRIALING,
      unpaid: SubscriptionStatus.INACTIVE,
    };

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: statusMap[stripeSubscription.status] || SubscriptionStatus.INACTIVE,
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      },
    });

    await this.redis.delPattern(`tenant:${subscription.tenantId}*`);
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });
    if (!subscription) return;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.CANCELLED },
    });

    await this.prisma.tenant.update({
      where: { id: subscription.tenantId },
      data: { plan: SubscriptionPlan.FREE_TRIAL },
    });

    await this.redis.delPattern(`tenant:${subscription.tenantId}*`);
    this.logger.log(`Subscription cancelled for tenant ${subscription.tenantId}`);
  }

  private async handleTrialWillEnd(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });
    if (!subscription) {
      return;
    }
    // In production: send notification email to tenant admin
    this.logger.log(`Trial ending soon for tenant ${subscription.tenantId}`);
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const { userId, courseId } = session.metadata ?? {};
    if (!userId || !courseId) return;
    if (session.payment_status !== 'paid') return;

    const student = await this.prisma.student.findFirst({ where: { userId } });
    if (!student) {
      this.logger.warn(`checkout.session.completed: no student profile for user ${userId}`);
      return;
    }

    const existing = await this.prisma.courseProgress.findUnique({
      where: { studentId_courseId: { studentId: student.id, courseId } },
    });
    if (existing) return;

    await this.prisma.$transaction([
      this.prisma.courseProgress.create({ data: { studentId: student.id, courseId } }),
      this.prisma.course.update({ where: { id: courseId }, data: { enrollCount: { increment: 1 } } }),
    ]);

    this.logger.log(`Course enrollment via Stripe checkout: user=${userId}, course=${courseId}`);
  }

  // PayPal integration stub
  async createPayPalOrder(tenantId: string, plan: SubscriptionPlan): Promise<{ orderId: string; approvalUrl: string }> {
    this.logger.log(`PayPal order creation for tenant ${tenantId}, plan ${plan}`);
    // PayPal SDK integration would go here
    return {
      orderId: 'PAYPAL_ORDER_PLACEHOLDER',
      approvalUrl: 'https://www.paypal.com/checkoutnow?token=PAYPAL_ORDER_PLACEHOLDER',
    };
  }

  async capturePayPalOrder(tenantId: string, orderId: string, plan: SubscriptionPlan): Promise<void> {
    this.logger.log(`PayPal capture for tenant ${tenantId}, order ${orderId}, plan ${plan}`);
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.subscription.upsert({
      where: { tenantId },
      update: {
        plan,
        status: SubscriptionStatus.ACTIVE,
        paypalSubscriptionId: orderId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      create: {
        tenantId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        paypalSubscriptionId: orderId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    await this.prisma.tenant.update({ where: { id: tenantId }, data: { plan } });
    await this.redis.delPattern(`tenant:${tenantId}*`);
  }
}
