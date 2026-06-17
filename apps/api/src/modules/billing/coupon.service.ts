/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import { PrismaService } from '../database/prisma.service';
import { PLAN_PRICE_CENTS } from './domain/plan-features';

// ──────────────────────────────────────────────────────────────────────────────
// DTOs
// ──────────────────────────────────────────────────────────────────────────────

export class CreateCouponDto {
  @ApiProperty({ example: 'SCHOOL2026' })
  @IsString()
  code: string;

  @ApiProperty({ enum: ['percent', 'fixed'] })
  @IsEnum(['percent', 'fixed'])
  type: 'percent' | 'fixed';

  @ApiProperty({ description: '20 = 20% off, 2000 = $20 off (cents)', example: 20 })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: 100, description: 'null = unlimited' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ type: [String], example: ['PROFESSIONAL', 'BUSINESS'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicablePlans?: string[];

  @ApiPropertyOptional({ example: '20% off for schools' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class DeactivateCouponDto {
  @ApiProperty()
  @IsBoolean()
  @Transform(() => true)
  isActive: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// Interfaces
// ──────────────────────────────────────────────────────────────────────────────

export interface CouponValidation {
  valid: boolean;
  discount: { type: 'percent' | 'fixed'; amount: number } | null;
  originalPrice: number;
  finalPrice: number;
  message: string;
  couponId?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────────────────────

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate a coupon code against a plan and return discount details.
   * Does NOT record usage — call recordUsage() after successful payment.
   */
  async validateCoupon(code: string, plan: string): Promise<CouponValidation> {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });

    if (!coupon) {
      return { valid: false, discount: null, originalPrice: 0, finalPrice: 0, message: 'Coupon code not found.' };
    }
    if (!coupon.isActive) {
      return { valid: false, discount: null, originalPrice: 0, finalPrice: 0, message: 'This coupon is no longer active.' };
    }

    const now = new Date();
    if (now < coupon.validFrom) {
      return { valid: false, discount: null, originalPrice: 0, finalPrice: 0, message: 'This coupon is not yet valid.' };
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      return { valid: false, discount: null, originalPrice: 0, finalPrice: 0, message: 'This coupon has expired.' };
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, discount: null, originalPrice: 0, finalPrice: 0, message: 'Coupon usage limit has been reached.' };
    }

    // Check applicable plans (stored in description field as JSON or via applicablePlans array)
    const applicablePlans: string[] = (coupon as any).applicablePlans ?? [];
    if (applicablePlans.length > 0 && !applicablePlans.includes(plan)) {
      return {
        valid: false, discount: null, originalPrice: 0, finalPrice: 0,
        message: `This coupon is only valid for: ${applicablePlans.join(', ')}.`,
      };
    }

    // Determine plan base price
    const originalPriceCents = PLAN_PRICE_CENTS[plan as keyof typeof PLAN_PRICE_CENTS] ?? 0;
    const discountType = coupon.discountType as 'percent' | 'fixed';
    const discountValue = Number(coupon.discountValue);

    let discountAmountCents: number;
    if (discountType === 'percent') {
      discountAmountCents = Math.round(originalPriceCents * (discountValue / 100));
    } else {
      // Fixed — discountValue is stored in cents
      discountAmountCents = Math.min(discountValue, originalPriceCents);
    }

    const finalPriceCents = Math.max(0, originalPriceCents - discountAmountCents);
    const discountDisplay = discountType === 'percent'
      ? `${discountValue}% off`
      : `$${(discountValue / 100).toFixed(2)} off`;

    return {
      valid: true,
      couponId: coupon.id,
      discount: { type: discountType, amount: discountValue },
      originalPrice: originalPriceCents,
      finalPrice: finalPriceCents,
      message: `${code.toUpperCase()} applied — ${discountDisplay}`,
    };
  }

  /** Admin: create a new coupon. */
  async createCoupon(dto: CreateCouponDto): Promise<object> {
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code.toUpperCase().trim() } });
    if (existing) {
      throw new ConflictException(`Coupon code "${dto.code.toUpperCase()}" already exists.`);
    }

    const coupon = await this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase().trim(),
        discountType: dto.type,
        discountValue: dto.amount,
        maxUses: dto.maxUses ?? null,
        usedCount: 0,
        validFrom: new Date(),
        validUntil: dto.expiresAt ? new Date(dto.expiresAt) : null,
        isActive: true,
        // Store applicablePlans and description in Prisma native string arrays
        ...(dto.description ? { description: dto.description } : {}),
        ...(dto.applicablePlans ? { applicablePlans: dto.applicablePlans } : {}),
      } as any,
    });

    this.logger.log(`Coupon created: ${coupon.code}`);
    return coupon;
  }

  /** Admin: list all coupons, optionally filtered by plan relevance. */
  async listCoupons(): Promise<object[]> {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Admin: deactivate a coupon by ID. */
  async deactivateCoupon(couponId: string): Promise<void> {
    const coupon = await this.prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) {
      throw new NotFoundException(`Coupon ${couponId} not found.`);
    }
    await this.prisma.coupon.update({ where: { id: couponId }, data: { isActive: false } });
    this.logger.log(`Coupon ${coupon.code} deactivated.`);
  }

  /** Record coupon usage — call this after a successful subscription payment. */
  async recordUsage(couponId: string): Promise<void> {
    await this.prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    });
  }
}
