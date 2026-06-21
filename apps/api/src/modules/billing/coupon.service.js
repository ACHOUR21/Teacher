"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DeactivateCouponDto = exports.CreateCouponDto = exports.CouponService = void 0;
var _common = require("@nestjs/common");
var _classValidator = require("class-validator");
var _swagger = require("@nestjs/swagger");
var _classTransformer = require("class-transformer");
var _prisma = require("../database/prisma.service");
var _planFeatures = require("./domain/plan-features");
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
var CouponService_1;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

// ──────────────────────────────────────────────────────────────────────────────
// DTOs
// ──────────────────────────────────────────────────────────────────────────────
class CreateCouponDto {
  code;
  type;
  amount;
  maxUses;
  expiresAt;
  applicablePlans;
  description;
}
exports.CreateCouponDto = CreateCouponDto;
__decorate([(0, _swagger.ApiProperty)({
  example: 'SCHOOL2026'
}), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateCouponDto.prototype, "code", void 0);
__decorate([(0, _swagger.ApiProperty)({
  enum: ['percent', 'fixed']
}), (0, _classValidator.IsEnum)(['percent', 'fixed']), __metadata("design:type", String)], CreateCouponDto.prototype, "type", void 0);
__decorate([(0, _swagger.ApiProperty)({
  description: '20 = 20% off, 2000 = $20 off (cents)',
  example: 20
}), (0, _classValidator.IsInt)(), (0, _classValidator.Min)(1), __metadata("design:type", Number)], CreateCouponDto.prototype, "amount", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  example: 100,
  description: 'null = unlimited'
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsInt)(), (0, _classValidator.Min)(1), __metadata("design:type", Number)], CreateCouponDto.prototype, "maxUses", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  example: '2026-12-31T23:59:59.000Z'
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsDateString)(), __metadata("design:type", String)], CreateCouponDto.prototype, "expiresAt", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  type: [String],
  example: ['PROFESSIONAL', 'BUSINESS']
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsArray)(), (0, _classValidator.IsString)({
  each: true
}), __metadata("design:type", Array)], CreateCouponDto.prototype, "applicablePlans", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)({
  example: '20% off for schools'
}), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateCouponDto.prototype, "description", void 0);
class DeactivateCouponDto {
  isActive;
}
exports.DeactivateCouponDto = DeactivateCouponDto;
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsBoolean)(), (0, _classTransformer.Transform)(() => true), __metadata("design:type", Boolean)], DeactivateCouponDto.prototype, "isActive", void 0);
// ──────────────────────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────────────────────
let CouponService = exports.CouponService = CouponService_1 = class CouponService {
  logger = new _common.Logger(CouponService_1.name);
  constructor(prisma) {
    this.prisma = prisma;
  }
  /**
   * Validate a coupon code against a plan and return discount details.
   * Does NOT record usage — call recordUsage() after successful payment.
   */
  async validateCoupon(code, plan) {
    const coupon = await this.prisma.coupon.findUnique({
      where: {
        code: code.toUpperCase().trim()
      }
    });
    if (!coupon) {
      return {
        valid: false,
        discount: null,
        originalPrice: 0,
        finalPrice: 0,
        message: 'Coupon code not found.'
      };
    }
    if (!coupon.isActive) {
      return {
        valid: false,
        discount: null,
        originalPrice: 0,
        finalPrice: 0,
        message: 'This coupon is no longer active.'
      };
    }
    const now = new Date();
    if (now < coupon.validFrom) {
      return {
        valid: false,
        discount: null,
        originalPrice: 0,
        finalPrice: 0,
        message: 'This coupon is not yet valid.'
      };
    }
    if (coupon.validUntil && now > coupon.validUntil) {
      return {
        valid: false,
        discount: null,
        originalPrice: 0,
        finalPrice: 0,
        message: 'This coupon has expired.'
      };
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return {
        valid: false,
        discount: null,
        originalPrice: 0,
        finalPrice: 0,
        message: 'Coupon usage limit has been reached.'
      };
    }
    // Check applicable plans (stored in description field as JSON or via applicablePlans array)
    const applicablePlans = coupon.applicablePlans ?? [];
    if (applicablePlans.length > 0 && !applicablePlans.includes(plan)) {
      return {
        valid: false,
        discount: null,
        originalPrice: 0,
        finalPrice: 0,
        message: `This coupon is only valid for: ${applicablePlans.join(', ')}.`
      };
    }
    // Determine plan base price
    const originalPriceCents = _planFeatures.PLAN_PRICE_CENTS[plan] ?? 0;
    const discountType = coupon.discountType;
    const discountValue = Number(coupon.discountValue);
    let discountAmountCents;
    if (discountType === 'percent') {
      discountAmountCents = Math.round(originalPriceCents * (discountValue / 100));
    } else {
      // Fixed — discountValue is stored in cents
      discountAmountCents = Math.min(discountValue, originalPriceCents);
    }
    const finalPriceCents = Math.max(0, originalPriceCents - discountAmountCents);
    const discountDisplay = discountType === 'percent' ? `${discountValue}% off` : `$${(discountValue / 100).toFixed(2)} off`;
    return {
      valid: true,
      couponId: coupon.id,
      discount: {
        type: discountType,
        amount: discountValue
      },
      originalPrice: originalPriceCents,
      finalPrice: finalPriceCents,
      message: `${code.toUpperCase()} applied — ${discountDisplay}`
    };
  }
  /** Admin: create a new coupon. */
  async createCoupon(dto) {
    const existing = await this.prisma.coupon.findUnique({
      where: {
        code: dto.code.toUpperCase().trim()
      }
    });
    if (existing) {
      throw new _common.ConflictException(`Coupon code "${dto.code.toUpperCase()}" already exists.`);
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
        ...(dto.description ? {
          description: dto.description
        } : {}),
        ...(dto.applicablePlans ? {
          applicablePlans: dto.applicablePlans
        } : {})
      }
    });
    this.logger.log(`Coupon created: ${coupon.code}`);
    return coupon;
  }
  /** Admin: list all coupons, optionally filtered by plan relevance. */
  async listCoupons() {
    return this.prisma.coupon.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
  /** Admin: deactivate a coupon by ID. */
  async deactivateCoupon(couponId) {
    const coupon = await this.prisma.coupon.findUnique({
      where: {
        id: couponId
      }
    });
    if (!coupon) {
      throw new _common.NotFoundException(`Coupon ${couponId} not found.`);
    }
    await this.prisma.coupon.update({
      where: {
        id: couponId
      },
      data: {
        isActive: false
      }
    });
    this.logger.log(`Coupon ${coupon.code} deactivated.`);
  }
  /** Record coupon usage — call this after a successful subscription payment. */
  async recordUsage(couponId) {
    await this.prisma.coupon.update({
      where: {
        id: couponId
      },
      data: {
        usedCount: {
          increment: 1
        }
      }
    });
  }
};
exports.CouponService = CouponService = CouponService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], CouponService);