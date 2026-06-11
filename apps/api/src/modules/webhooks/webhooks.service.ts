import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { createHmac, randomBytes } from 'crypto';

import { PrismaService } from '../database/prisma.service';

export interface WebhookEndpointDto {
  id: string;
  tenantId: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  createdAt: Date;
}

type WebhookEndpoint = WebhookEndpointDto;

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  async registerEndpoint(
    tenantId: string,
    dto: { url: string; events: string[]; secret?: string },
  ): Promise<WebhookEndpoint> {
    const secret = dto.secret ?? randomBytes(32).toString('hex');
    return this.prisma.webhookEndpoint.create({
      data: { tenantId, url: dto.url, events: dto.events, secret },
    });
  }

  async listEndpoints(tenantId: string): Promise<WebhookEndpoint[]> {
    const endpoints = await this.prisma.webhookEndpoint.findMany({ where: { tenantId, isActive: true } });
    return endpoints.map((e) => ({ ...e, secret: '***' })) as unknown as WebhookEndpoint[];
  }

  async deleteEndpoint(tenantId: string, endpointId: string): Promise<void> {
    const ep = await this.prisma.webhookEndpoint.findFirst({ where: { id: endpointId, tenantId } });
    if (!ep) { throw new NotFoundException('Webhook endpoint not found'); }
    await this.prisma.webhookEndpoint.update({ where: { id: endpointId }, data: { isActive: false } });
  }

  async dispatch(tenantId: string, event: string, payload: Record<string, unknown>): Promise<void> {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { tenantId, isActive: true, events: { has: event } },
    });
    for (const ep of endpoints) {
      this.deliverWebhook(ep, event, payload).catch((err: unknown) => {
        this.logger.error(`Webhook delivery failed for ${ep.url}: ${String(err)}`);
      });
    }
  }

  async testEndpoint(tenantId: string, endpointId: string): Promise<void> {
    const ep = await this.prisma.webhookEndpoint.findFirst({ where: { id: endpointId, tenantId } });
    if (!ep) { throw new NotFoundException('Webhook endpoint not found'); }
    await this.deliverWebhook(ep, 'test.ping', { message: 'EduAI webhook test', timestamp: new Date().toISOString() });
  }

  private async deliverWebhook(
    endpoint: WebhookEndpoint,
    event: string,
    payload: unknown,
    attempt = 1,
  ): Promise<void> {
    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    const signature = `sha256=${createHmac('sha256', endpoint.secret).update(body).digest('hex')}`;
    const deliveryId = randomUUID();

    try {
      const res = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-EduAI-Event': event,
          'X-EduAI-Signature': signature,
          'X-EduAI-Delivery': deliveryId,
        },
        body,
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      this.logger.log(`Webhook delivered: ${event} → ${endpoint.url} [${deliveryId}]`);
    } catch (err) {
      const delays = [0, 5000, 15000, 30000];
      if (attempt < 4) {
        const delay = delays[attempt] ?? 30000;
        this.logger.warn(`Webhook retry ${attempt}/3 in ${delay}ms for ${endpoint.url}`);
        await new Promise((r) => setTimeout(r, delay));
        return this.deliverWebhook(endpoint, event, payload, attempt + 1);
      }
      this.logger.error(`Webhook permanently failed after 3 retries: ${endpoint.url} — ${String(err)}`);
    }
  }
}
