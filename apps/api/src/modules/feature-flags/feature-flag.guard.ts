import { type CanActivate, type ExecutionContext, Injectable, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { type FeatureFlag } from './feature-flags.constants';
import { FeatureFlagsService } from './feature-flags.service';

export const FEATURE_FLAG_KEY = 'feature_flag';
export const RequireFeature = (flag: FeatureFlag) => SetMetadata(FEATURE_FLAG_KEY, flag);

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly flags: FeatureFlagsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const flag = this.reflector.getAllAndOverride<FeatureFlag | undefined>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!flag) { return true; }

    const request = context.switchToHttp().getRequest<{ user?: { tenantId?: string; id?: string } }>();
    const enabled = await this.flags.isEnabled(flag, {
      tenantId: request.user?.tenantId,
      userId: request.user?.id,
    });

    if (!enabled) {
      throw new ForbiddenException(`Feature '${flag}' is not enabled for your account`);
    }
    return true;
  }
}
