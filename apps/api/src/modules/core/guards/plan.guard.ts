import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { PLAN_FEATURE_KEY } from '../decorators/require-plan.decorator';
import { planHasFeature, PlanFeatureKey } from '../../billing/domain/plan-features';
import { SubscriptionPlan } from '@prisma/client';

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<PlanFeatureKey>(PLAN_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No feature requirement on this route — pass through
    if (!feature) return true;

    const request = context.switchToHttp().getRequest();
    const tenantId: string | undefined = request.tenant?.id;

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    // Fetch the tenant's current plan (prefer cache via tenant object if already loaded)
    const plan: SubscriptionPlan = request.tenant?.plan
      ?? (await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { plan: true } }))?.plan
      ?? SubscriptionPlan.FREE_TRIAL;

    if (!planHasFeature(plan, feature)) {
      throw new ForbiddenException(
        `Your current plan (${plan.replace('_', ' ')}) does not include ${feature}. Please upgrade to access this feature.`,
      );
    }

    return true;
  }
}
