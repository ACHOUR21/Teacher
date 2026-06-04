import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

export interface RequestWithTenant extends Request {
  tenantId?: string;
  tenant?: { id: string; slug: string; isActive: boolean };
}

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();

    if (!request.tenantId) {
      throw new ForbiddenException('Tenant context is required');
    }

    if (request.tenant && !request.tenant.isActive) {
      throw new ForbiddenException('Tenant account is inactive');
    }

    return true;
  }
}
