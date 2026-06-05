import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../cache/redis.service';

export interface TenantRequest extends Request {
  tenantId?: string;
  tenant?: {
    id: string;
    slug: string;
    name: string;
    isActive: boolean;
    plan: string;
    settings: Record<string, unknown>;
  };
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async use(req: TenantRequest, _res: Response, next: NextFunction): Promise<void> {
    try {
      // Try to resolve tenant from multiple sources
      const tenantIdentifier = this.extractTenantIdentifier(req);

      if (!tenantIdentifier) {
        next();
        return;
      }

      const cacheKey = `tenant:${tenantIdentifier}`;
      let tenant = await this.redis.getObject<TenantRequest['tenant']>(cacheKey);

      if (!tenant) {
        const dbTenant = await this.prisma.tenant.findFirst({
          where: {
            OR: [
              { id: tenantIdentifier },
              { slug: tenantIdentifier },
              { domain: tenantIdentifier },
            ],
            isActive: true,
          },
          select: {
            id: true,
            slug: true,
            name: true,
            isActive: true,
            plan: true,
            settings: true,
          },
        });

        if (dbTenant) {
          tenant = {
            id: dbTenant.id,
            slug: dbTenant.slug,
            name: dbTenant.name,
            isActive: dbTenant.isActive,
            plan: dbTenant.plan,
            settings: dbTenant.settings as Record<string, unknown>,
          };
          await this.redis.setObject(cacheKey, tenant, this.CACHE_TTL);
        }
      }

      if (tenant) {
        req.tenantId = tenant.id;
        req.tenant = tenant;
      }
    } catch (error) {
      this.logger.warn('Tenant resolution failed:', error);
    }

    next();
  }

  private extractTenantIdentifier(req: Request): string | null {
    // 1. X-Tenant-ID or TenantId header (highest priority)
    const headerTenantId = (req.headers['x-tenant-id'] || req.headers['tenantid']) as string;
    if (headerTenantId) return headerTenantId;

    // 2. Subdomain extraction (e.g., acme.eduai.app)
    const host = req.headers.host || '';
    const subdomain = this.extractSubdomain(host);
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') return subdomain;

    // 3. Query parameter (for development/testing)
    const queryTenant = req.query['tenant'] as string;
    if (queryTenant) return queryTenant;

    return null;
  }

  private extractSubdomain(host: string): string | null {
    const parts = host.split('.');
    if (parts.length >= 3) {
      return parts[0] ?? null;
    }
    return null;
  }
}
