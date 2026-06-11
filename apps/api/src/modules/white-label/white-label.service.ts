import * as dns from 'dns';

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';

import { RedisService } from '../cache/redis.service';
import { PrismaService } from '../database/prisma.service';
import { type TenantBranding, DEFAULT_TENANT_BRANDING } from './dto/tenant-branding.interface';
import { type UpdateBrandingDto } from './dto/update-branding.dto';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BrandingConfig {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  customCss?: string;
  emailFrom?: string;
  brandName?: string;
}

export interface UpdateBrandingLegacyDto {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  customCss?: string;
  faviconUrl?: string;
  emailFrom?: string;
  brandName?: string;
}

export interface CustomDomainConfig {
  domain: string | null;
  verificationStatus: 'unset' | 'pending' | 'verified';
}

export type EmailTemplateType =
  | 'welcome'
  | 'password_reset'
  | 'email_verification'
  | 'enrollment_confirmation'
  | 'certificate_issued'
  | 'trial_ending'
  | 'invoice';

export interface EmailTemplate {
  type: EmailTemplateType;
  subject: string;
  htmlContent: string;
  updatedAt: string;
}

export interface FullBrandingExport {
  branding: BrandingConfig;
  customDomain: CustomDomainConfig;
  emailTemplates: EmailTemplate[];
  exportedAt: string;
}

// Default branding values applied on reset
const DEFAULT_BRANDING: BrandingConfig = {
  primaryColor: '#2563EB',
  secondaryColor: '#7C3AED',
  fontFamily: 'Inter, sans-serif',
  customCss: '',
  emailFrom: 'noreply@eduai.app',
  brandName: 'EduAI',
};

// Regex for basic domain format validation
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

// ─── Cache TTLs ───────────────────────────────────────────────────────────────

const BRANDING_TTL = 600; // 10 min

@Injectable()
export class WhiteLabelService {
  private readonly logger = new Logger(WhiteLabelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisService,
  ) {}

  // ─── Private helpers ───────────────────────────────────────────────────────

  private brandingCacheKey(tenantId: string) {
    return `white-label:branding:${tenantId}`;
  }

  private async getWhiteLabelRecord(tenantId: string) {
    return this.prisma.whiteLabel.findUnique({ where: { tenantId } });
  }

  private async getOrCreateRecord(tenantId: string) {
    const existing = await this.getWhiteLabelRecord(tenantId);
    if (existing) {return existing;}

    // Ensure the tenant exists before creating a record
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {throw new NotFoundException('Tenant not found');}

    return this.prisma.whiteLabel.create({
      data: { tenantId, brandName: DEFAULT_BRANDING.brandName ?? 'EduAI' },
    });
  }

  private extractSettings(record: { settings: Prisma.JsonValue }): Record<string, unknown> {
    if (record.settings && typeof record.settings === 'object' && !Array.isArray(record.settings)) {
      return record.settings as Record<string, unknown>;
    }
    return {};
  }

  // ─── getBranding ───────────────────────────────────────────────────────────

