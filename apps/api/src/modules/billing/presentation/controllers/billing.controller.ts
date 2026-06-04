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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BillingService } from '../../billing.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../../core/decorators/current-user.decorator';
import { TenantId } from '../../../core/decorators/tenant.decorator';
import { Public } from '../../../core/decorators/public.decorator';
import { UserRole, SubscriptionPlan } from '@prisma/client';
import { IsEnum, IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Request } from 'express';

class SubscribeDto {
  @ApiProperty({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;
}

class PortalSessionDto {
  @ApiProperty({ example: 'https://app.example.com/settings' })
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
  @ApiOperation({ summary: 'Subscribe to a plan' })
  subscribe(
    @TenantId() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SubscribeDto,
  ) {
    return this.billingService.subscribe(tenantId, dto.plan, user.id);
  }

  @Post('portal')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create Stripe billing portal session' })
  async createPortal(
    @TenantId() tenantId: string,
    @Body() dto: PortalSessionDto,
  ) {
    const url = await this.billingService.createPortalSession(tenantId, dto.returnUrl);
    return { url };
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel subscription at period end' })
  cancel(@TenantId() tenantId: string) {
    return this.billingService.cancelSubscription(tenantId);
  }

  @Post('coupon/apply')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Apply a coupon code' })
  applyCoupon(
    @TenantId() tenantId: string,
    @Body() dto: ApplyCouponDto,
  ) {
    return this.billingService.applyCoupon(tenantId, dto.couponCode);
  }

  @Get('invoices')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List billing invoices' })
  getInvoices(
    @TenantId() tenantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.billingService.getInvoices(tenantId, page, limit);
  }

  @Post('paypal/order')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create PayPal order' })
  createPayPalOrder(
    @TenantId() tenantId: string,
    @Body() dto: SubscribeDto,
  ) {
    return this.billingService.createPayPalOrder(tenantId, dto.plan);
  }

  @Post('paypal/capture/:orderId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Capture PayPal order' })
  capturePayPalOrder(
    @TenantId() tenantId: string,
    @Param('orderId') orderId: string,
    @Body() dto: SubscribeDto,
  ) {
    return this.billingService.capturePayPalOrder(tenantId, orderId, dto.plan);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new Error('Raw body not available');
    }
    await this.billingService.handleStripeWebhook(req.rawBody, signature);
    return { received: true };
  }
}
