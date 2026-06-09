import * as crypto from 'crypto';

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ApiEcosystemService {
  constructor(private readonly prisma: PrismaService) {}

  async createApiKey(tenantId: string, name: string, scopes: string[], rateLimit = 1000, expiresAt?: Date) {
    const rawKey = `eduai_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 12);

    const apiKey = await this.prisma.apiKey.create({
      data: { tenantId, name, keyHash, keyPrefix, scopes, rateLimit, expiresAt },
    });

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
    return this.prisma.apiKey.findMany({
      where: { tenantId },
      select: { id: true, name: true, keyPrefix: true, scopes: true, rateLimit: true, isActive: true, lastUsedAt: true, expiresAt: true, createdAt: true },
    });
  }

  async revokeApiKey(id: string, tenantId: string) {
    return this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async createWebhook(tenantId: string, url: string, events: string[]) {
    const secret = `whsec_${crypto.randomBytes(32).toString('hex')}`;
    return this.prisma.webhookEndpoint.create({
      data: { tenantId, url, events, secret },
    });
  }

  async listWebhooks(tenantId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { tenantId },
      select: { id: true, url: true, events: true, isActive: true, createdAt: true },
    });
  }

  async getUsageStats(tenantId: string) {
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
    return { totalKeys, activeKeys, totalWebhooks, recentKeys };
  }

  async deleteWebhook(id: string, tenantId: string) {
    return this.prisma.webhookEndpoint.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async toggleApiKey(id: string, tenantId: string, isActive: boolean) {
    return this.prisma.apiKey.update({
      where: { id },
      data: { isActive },
    });
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
