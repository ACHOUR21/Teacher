import { SetMetadata } from '@nestjs/common';

import { type PlanFeatureKey } from '../../billing/domain/plan-features';

export const PLAN_FEATURE_KEY = 'requiredPlanFeature';

/**
 * Attach to a controller method to require the tenant's plan to include a feature.
 * Enforced by PlanGuard.
 *
 * @example
 * @RequiresPlanFeature('liveClassroom')
 * @Get('sessions')
 * listSessions() { ... }
 */
export const RequiresPlanFeature = (feature: PlanFeatureKey) =>
  SetMetadata(PLAN_FEATURE_KEY, feature);
