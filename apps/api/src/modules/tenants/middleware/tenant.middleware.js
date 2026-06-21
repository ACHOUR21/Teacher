"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TenantMiddleware = void 0;
var _common = require("@nestjs/common");
var _redis = require("../../cache/redis.service");
var _prisma = require("../../database/prisma.service");
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
var TenantMiddleware_1;
let TenantMiddleware = exports.TenantMiddleware = TenantMiddleware_1 = class TenantMiddleware {
  logger = new _common.Logger(TenantMiddleware_1.name);
  CACHE_TTL = 300; // 5 minutes
  constructor(prisma, redis) {
    this.prisma = prisma;
    this.redis = redis;
  }
  async use(req, _res, next) {
    try {
      // Try to resolve tenant from multiple sources
      const tenantIdentifier = this.extractTenantIdentifier(req);
      if (!tenantIdentifier) {
        next();
        return;
      }
      const cacheKey = `tenant:${tenantIdentifier}`;
      let tenant = await this.redis.getObject(cacheKey);
      if (!tenant) {
        const dbTenant = await this.prisma.tenant.findFirst({
          where: {
            OR: [{
              id: tenantIdentifier
            }, {
              slug: tenantIdentifier
            }, {
              domain: tenantIdentifier
            }],
            isActive: true
          },
          select: {
            id: true,
            slug: true,
            name: true,
            isActive: true,
            plan: true,
            settings: true
          }
        });
        if (dbTenant) {
          tenant = {
            id: dbTenant.id,
            slug: dbTenant.slug,
            name: dbTenant.name,
            isActive: dbTenant.isActive,
            plan: dbTenant.plan,
            settings: dbTenant.settings
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
  extractTenantIdentifier(req) {
    // 1. X-Tenant-ID or TenantId header (highest priority)
    const headerTenantId = req.headers['x-tenant-id'] || req.headers['tenantid'];
    if (headerTenantId) {
      return headerTenantId;
    }
    // 2. Subdomain extraction (e.g., acme.eduai.app)
    const host = req.headers.host || '';
    const subdomain = this.extractSubdomain(host);
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      return subdomain;
    }
    // 3. Query parameter (for development/testing)
    const queryTenant = req.query['tenant'];
    if (queryTenant) {
      return queryTenant;
    }
    return null;
  }
  extractSubdomain(host) {
    const parts = host.split('.');
    if (parts.length >= 3) {
      return parts[0] ?? null;
    }
    return null;
  }
};
exports.TenantMiddleware = TenantMiddleware = TenantMiddleware_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_redis.RedisService)), __metadata("design:paramtypes", [Object, Object])], TenantMiddleware);