import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class WhiteLabelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisService,
  ) {}

  async getSettings(tenantId: string) {
    const cacheKey = `white-label:${tenantId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const settings = await this.prisma.whiteLabel.findUnique({ where: { tenantId } });
    if (settings) await this.cache.set(cacheKey, JSON.stringify(settings), 600);
    return settings;
  }

  async upsertSettings(tenantId: string, dto: {
    brandName?: string;
    domain?: string;
    logoUrl?: string;
    faviconUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customCss?: string;
    emailFrom?: string;
    settings?: Record<string, unknown>;
  }) {
    const result = await this.prisma.whiteLabel.upsert({
      where: { tenantId },
      update: dto,
      create: { tenantId, brandName: dto.brandName ?? 'EduAI', ...dto },
    });

    await this.cache.del(`white-label:${tenantId}`);
    return result;
  }

  async getByDomain(domain: string) {
    return this.prisma.whiteLabel.findFirst({
      where: { domain },
      include: { tenant: { select: { id: true, name: true, slug: true, plan: true } } },
    });
  }

  async generateThemeCSS(tenantId: string): Promise<string> {
    const settings = await this.getSettings(tenantId);
    if (!settings) return '';

    return `:root {
  --color-primary: ${settings.primaryColor};
  --color-secondary: ${settings.secondaryColor};
}
${settings.customCss ?? ''}`;
  }
}
