import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { type Request } from 'express';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ScimAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const tenantId = req.headers['x-tenant-id'] as string;
    if (!tenantId) { throw new UnauthorizedException('Missing X-Tenant-ID header'); }

    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }
    const token = authHeader.slice(7);

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) { throw new UnauthorizedException('Tenant not found'); }

    const settings = (tenant.settings ?? {}) as Record<string, unknown>;
    const storedHash = settings['scimTokenHash'] as string | undefined;
    if (!storedHash) { throw new UnauthorizedException('SCIM not configured for this tenant'); }

    const valid = await bcrypt.compare(token, storedHash);
    if (!valid) { throw new UnauthorizedException('Invalid SCIM token'); }

    return true;
  }
}
