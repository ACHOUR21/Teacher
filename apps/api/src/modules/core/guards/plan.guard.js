"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PlanGuard = void 0;
var _common = require("@nestjs/common");
var _core = require("@nestjs/core");
var _client = require("@prisma/client");
var _planFeatures = require("../../billing/domain/plan-features");
var _prisma = require("../../database/prisma.service");
var _requirePlan = require("../decorators/require-plan.decorator");
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
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

let PlanGuard = exports.PlanGuard = class PlanGuard {
  constructor(reflector, prisma) {
    this.reflector = reflector;
    this.prisma = prisma;
  }
  async canActivate(context) {
    const feature = this.reflector.getAllAndOverride(_requirePlan.PLAN_FEATURE_KEY, [context.getHandler(), context.getClass()]);
    // No feature requirement on this route — pass through
    if (!feature) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenant?.id;
    if (!tenantId) {
      throw new _common.ForbiddenException('Tenant context required');
    }
    // Fetch the tenant's current plan (prefer cache via tenant object if already loaded)
    const plan = request.tenant?.plan ?? (await this.prisma.tenant.findUnique({
      where: {
        id: tenantId
      },
      select: {
        plan: true
      }
    }))?.plan ?? _client.SubscriptionPlan.FREE_TRIAL;
    // Check if the subscription is suspended due to failed payments
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        tenantId
      },
      select: {
        status: true
      }
    });
    if (subscription?.status === _client.SubscriptionStatus.SUSPENDED) {
      throw new _common.ForbiddenException('Account suspended due to payment failure. Please update your payment method.');
    }
    if (!(0, _planFeatures.planHasFeature)(plan, feature)) {
      throw new _common.ForbiddenException(`Your current plan (${plan.replace('_', ' ')}) does not include ${feature}. Please upgrade to access this feature.`);
    }
    return true;
  }
};
exports.PlanGuard = PlanGuard = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_core.Reflector)), __param(1, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object, Object])], PlanGuard);