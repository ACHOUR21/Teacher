"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WebhooksService = void 0;
var _common = require("@nestjs/common");
var _crypto = require("crypto");
var _prisma = require("../database/prisma.service");
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
var WebhooksService_1;
let WebhooksService = exports.WebhooksService = WebhooksService_1 = class WebhooksService {
  logger = new _common.Logger(WebhooksService_1.name);
  constructor(prisma) {
    this.prisma = prisma;
  }
  async registerEndpoint(tenantId, dto) {
    const secret = dto.secret ?? (0, _crypto.randomBytes)(32).toString('hex');
    return this.prisma.webhookEndpoint.create({
      data: {
        tenantId,
        url: dto.url,
        events: dto.events,
        secret
      }
    });
  }
  async listEndpoints(tenantId) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: {
        tenantId,
        isActive: true
      }
    });
    return endpoints.map(e => ({
      ...e,
      secret: '***'
    }));
  }
  async deleteEndpoint(tenantId, endpointId) {
    const ep = await this.prisma.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        tenantId
      }
    });
    if (!ep) {
      throw new _common.NotFoundException('Webhook endpoint not found');
    }
    await this.prisma.webhookEndpoint.update({
      where: {
        id: endpointId
      },
      data: {
        isActive: false
      }
    });
  }
  async dispatch(tenantId, event, payload) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: {
        tenantId,
        isActive: true,
        events: {
          has: event
        }
      }
    });
    for (const ep of endpoints) {
      this.deliverWebhook(ep, event, payload).catch(err => {
        this.logger.error(`Webhook delivery failed for ${ep.url}: ${String(err)}`);
      });
    }
  }
  async testEndpoint(tenantId, endpointId) {
    const ep = await this.prisma.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        tenantId
      }
    });
    if (!ep) {
      throw new _common.NotFoundException('Webhook endpoint not found');
    }
    await this.deliverWebhook(ep, 'test.ping', {
      message: 'EduAI webhook test',
      timestamp: new Date().toISOString()
    });
  }
  async deliverWebhook(endpoint, event, payload, attempt = 1) {
    const body = JSON.stringify({
      event,
      payload,
      timestamp: new Date().toISOString()
    });
    const signature = `sha256=${(0, _crypto.createHmac)('sha256', endpoint.secret).update(body).digest('hex')}`;
    const deliveryId = (0, _crypto.randomUUID)();
    try {
      const res = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-EduAI-Event': event,
          'X-EduAI-Signature': signature,
          'X-EduAI-Delivery': deliveryId
        },
        body,
        signal: AbortSignal.timeout(5000)
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
        await new Promise(r => setTimeout(r, delay));
        return this.deliverWebhook(endpoint, event, payload, attempt + 1);
      }
      this.logger.error(`Webhook permanently failed after 3 retries: ${endpoint.url} — ${String(err)}`);
    }
  }
};
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], WebhooksService);