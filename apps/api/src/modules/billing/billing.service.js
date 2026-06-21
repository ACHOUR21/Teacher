"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BillingService = void 0;
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _client = require("@prisma/client");
var _decimal = _interopRequireDefault(require("decimal.js"));
var _stripe = _interopRequireDefault(require("stripe"));
var _apiEcosystem = require("../api-ecosystem/api-ecosystem.service");
var _redis = require("../cache/redis.service");
var _prisma = require("../database/prisma.service");
var _email = require("../notifications/email/email.service");
var _notifications = require("../notifications/notifications.service");
var _planFeatures = require("./domain/plan-features");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
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
var BillingService_1;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/require-await */

const PLAN_PRICES = {
  FREE_TRIAL: '',
  STARTER: 'price_starter_monthly',
  PROFESSIONAL: 'price_professional_monthly',
  BUSINESS: 'price_business_monthly',
  ENTERPRISE: 'price_enterprise_monthly',
  LIFETIME: 'price_lifetime_once'
};
let BillingService = exports.BillingService = BillingService_1 = class BillingService {
  logger = new _common.Logger(BillingService_1.name);
  stripe;
  constructor(prisma, redis, configService, apiEcosystem, notifications, emailService) {
    this.prisma = prisma;
    this.redis = redis;
    this.configService = configService;
    this.apiEcosystem = apiEcosystem;
    this.notifications = notifications;
    this.emailService = emailService;
    this.stripe = new _stripe.default(this.configService.get('STRIPE_SECRET_KEY', 'sk_test_placeholder'), {
      apiVersion: '2024-04-10'
    });
  }
  // ------------------------------------------------------------------ subscribe
  /**
   * Creates a Stripe Checkout Session (subscription mode) and returns the redirect URL.
   * The DB subscription record is written only after the webhook confirms payment.
   */
  async subscribe(tenantId, plan, userId, successUrl, cancelUrl) {
    const [tenant, user] = await Promise.all([this.prisma.tenant.findUnique({
      where: {
        id: tenantId
      },
      include: {
        subscription: true
      }
    }), this.prisma.user.findUnique({
      where: {
        id: userId
      }
    })]);
    if (!tenant) {
      throw new _common.NotFoundException('Tenant not found');
    }
    if (!user) {
      throw new _common.NotFoundException('User not found');
    }
    const priceId = PLAN_PRICES[plan];
    if (!priceId) {
      throw new _common.BadRequestException('Invalid plan or plan requires manual setup (Enterprise)');
    }
    // Get or create Stripe customer
    let stripeCustomerId = tenant.subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: tenant.name,
        metadata: {
          tenantId,
          userId
        }
      });
      stripeCustomerId = customer.id;
    }
    const isLifetime = plan === _client.SubscriptionPlan.LIFETIME;
    const session = await this.stripe.checkout.sessions.create({
      mode: isLifetime ? 'payment' : 'subscription',
      customer: stripeCustomerId,
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        tenantId,
        plan,
        userId
      },
      ...(!isLifetime && {
        subscription_data: {
          metadata: {
            tenantId,
            plan
          },
          // 14-day trial for STARTER
          trial_period_days: plan === _client.SubscriptionPlan.STARTER ? 14 : undefined
        }
      }),
      allow_promotion_codes: true
    });
    return {
      checkoutUrl: session.url
    };
  }
  // ------------------------------------------------------------------ portal / cancel
  async createPortalSession(tenantId, returnUrl) {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        tenantId
      }
    });
    if (!subscription?.stripeCustomerId) {
      throw new _common.NotFoundException('No billing account found');
    }
    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl
    });
    return session.url;
  }
  async cancelSubscription(tenantId) {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        tenantId
      }
    });
    if (!subscription?.stripeSubscriptionId) {
      throw new _common.NotFoundException('No active subscription found');
    }
    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true
    });
    await this.prisma.subscription.update({
      where: {
        tenantId
      },
      data: {
        cancelAtPeriodEnd: true
      }
    });
    this.logger.log(`Subscription cancellation scheduled for tenant ${tenantId}`);
  }
  // ------------------------------------------------------------------ coupons
  async applyCoupon(tenantId, couponCode) {
    const coupon = await this.prisma.coupon.findUnique({
      where: {
        code: couponCode
      }
    });
    if (!coupon) {
      throw new _common.NotFoundException('Coupon not found');
    }
    if (!coupon.isActive) {
      throw new _common.BadRequestException('Coupon is no longer active');
    }
    const now = new Date();
    if (now < coupon.validFrom) {
      throw new _common.BadRequestException('Coupon is not yet valid');
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      throw new _common.BadRequestException('Coupon has expired');
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new _common.BadRequestException('Coupon usage limit reached');
    }
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        tenantId
      }
    });
    if (subscription?.stripeSubscriptionId && coupon.stripeCouponId) {
      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        coupon: coupon.stripeCouponId
      });
    }
    await this.prisma.coupon.update({
      where: {
        code: couponCode
      },
      data: {
        usedCount: {
          increment: 1
        }
      }
    });
    return {
      couponCode,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      message: 'Coupon applied successfully'
    };
  }
  // ------------------------------------------------------------------ invoices
  async getInvoices(tenantId, page = 1, limit = 20) {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        tenantId
      }
    });
    if (!subscription) {
      throw new _common.NotFoundException('No subscription found');
    }
    const skip = (page - 1) * limit;
    const [invoices, total] = await Promise.all([this.prisma.invoice.findMany({
      where: {
        subscriptionId: subscription.id
      },
      orderBy: {
        issuedAt: 'desc'
      },
      skip,
      take: limit
    }), this.prisma.invoice.count({
      where: {
        subscriptionId: subscription.id
      }
    })]);
    return {
      invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  async getCurrentSubscription(tenantId) {
    return this.prisma.subscription.findUnique({
      where: {
        tenantId
      },
      include: {
        invoices: {
          orderBy: {
            issuedAt: 'desc'
          },
          take: 10
        }
      }
    });
  }
  // ------------------------------------------------------------------ revenue analytics
  async getRevenueAnalytics(tenantId) {
    const whereClause = tenantId ? {
      subscription: {
        tenantId
      }
    } : {};
    // Total revenue
    const totalAgg = await this.prisma.invoice.aggregate({
      where: {
        ...whereClause,
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      }
    });
    // Revenue last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);
    const recentInvoices = await this.prisma.invoice.findMany({
      where: {
        ...whereClause,
        status: 'COMPLETED',
        paidAt: {
          gte: twelveMonthsAgo
        }
      },
      select: {
        amount: true,
        paidAt: true,
        currency: true
      }
    });
    // Group by month
    const monthlyRevenue = {};
    for (const inv of recentInvoices) {
      if (!inv.paidAt) {
        continue;
      }
      const key = `${inv.paidAt.getFullYear()}-${String(inv.paidAt.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[key] = (monthlyRevenue[key] ?? 0) + Number(inv.amount);
    }
    // MRR — sum plan prices of all ACTIVE subscriptions
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: _client.SubscriptionStatus.ACTIVE,
        ...(tenantId ? {
          tenantId
        } : {})
      },
      select: {
        plan: true
      }
    });
    const mrr = activeSubscriptions.reduce((acc, sub) => {
      return acc + (_planFeatures.PLAN_PRICE_CENTS[sub.plan] ?? 0) / 100;
    }, 0);
    // Plan distribution
    const planDistribution = await this.prisma.subscription.groupBy({
      by: ['plan'],
      ...(tenantId ? {
        where: {
          tenantId
        }
      } : {}),
      _count: {
        plan: true
      }
    });
    // Churn — subscriptions cancelled in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const churnCount = await this.prisma.subscription.count({
      where: {
        status: _client.SubscriptionStatus.CANCELLED,
        updatedAt: {
          gte: thirtyDaysAgo
        },
        ...(tenantId ? {
          tenantId
        } : {})
      }
    });
    return {
      totalRevenue: Number(totalAgg._sum.amount ?? 0),
      mrr,
      arr: mrr * 12,
      churnLast30Days: churnCount,
      monthlyRevenue: Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue
      })).sort((a, b) => a.month.localeCompare(b.month)),
      planDistribution: planDistribution.map(p => ({
        plan: p.plan,
        count: p._count.plan
      }))
    };
  }
  // ------------------------------------------------------------------ course checkout
  async createCourseCheckoutSession(userId, courseId, successUrl, cancelUrl) {
    const [course, student] = await Promise.all([this.prisma.course.findUnique({
      where: {
        id: courseId
      }
    }), this.prisma.student.findFirst({
      where: {
        userId
      }
    })]);
    if (!course) {
      throw new _common.NotFoundException('Course not found');
    }
    if (student) {
      const enrolled = await this.prisma.courseProgress.findUnique({
        where: {
          studentId_courseId: {
            studentId: student.id,
            courseId
          }
        }
      });
      if (enrolled) {
        throw new _common.ConflictException('Already enrolled in this course');
      }
    }
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: this.configService.get('STRIPE_CURRENCY', 'usd'),
          product_data: {
            name: course.title,
            description: course.description ?? undefined,
            images: course.thumbnailUrl ? [course.thumbnailUrl] : undefined
          },
          unit_amount: Math.round(Number(course.price) * 100)
        },
        quantity: 1
      }],
      metadata: {
        userId,
        courseId
      },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl
    });
    return {
      checkoutUrl: session.url,
      sessionId: session.id
    };
  }
  // ------------------------------------------------------------------ Stripe webhooks
  async handleStripeWebhook(payload, signature) {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET', '');
    let event;
    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new _common.BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }
    this.logger.log(`Stripe webhook received: ${event.type}`);
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'customer.subscription.trial_will_end':
        await this.handleTrialWillEnd(event.data.object);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }
  async handleCheckoutCompleted(session) {
    const {
      userId,
      courseId,
      tenantId,
      plan
    } = session.metadata ?? {};
    // --- subscription checkout ---
    if (session.mode === 'subscription' && tenantId && plan && session.subscription) {
      const stripeSubscriptionId = session.subscription;
      const stripeSub = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
      await this.prisma.subscription.upsert({
        where: {
          tenantId
        },
        update: {
          plan: plan,
          status: _client.SubscriptionStatus.ACTIVE,
          stripeCustomerId: session.customer,
          stripeSubscriptionId,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: false
        },
        create: {
          tenantId,
          plan: plan,
          status: _client.SubscriptionStatus.ACTIVE,
          stripeCustomerId: session.customer,
          stripeSubscriptionId,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000)
        }
      });
      await this.prisma.tenant.update({
        where: {
          id: tenantId
        },
        data: {
          plan: plan
        }
      });
      await this.redis.delPattern(`tenant:${tenantId}*`);
      // Notify admin
      if (userId) {
        await this.notifications?.notifyUser(userId, 'Subscription activated 🎉', `Your ${plan.replace('_', ' ')} plan is now active.`, {
          type: 'SUBSCRIPTION_ACTIVATED',
          plan,
          href: '/billing'
        }).catch(() => {});
      }
      this.logger.log(`Subscription checkout completed for tenant ${tenantId}, plan ${plan}`);
      return;
    }
    // --- lifetime payment checkout ---
    if (session.mode === 'payment' && tenantId && plan === 'LIFETIME' && session.payment_status === 'paid') {
      const now = new Date();
      await this.prisma.subscription.upsert({
        where: {
          tenantId
        },
        update: {
          plan: _client.SubscriptionPlan.LIFETIME,
          status: _client.SubscriptionStatus.ACTIVE,
          stripeCustomerId: session.customer,
          currentPeriodStart: now,
          currentPeriodEnd: new Date('2099-12-31')
        },
        create: {
          tenantId,
          plan: _client.SubscriptionPlan.LIFETIME,
          status: _client.SubscriptionStatus.ACTIVE,
          stripeCustomerId: session.customer,
          currentPeriodStart: now,
          currentPeriodEnd: new Date('2099-12-31')
        }
      });
      await this.prisma.tenant.update({
        where: {
          id: tenantId
        },
        data: {
          plan: _client.SubscriptionPlan.LIFETIME
        }
      });
      await this.redis.delPattern(`tenant:${tenantId}*`);
      return;
    }
    // --- course purchase ---
    if (userId && courseId && session.payment_status === 'paid') {
      const student = await this.prisma.student.findFirst({
        where: {
          userId
        }
      });
      if (!student) {
        return;
      }
      const existing = await this.prisma.courseProgress.findUnique({
        where: {
          studentId_courseId: {
            studentId: student.id,
            courseId
          }
        }
      });
      if (existing) {
        return;
      }
      await this.prisma.$transaction([this.prisma.courseProgress.create({
        data: {
          studentId: student.id,
          courseId
        }
      }), this.prisma.course.update({
        where: {
          id: courseId
        },
        data: {
          enrollCount: {
            increment: 1
          }
        }
      })]);
      this.prisma.course.findUnique({
        where: {
          id: courseId
        },
        select: {
          tenantId: true
        }
      }).then(course => {
        if (course?.tenantId) {
          this.apiEcosystem.deliverWebhook(course.tenantId, 'payment.completed', {
            sessionId: session.id,
            courseId,
            userId
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  }
  async handleInvoicePaid(invoice) {
    if (!invoice.subscription) {
      return;
    }
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        stripeSubscriptionId: invoice.subscription
      }
    });
    if (!subscription) {
      return;
    }
    await this.prisma.invoice.create({
      data: {
        subscriptionId: subscription.id,
        amount: new _decimal.default(invoice.amount_paid / 100),
        currency: invoice.currency.toUpperCase(),
        status: 'COMPLETED',
        stripeInvoiceId: invoice.id,
        pdf: invoice.invoice_pdf || undefined,
        paidAt: new Date((invoice.status_transitions.paid_at ?? Math.floor(Date.now() / 1000)) * 1000)
      }
    });
    await this.prisma.subscription.update({
      where: {
        id: subscription.id
      },
      data: {
        status: _client.SubscriptionStatus.ACTIVE
      }
    });
    // Send payment succeeded email to tenant admin
    if (this.emailService) {
      const adminUser = await this.prisma.user.findFirst({
        where: {
          tenantId: subscription.tenantId,
          role: 'ADMIN'
        },
        select: {
          email: true,
          firstName: true
        }
      });
      if (adminUser?.email) {
        const nextBillingDate = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'N/A';
        this.emailService.sendPaymentSucceeded(adminUser.email, {
          name: adminUser.firstName,
          plan: subscription.plan,
          amount: `$${(invoice.amount_paid / 100).toFixed(2)}`,
          invoiceUrl: invoice.invoice_pdf ?? `${this.configService.get('APP_URL', 'http://localhost:3000')}/billing/invoices`,
          nextBillingDate
        }).catch(() => null);
      }
    }
    // Clear any active dunning state on successful payment
    if (invoice.customer) {
      await this.clearDunning(invoice.customer);
    }
  }
  async handlePaymentFailed(invoice) {
    if (!invoice.subscription) {
      return;
    }
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        stripeSubscriptionId: invoice.subscription
      },
      include: {
        tenant: {
          include: {
            users: {
              where: {
                role: 'ADMIN'
              },
              take: 1
            }
          }
        }
      }
    });
    if (!subscription) {
      return;
    }
    await this.prisma.subscription.update({
      where: {
        id: subscription.id
      },
      data: {
        status: _client.SubscriptionStatus.PAST_DUE
      }
    });
    // Notify tenant admin
    const adminId = subscription.tenant?.users?.[0]?.id;
    if (adminId) {
      await this.notifications?.notifyUser(adminId, 'Payment failed ⚠️', 'Your last payment could not be processed. Please update your payment method to avoid service interruption.', {
        type: 'PAYMENT_FAILED',
        href: '/billing'
      }).catch(() => {});
    }
    // Send payment failed email
    if (this.emailService) {
      const adminUser = subscription.tenant?.users?.[0];
      if (adminUser?.email) {
        const retryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        this.emailService.sendPaymentFailed(adminUser.email, {
          name: adminUser.firstName ?? 'Admin',
          plan: subscription.plan,
          retryDate,
          updatePaymentUrl: `${this.configService.get('APP_URL', 'http://localhost:3000')}/billing/payment-method`
        }).catch(() => null);
      }
    }
    this.logger.warn(`Payment failed for subscription ${subscription.id}`);
    // Apply dunning schedule based on attempt count
    if (invoice.customer) {
      await this.applyDunning(invoice.customer, invoice.id, invoice.attempt_count ?? 1);
    }
  }
  async handleSubscriptionUpdated(stripeSubscription) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        stripeSubscriptionId: stripeSubscription.id
      }
    });
    if (!subscription) {
      return;
    }
    const statusMap = {
      active: _client.SubscriptionStatus.ACTIVE,
      past_due: _client.SubscriptionStatus.PAST_DUE,
      canceled: _client.SubscriptionStatus.CANCELLED,
      trialing: _client.SubscriptionStatus.TRIALING,
      unpaid: _client.SubscriptionStatus.INACTIVE
    };
    await this.prisma.subscription.update({
      where: {
        id: subscription.id
      },
      data: {
        status: statusMap[stripeSubscription.status] ?? _client.SubscriptionStatus.INACTIVE,
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
      }
    });
    await this.redis.delPattern(`tenant:${subscription.tenantId}*`);
  }
  async handleSubscriptionDeleted(stripeSubscription) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        stripeSubscriptionId: stripeSubscription.id
      }
    });
    if (!subscription) {
      return;
    }
    await this.prisma.subscription.update({
      where: {
        id: subscription.id
      },
      data: {
        status: _client.SubscriptionStatus.CANCELLED
      }
    });
    await this.prisma.tenant.update({
      where: {
        id: subscription.tenantId
      },
      data: {
        plan: _client.SubscriptionPlan.FREE_TRIAL
      }
    });
    await this.redis.delPattern(`tenant:${subscription.tenantId}*`);
    this.logger.log(`Subscription cancelled for tenant ${subscription.tenantId}`);
  }
  async handleTrialWillEnd(stripeSubscription) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        stripeSubscriptionId: stripeSubscription.id
      },
      include: {
        tenant: {
          include: {
            users: {
              where: {
                role: 'ADMIN'
              },
              take: 1
            }
          }
        }
      }
    });
    if (!subscription) {
      return;
    }
    const trialEnd = new Date(stripeSubscription.trial_end * 1000);
    const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / 86_400_000);
    const adminId = subscription.tenant?.users?.[0]?.id;
    if (adminId) {
      await this.notifications?.notifyUser(adminId, `Your trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} ⏰`, 'Add a payment method now to avoid losing access to your courses and data.', {
        type: 'TRIAL_ENDING',
        daysLeft,
        href: '/billing'
      }).catch(() => {});
    }
    this.logger.log(`Trial ending in ${daysLeft} days for tenant ${subscription.tenantId}`);
  }
  // ------------------------------------------------------------------ PayPal
  async createPayPalOrder(tenantId, plan) {
    const clientId = this.configService.get('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get('PAYPAL_CLIENT_SECRET');
    const baseUrl = this.configService.get('PAYPAL_API_URL') ?? 'https://api-m.paypal.com';
    if (!clientId || !clientSecret) {
      throw new _common.ServiceUnavailableException('PayPal is not configured on this server');
    }
    // Obtain an OAuth 2.0 access token from PayPal
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });
    if (!authResponse.ok) {
      this.logger.error(`PayPal auth failed: ${authResponse.status} ${await authResponse.text()}`);
      throw new _common.ServiceUnavailableException('Failed to authenticate with PayPal');
    }
    const {
      access_token
    } = await authResponse.json();
    // Determine the order amount from the plan price
    const amountCents = _planFeatures.PLAN_PRICE_CENTS[plan] ?? 0;
    const amountValue = (amountCents / 100).toFixed(2);
    // Create a PayPal order via the Orders v2 API
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: `${tenantId}-${plan}`,
          amount: {
            currency_code: 'USD',
            value: amountValue
          },
          description: `EduAI ${plan} plan subscription`
        }]
      })
    });
    if (!orderResponse.ok) {
      this.logger.error(`PayPal order creation failed: ${orderResponse.status} ${await orderResponse.text()}`);
      throw new _common.ServiceUnavailableException('Failed to create PayPal order');
    }
    const order = await orderResponse.json();
    const approvalLink = order.links.find(l => l.rel === 'approve');
    if (!approvalLink) {
      throw new _common.ServiceUnavailableException('PayPal did not return an approval URL');
    }
    this.logger.log(`PayPal order ${order.id} created for tenant ${tenantId}, plan ${plan}`);
    return {
      orderId: order.id,
      approvalUrl: approvalLink.href
    };
  }
  async capturePayPalOrder(tenantId, orderId, plan) {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await this.prisma.subscription.upsert({
      where: {
        tenantId
      },
      update: {
        plan,
        status: _client.SubscriptionStatus.ACTIVE,
        paypalSubscriptionId: orderId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd
      },
      create: {
        tenantId,
        plan,
        status: _client.SubscriptionStatus.ACTIVE,
        paypalSubscriptionId: orderId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd
      }
    });
    await this.prisma.tenant.update({
      where: {
        id: tenantId
      },
      data: {
        plan
      }
    });
    await this.redis.delPattern(`tenant:${tenantId}*`);
  }
  // ─── Dunning Management ────────────────────────────────────────────────────
  async applyDunning(stripeCustomerId, invoiceId, attemptCount) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        stripeCustomerId
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    if (!subscription) {
      return;
    }
    // Dunning schedule: warn on attempt 1, 2; suspend on attempt 3+
    const gracePeriodDays = [3, 5, 7][Math.min(attemptCount - 1, 2)];
    const gracePeriodEnd = new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000);
    await this.prisma.subscription.update({
      where: {
        id: subscription.id
      },
      data: {
        status: attemptCount >= 3 ? _client.SubscriptionStatus.PAST_DUE : subscription.status,
        settings: {
          ...(subscription.settings ?? {}),
          dunningAttempt: attemptCount,
          gracePeriodEnd: gracePeriodEnd.toISOString(),
          lastFailedInvoiceId: invoiceId
        }
      }
    });
    this.logger.warn(`Payment failed for tenant ${subscription.tenant?.id ?? 'unknown'} ` + `(attempt ${attemptCount}). Grace period ends ${gracePeriodEnd.toISOString()}`);
    return {
      tenantId: subscription.tenant?.id,
      attemptCount,
      gracePeriodEnd,
      willSuspend: attemptCount >= 3
    };
  }
  async clearDunning(stripeCustomerId) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        stripeCustomerId
      }
    });
    if (!subscription) {
      return;
    }
    await this.prisma.subscription.update({
      where: {
        id: subscription.id
      },
      data: {
        status: _client.SubscriptionStatus.ACTIVE,
        settings: {
          ...(subscription.settings ?? {}),
          dunningAttempt: 0,
          gracePeriodEnd: null,
          lastFailedInvoiceId: null
        }
      }
    });
    this.logger.log(`Payment recovered for customer ${stripeCustomerId}`);
  }
  async processExpiredGracePeriods() {
    const now = new Date();
    // Find subscriptions in PAST_DUE where grace period has expired
    const overdue = await this.prisma.subscription.findMany({
      where: {
        status: _client.SubscriptionStatus.PAST_DUE
      }
    });
    let suspended = 0;
    for (const sub of overdue) {
      const settings = sub.settings;
      const gracePeriodEnd = settings?.gracePeriodEnd;
      if (gracePeriodEnd && new Date(gracePeriodEnd) < now) {
        await this.prisma.subscription.update({
          where: {
            id: sub.id
          },
          data: {
            status: _client.SubscriptionStatus.SUSPENDED
          }
        });
        suspended++;
      }
    }
    if (suspended > 0) {
      this.logger.warn(`Suspended ${suspended} accounts with expired grace periods`);
    }
    return suspended;
  }
};
exports.BillingService = BillingService = BillingService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_redis.RedisService)), __param(2, (0, _common.Inject)(_config.ConfigService)), __param(3, (0, _common.Inject)(_apiEcosystem.ApiEcosystemService)), __param(4, (0, _common.Optional)()), __param(5, (0, _common.Optional)()), __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object])], BillingService);