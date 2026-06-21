"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ApiEcosystemService = void 0;
var crypto = _interopRequireWildcard(require("crypto"));
var _common = require("@nestjs/common");
var _redis = require("../cache/redis.service");
var _prisma = require("../database/prisma.service");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
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
let ApiEcosystemService = exports.ApiEcosystemService = class ApiEcosystemService {
  constructor(prisma, cache) {
    this.prisma = prisma;
    this.cache = cache;
  }
  async createApiKey(tenantId, name, scopes, rateLimit = 1000, expiresAt, userId) {
    const rawKey = `eduai_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 12);
    // Resolve userId: use provided value or fall back to first admin in tenant
    let resolvedUserId = userId ?? '';
    if (!resolvedUserId) {
      const firstUser = await this.prisma.user.findFirst({
        where: {
          tenantId
        },
        select: {
          id: true
        }
      });
      resolvedUserId = firstUser?.id ?? '';
    }
    const apiKey = await this.prisma.apiKey.create({
      data: {
        tenantId,
        userId: resolvedUserId,
        name,
        keyHash,
        keyPrefix,
        scopes,
        rateLimit,
        expiresAt
      }
    });
    // Invalidate list and usage caches after creating a new key
    await Promise.all([this.cache.del(`api-ecosystem:${tenantId}:keys`), this.cache.del(`api-ecosystem:${tenantId}:usage`)]);
    return {
      ...apiKey,
      rawKey
    };
  }
  async validateApiKey(rawKey) {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({
      where: {
        keyHash
      },
      include: {
        tenant: true
      }
    });
    if (!apiKey || !apiKey.isActive) {
      throw new _common.UnauthorizedException('Invalid API key');
    }
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new _common.UnauthorizedException('API key expired');
    }
    await this.prisma.apiKey.update({
      where: {
        id: apiKey.id
      },
      data: {
        lastUsedAt: new Date()
      }
    });
    return apiKey;
  }
  async listApiKeys(tenantId) {
    const cacheKey = `api-ecosystem:${tenantId}:keys`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return JSON.parse(cached);
      } catch {
        // fall through to DB
      }
    }
    const keys = await this.prisma.apiKey.findMany({
      where: {
        tenantId
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        rateLimit: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true
      }
    });
    await this.cache.set(cacheKey, JSON.stringify(keys), 30);
    return keys;
  }
  async revokeApiKey(id, tenantId) {
    const result = await this.prisma.apiKey.update({
      where: {
        id
      },
      data: {
        isActive: false
      }
    });
    await Promise.all([this.cache.del(`api-ecosystem:${tenantId}:keys`), this.cache.del(`api-ecosystem:${tenantId}:usage`)]);
    return result;
  }
  async createWebhook(tenantId, url, events) {
    const secret = `whsec_${crypto.randomBytes(32).toString('hex')}`;
    const webhook = await this.prisma.webhookEndpoint.create({
      data: {
        tenantId,
        url,
        events,
        secret
      }
    });
    await this.cache.del(`api-ecosystem:${tenantId}:webhooks`);
    return webhook;
  }
  async listWebhooks(tenantId) {
    const cacheKey = `api-ecosystem:${tenantId}:webhooks`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return JSON.parse(cached);
      } catch {
        // fall through to DB
      }
    }
    const webhooks = await this.prisma.webhookEndpoint.findMany({
      where: {
        tenantId
      },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        createdAt: true
      }
    });
    await this.cache.set(cacheKey, JSON.stringify(webhooks), 30);
    return webhooks;
  }
  async getUsageStats(tenantId) {
    const cacheKey = `api-ecosystem:${tenantId}:usage`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return JSON.parse(cached);
      } catch {
        // fall through to DB
      }
    }
    const [totalKeys, activeKeys, totalWebhooks, recentKeys] = await Promise.all([this.prisma.apiKey.count({
      where: {
        tenantId
      }
    }), this.prisma.apiKey.count({
      where: {
        tenantId,
        isActive: true
      }
    }), this.prisma.webhookEndpoint.count({
      where: {
        tenantId
      }
    }), this.prisma.apiKey.findMany({
      where: {
        tenantId,
        lastUsedAt: {
          not: null
        }
      },
      orderBy: {
        lastUsedAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        isActive: true
      }
    })]);
    const stats = {
      totalKeys,
      activeKeys,
      totalWebhooks,
      recentKeys
    };
    await this.cache.set(cacheKey, JSON.stringify(stats), 30);
    return stats;
  }
  async deleteWebhook(id, tenantId) {
    const result = await this.prisma.webhookEndpoint.update({
      where: {
        id
      },
      data: {
        isActive: false
      }
    });
    await this.cache.del(`api-ecosystem:${tenantId}:webhooks`);
    return result;
  }
  async toggleApiKey(id, tenantId, isActive) {
    const result = await this.prisma.apiKey.update({
      where: {
        id
      },
      data: {
        isActive
      }
    });
    await Promise.all([this.cache.del(`api-ecosystem:${tenantId}:keys`), this.cache.del(`api-ecosystem:${tenantId}:usage`)]);
    return result;
  }
  async deliverWebhook(tenantId, event, payload) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: {
        tenantId,
        isActive: true,
        events: {
          has: event
        }
      }
    });
    const deliveries = endpoints.map(async endpoint => {
      const body = JSON.stringify({
        event,
        payload,
        timestamp: new Date().toISOString()
      });
      const sig = crypto.createHmac('sha256', endpoint.secret).update(body).digest('hex');
      try {
        await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-EduAI-Signature': `sha256=${sig}`
          },
          body,
          signal: AbortSignal.timeout(10000)
        });
      } catch {
        // Log delivery failure — implement retry queue in production
      }
    });
    await Promise.allSettled(deliveries);
  }
};
exports.ApiEcosystemService = ApiEcosystemService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_redis.RedisService)), __metadata("design:paramtypes", [Object, Object])], ApiEcosystemService);