  /**
   * Fetch the tenant's full branding configuration.
   * Serves from Redis cache when available.
   */
  async getBranding(tenantId: string): Promise<BrandingConfig> {
    const cacheKey = this.brandingCacheKey(tenantId);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as BrandingConfig;
      } catch {
        // fall through to DB
      }
    }

    const record = await this.getWhiteLabelRecord(tenantId);
    if (!record) {return { ...DEFAULT_BRANDING };}

    const settings = this.extractSettings(record);
    const branding: BrandingConfig = {
      logoUrl: record.logoUrl ?? undefined,
      faviconUrl: record.faviconUrl ?? undefined,
      primaryColor: record.primaryColor,
      secondaryColor: record.secondaryColor,
      fontFamily: (settings.fontFamily as string | undefined) ?? DEFAULT_BRANDING.fontFamily,
      customCss: record.customCss ?? undefined,
      emailFrom: record.emailFrom ?? undefined,
      brandName: record.brandName,
    };

    await this.cache.set(cacheKey, JSON.stringify(branding), BRANDING_TTL);
    return branding;
  }

  // ─── updateBranding ────────────────────────────────────────────────────────

  /**
   * Update logo URL, colors, font family, and custom CSS for the tenant.
   */
  async updateBranding(tenantId: string, dto: UpdateBrandingDto): Promise<BrandingConfig> {
    const record = await this.getOrCreateRecord(tenantId);
    const existingSettings = this.extractSettings(record);

    const newSettings: Prisma.InputJsonValue = {
      ...existingSettings,
      ...(dto.fontFamily !== undefined && { fontFamily: dto.fontFamily }),
    };

    const updated = await this.prisma.whiteLabel.update({
      where: { tenantId },
      data: {
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.faviconUrl !== undefined && { faviconUrl: dto.faviconUrl }),
        ...(dto.primaryColor !== undefined && { primaryColor: dto.primaryColor }),
        ...(dto.secondaryColor !== undefined && { secondaryColor: dto.secondaryColor }),
        ...(dto.customCss !== undefined && { customCss: dto.customCss }),
        ...(dto.emailFrom !== undefined && { emailFrom: dto.emailFrom }),
        ...(dto.brandName !== undefined && { brandName: dto.brandName }),
        settings: newSettings,
      },
    });

    await this.cache.del(this.brandingCacheKey(tenantId));
    this.logger.log(`Branding updated for tenant ${tenantId}`);

    const settings = this.extractSettings(updated);
    return {
      logoUrl: updated.logoUrl ?? undefined,
      faviconUrl: updated.faviconUrl ?? undefined,
      primaryColor: updated.primaryColor,
      secondaryColor: updated.secondaryColor,
      fontFamily: (settings.fontFamily as string | undefined) ?? DEFAULT_BRANDING.fontFamily,
      customCss: updated.customCss ?? undefined,
      emailFrom: updated.emailFrom ?? undefined,
      brandName: updated.brandName,
    };
  }

  // ─── getCustomDomain ───────────────────────────────────────────────────────

  /**
   * Returns the current custom domain configuration for the tenant.
   */
  async getCustomDomain(tenantId: string): Promise<CustomDomainConfig> {
    const record = await this.getWhiteLabelRecord(tenantId);
    if (!record || !record.domain) {
      return { domain: null, verificationStatus: 'unset' };
    }

    const settings = this.extractSettings(record);
    const verificationStatus =
      (settings.domainVerified as boolean) === true ? 'verified' : 'pending';

    return { domain: record.domain, verificationStatus };
  }

  // ─── updateCustomDomain ────────────────────────────────────────────────────

  /**
   * Set or update the custom domain for a tenant.
   * Validates the domain format and checks for conflicts with other tenants.
   */
  async updateCustomDomain(tenantId: string, domain: string): Promise<CustomDomainConfig> {
    const normalized = domain.trim().toLowerCase();

    if (!DOMAIN_REGEX.test(normalized)) {
      throw new BadRequestException(
        `"${domain}" is not a valid domain name. Use the format: example.com`,
      );
    }

    // Check if another tenant already owns this domain
    const conflict = await this.prisma.whiteLabel.findFirst({
      where: { domain: normalized, tenantId: { not: tenantId } },
    });
    if (conflict) {
      throw new BadRequestException('This domain is already in use by another tenant');
    }

    const record = await this.getOrCreateRecord(tenantId);
    const existingSettings = this.extractSettings(record);

    await this.prisma.whiteLabel.update({
      where: { tenantId },
      data: {
        domain: normalized,
        settings: { ...existingSettings, domainVerified: false } as Prisma.InputJsonValue,
      },
    });

    await this.cache.del(this.brandingCacheKey(tenantId));
    this.logger.log(`Custom domain set to "${normalized}" for tenant ${tenantId}`);

    return { domain: normalized, verificationStatus: 'pending' };
  }

  // ─── getEmailTemplates ─────────────────────────────────────────────────────

  /**
   * List all customized email templates for the tenant.
   * Returns only templates that have been explicitly overridden.
   */
  async getEmailTemplates(tenantId: string): Promise<EmailTemplate[]> {
    const record = await this.getWhiteLabelRecord(tenantId);
    if (!record) {return [];}

    const settings = this.extractSettings(record);
    const templates = settings.emailTemplates as Record<string, Omit<EmailTemplate, 'type'>> | undefined;
    if (!templates) {return [];}

    return Object.entries(templates).map(([type, tpl]) => ({
      type: type as EmailTemplateType,
      subject: tpl.subject,
      htmlContent: tpl.htmlContent,
      updatedAt: tpl.updatedAt,
    }));
  }

  // ─── updateEmailTemplate ───────────────────────────────────────────────────

  /**
   * Save an email template override for a specific template type.
   */
  async updateEmailTemplate(
    tenantId: string,
    templateType: EmailTemplateType,
    subject: string,
    htmlContent: string,
  ): Promise<EmailTemplate> {
    if (!subject.trim()) {throw new BadRequestException('Subject cannot be empty');}
    if (!htmlContent.trim()) {throw new BadRequestException('HTML content cannot be empty');}

    const record = await this.getOrCreateRecord(tenantId);
    const existingSettings = this.extractSettings(record);
    const existingTemplates =
      (existingSettings.emailTemplates as Record<string, unknown> | undefined) ?? {};

    const updatedAt = new Date().toISOString();
    const newTemplates = {
      ...existingTemplates,
      [templateType]: { subject, htmlContent, updatedAt },
    };

    await this.prisma.whiteLabel.update({
      where: { tenantId },
      data: {
        settings: {
          ...existingSettings,
          emailTemplates: newTemplates,
        } as Prisma.InputJsonValue,
      },
    });

    await this.cache.del(this.brandingCacheKey(tenantId));
    this.logger.log(`Email template "${templateType}" updated for tenant ${tenantId}`);

    return { type: templateType, subject, htmlContent, updatedAt };
  }

  // ─── resetToDefaults ───────────────────────────────────────────────────────

  /**
   * Wipe all customizations and restore the platform defaults.
   * This also clears the custom domain and any email template overrides.
   */
  async resetToDefaults(tenantId: string): Promise<{ message: string }> {
    const record = await this.getWhiteLabelRecord(tenantId);
    if (!record) {
      throw new NotFoundException('No white-label configuration found for this tenant');
    }

    await this.prisma.whiteLabel.update({
      where: { tenantId },
      data: {
        logoUrl: null,
        faviconUrl: null,
        primaryColor: DEFAULT_BRANDING.primaryColor!,
        secondaryColor: DEFAULT_BRANDING.secondaryColor!,
        customCss: null,
        emailFrom: null,
        domain: null,
        brandName: DEFAULT_BRANDING.brandName!,
        settings: {} as Prisma.InputJsonValue,
      },
    });

    await this.cache.del(this.brandingCacheKey(tenantId));
    this.logger.log(`White-label configuration reset to defaults for tenant ${tenantId}`);

    return { message: 'White-label configuration has been reset to platform defaults' };
  }

  // ─── previewBranding ───────────────────────────────────────────────────────

  /**
   * Return a compiled CSS :root block with custom properties for preview.
   */
  async previewBranding(tenantId: string): Promise<{ css: string; variables: Record<string, string> }> {
    const branding = await this.getBranding(tenantId);

    const variables: Record<string, string> = {
      '--color-primary': branding.primaryColor ?? DEFAULT_BRANDING.primaryColor!,
      '--color-secondary': branding.secondaryColor ?? DEFAULT_BRANDING.secondaryColor!,
      '--font-family': branding.fontFamily ?? DEFAULT_BRANDING.fontFamily!,
    };

    const rootBlock = Object.entries(variables)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');

    const css = `:root {\n${rootBlock}\n}\n${branding.customCss ?? ''}`.trim();

    return { css, variables };
  }

  // ─── exportBrandingConfig ──────────────────────────────────────────────────

  /**
   * Export the full branding configuration as a portable JSON snapshot.
   */
  async exportBrandingConfig(tenantId: string): Promise<FullBrandingExport> {
    const [branding, customDomain, emailTemplates] = await Promise.all([
      this.getBranding(tenantId),
      this.getCustomDomain(tenantId),
      this.getEmailTemplates(tenantId),
    ]);

    return {
      branding,
      customDomain,
      emailTemplates,
      exportedAt: new Date().toISOString(),
    };
  }

  // ─── importBrandingConfig ──────────────────────────────────────────────────

  /**
   * Import branding from a JSON snapshot produced by exportBrandingConfig.
   * Partial imports are supported — only present keys are applied.
   */
  async importBrandingConfig(
    tenantId: string,
    config: Partial<FullBrandingExport>,
  ): Promise<{ imported: string[] }> {
    const imported: string[] = [];

    if (config.branding) {
      await this.updateBranding(tenantId, config.branding);
      imported.push('branding');
    }

    if (config.customDomain?.domain) {
      await this.updateCustomDomain(tenantId, config.customDomain.domain);
      imported.push('customDomain');
    }

    if (config.emailTemplates?.length) {
      for (const tpl of config.emailTemplates) {
        await this.updateEmailTemplate(tenantId, tpl.type, tpl.subject, tpl.htmlContent);
      }
      imported.push(`emailTemplates(${config.emailTemplates.length})`);
    }

    this.logger.log(`Branding config imported for tenant ${tenantId}: [${imported.join(', ')}]`);
    return { imported };
  }

  // ─── Legacy / Compatibility ────────────────────────────────────────────────

  /**
   * @deprecated Use getBranding() instead.
   */
  async getSettings(tenantId: string) {
    const cacheKey = `white-label:${tenantId}`;
    const cached = await this.cache.get(cacheKey);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (cached) {return JSON.parse(cached) as ReturnType<typeof this.prisma.whiteLabel.findUnique>;}

    const settings = await this.prisma.whiteLabel.findUnique({ where: { tenantId } });
    if (settings) {await this.cache.set(cacheKey, JSON.stringify(settings), BRANDING_TTL);}
    return settings;
  }

  /**
   * @deprecated Use updateBranding() instead.
   */
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
    const { settings, ...rest } = dto;
    const jsonSettings = settings as Prisma.InputJsonValue | undefined;
    const result = await this.prisma.whiteLabel.upsert({
      where: { tenantId },
      update: { ...rest, ...(jsonSettings !== undefined && { settings: jsonSettings }) },
      create: {
        tenantId,
        brandName: rest.brandName ?? 'EduAI',
        ...rest,
        ...(jsonSettings !== undefined && { settings: jsonSettings }),
      },
    });

    await this.cache.del(`white-label:${tenantId}`);
    await this.cache.del(this.brandingCacheKey(tenantId));
    return result;
  }

  async getByDomain(domain: string) {
    return this.prisma.whiteLabel.findFirst({
      where: { domain },
      include: { tenant: { select: { id: true, name: true, slug: true, plan: true } } },
    });
  }

  /** @deprecated Use previewBranding() for the full compiled CSS + variables object. */
  async generateThemeCSS(tenantId: string): Promise<string> {
    const { css } = await this.previewBranding(tenantId);
    return css;
  }
}
