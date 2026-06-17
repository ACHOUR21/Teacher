import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  Req,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation , ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, SubscriptionPlan } from '@prisma/client';
import { IsEnum, IsString, IsOptional, IsUrl } from 'class-validator';
import { Request } from 'express';

import { CurrentUser, CurrentUserPayload } from '../../../core/decorators/current-user.decorator';
import { Public } from '../../../core/decorators/public.decorator';
import { Roles } from '../../../core/decorators/roles.decorator';
import { TenantId } from '../../../core/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { BillingService } from '../../billing.service';

class SubscribeDto {
  @ApiProperty({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({ example: 'https://app.eduai.io/billing?success=1' })
  @IsUrl()
  successUrl: string;

  @ApiPropertyOptional({ example: 'https://app.eduai.io/billing' })
  @IsOptional()
  @IsUrl()
  cancelUrl?: string;
}

class PortalSessionDto {
  @ApiProperty({ example: 'https://app.eduai.io/billing' })
  @IsString()
  returnUrl: string;
}

class ApplyCouponDto {
  @ApiProperty({ example: 'SAVE20' })
  @IsString()
  couponCode: string;
}

@ApiTags('Billing')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('subscribe')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create Stripe Checkout Session to subscribe / upgrade plan' })
  subscribe(
    @TenantId() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SubscribeDto,
  ) {
    return this.billingService.subscribe(
      tenantId,
      dto.plan,
      user.id,
      dto.successUrl,
      dto.cancelUrl ?? dto.successUrl,
    );
  }

  @Post('portal')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create Stripe billing portal session' })
  async createPortal(@TenantId() tenantId: string, @Body() dto: PortalSessionDto) {
    const url = await this.billingService.createPortalSession(tenantId, dto.returnUrl);
    return { url };
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Schedule subscription cancellation at period end' })
  cancel(@TenantId() tenantId: string) {
    return this.billingService.cancelSubscription(tenantId);
  }

  @Post('coupon/apply')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Apply a coupon code to current subscription' })
  applyCoupon(@TenantId() tenantId: string, @Body() dto: ApplyCouponDto) {
    return this.billingService.applyCoupon(tenantId, dto.couponCode);
  }

  @Get('subscription')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get current subscription and recent invoices' })
  getSubscription(@TenantId() tenantId: string) {
    return this.billingService.getCurrentSubscription(tenantId);
  }

  @Get('invoices')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List billing invoices (paginated)' })
  getInvoices(
    @TenantId() tenantId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.billingService.getInvoices(tenantId, +page, +limit);
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Revenue analytics: MRR, ARR, churn, monthly breakdown' })
  getAnalytics(@TenantId() tenantId: string) {
    return this.billingService.getRevenueAnalytics(tenantId);
  }

  @Post('paypal/order')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create PayPal order (stub)' })
  createPayPalOrder(@TenantId() tenantId: string, @Body() dto: Pick<SubscribeDto, 'plan'>) {
    return this.billingService.createPayPalOrder(tenantId, dto.plan);
  }

  @Post('paypal/capture/:orderId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Capture PayPal order (stub)' })
  capturePayPalOrder(
    @TenantId() tenantId: string,
    @Param('orderId') orderId: string,
    @Body() dto: Pick<SubscribeDto, 'plan'>,
  ) {
    return this.billingService.capturePayPalOrder(tenantId, orderId, dto.plan);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint (public, signature-verified)' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {throw new Error('Raw body not available');}
    await this.billingService.handleStripeWebhook(req.rawBody, signature);
    return { received: true };
  }
}
