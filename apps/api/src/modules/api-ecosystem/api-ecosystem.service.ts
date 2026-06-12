import * as crypto from 'crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';

import { RedisService } from '../cache/redis.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ApiEcosystemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisService,
  ) {}

  async createApiKey(tenantId: string, name: string, scopes: string[], rateLimit = 1000, expiresAt?: Date, userId?: string) {
    const rawKey = `eduai_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 12);

    // Resolve userId: use provided value or fall back to first admin in tenant
    let resolvedUserId: string = userId ?? '';
    if (!resolvedUserId) {
      const firstUser = await this.prisma.user.findFirst({ where: { tenantId }, select: { id: true } });
      resolvedUserId = firstUser?.id ?? '';
    }

    const apiKey = await this.prisma.apiKey.create({
      data: { tenantId, userId: resolvedUserId, name, keyHash, keyPrefix, scopes, rateLimit, expiresAt },
    });

    // Invalidate list and usage caches after creating a new key
    await Promise.all([
      this.cache.del(`api-ecosystem:${tenantId}:keys`),
      this.cache.del(`api-ecosystem:${tenantId}:usage`),
    ]);

    return { ...apiKey, rawKey };
  }

  async validateApiKey(rawKey: string) {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({ where: { keyHash }, include: { tenant: true } });
    if (!apiKey || !apiKey.isActive) {throw new UnauthorizedException('Invalid API key');}
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {throw new UnauthorizedException('API key expired');}

    await this.prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
    return apiKey;
  }

  async listApiKeys(tenantId: string) {
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
      where: { tenantId },
      select: { id: true, name: true, keyPrefix: true, scopes: true, rateLimit: true, isActive: true, lastUsedAt: true, expiresAt: true, createdAt: true },
    });

    await this.cache.set(cacheKey, JSON.stringify(keys), 30);
    return keys;
  }

  async revokeApiKey(id: string, tenantId: string) {
    const result = await this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
    await Promise.all([
      this.cache.del(`api-ecosystem:${tenantId}:keys`),
      this.cache.del(`api-ecosystem:${tenantId}:usage`),
    ]);
    return result;
  }

  async createWebhook(tenantId: string, url: string, events: string[]) {
    const secret = `whsec_${crypto.randomBytes(32).toString('hex')}`;
    const webhook = await this.prisma.webhookEndpoint.create({
      data: { tenantId, url, events, secret },
    });
    await this.cache.del(`api-ecosystem:${tenantId}:webhooks`);
    return webhook;
  }

  async listWebhooks(tenantId: string) {
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
      where: { tenantId },
      select: { id: true, url: true, events: true, isActive: true, createdAt: true },
    });

    await this.cache.set(cacheKey, JSON.stringify(webhooks), 30);
    return webhooks;
  }

  async getUsageStats(tenantId: string) {
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

    const [totalKeys, activeKeys, totalWebhooks, recentKeys] = await Promise.all([
      this.prisma.apiKey.count({ where: { tenantId } }),
      this.prisma.apiKey.count({ where: { tenantId, isActive: true } }),
      this.prisma.webhookEndpoint.count({ where: { tenantId } }),
      this.prisma.apiKey.findMany({
        where: { tenantId, lastUsedAt: { not: null } },
        orderBy: { lastUsedAt: 'desc' },
        take: 5,
        select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, isActive: true },
      }),
    ]);
    const stats = { totalKeys, activeKeys, totalWebhooks, recentKeys };
    await this.cache.set(cacheKey, JSON.stringify(stats), 30);
    return stats;
  }

  async deleteWebhook(id: string, tenantId: string) {
    const result = await this.prisma.webhookEndpoint.update({
      where: { id },
      data: { isActive: false },
    });
    await this.cache.del(`api-ecosystem:${tenantId}:webhooks`);
    return result;
  }

  async toggleApiKey(id: string, tenantId: string, isActive: boolean) {
    const result = await this.prisma.apiKey.update({
      where: { id },
      data: { isActive },
    });
    await Promise.all([
      this.cache.del(`api-ecosystem:${tenantId}:keys`),
      this.cache.del(`api-ecosystem:${tenantId}:usage`),
    ]);
    return result;
  }

  async deliverWebhook(tenantId: string, event: string, payload: unknown) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { tenantId, isActive: true, events: { has: event } },
    });

    const deliveries = endpoints.map(async endpoint => {
      const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
      const sig = crypto.createHmac('sha256', endpoint.secret).update(body).digest('hex');
      try {
        await fetch(endpoint.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-EduAI-Signature': `sha256=${sig}` },
          body,
          signal: AbortSignal.timeout(10000),
        });
      } catch {
        // Log delivery failure — implement retry queue in production
      }
    });

    await Promise.allSettled(deliveries);
  }
}
