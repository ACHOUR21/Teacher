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

// ─── Phase-7a Interfaces ──────────────────────────────────────────────────────

export interface BrandingConfigV2 {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  brandName: string;
  tagline?: string;
  fontFamily?: string;
  borderRadius?: 'sharp' | 'rounded' | 'pill';
  darkModeEnabled?: boolean;
}

export interface WhiteLabelConfig {
  tenantId: string;
  branding: BrandingConfigV2;
  customDomain?: string;
  customEmailDomain?: string;
  hideEduAIBranding: boolean;
  customLoginPage?: {
    headline?: string;
    subheadline?: string;
    backgroundImageUrl?: string;
  };
  features: Record<string, boolean>;
  updatedAt: Date;
}

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
    private readonly config: ConfigService,
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

  // ─── recordToTenantBranding ────────────────────────────────────────────────

  private recordToTenantBranding(
    tenantId: string,
    record: {
      logoUrl: string | null;
      faviconUrl: string | null;
      primaryColor: string;
      secondaryColor: string;
      customCss: string | null;
      domain: string | null;
      settings: Prisma.JsonValue;
    },
  ): TenantBranding {
    const settings = this.extractSettings(record);
    return {
      tenantId,
      logoUrl: record.logoUrl ?? DEFAULT_TENANT_BRANDING.logoUrl,
      faviconUrl: record.faviconUrl ?? DEFAULT_TENANT_BRANDING.faviconUrl,
      primaryColor: record.primaryColor ?? DEFAULT_TENANT_BRANDING.primaryColor,
      secondaryColor: record.secondaryColor ?? DEFAULT_TENANT_BRANDING.secondaryColor,
      accentColor: (settings.accentColor as string | undefined) ?? DEFAULT_TENANT_BRANDING.accentColor,
      fontFamily: (settings.fontFamily as string | undefined) ?? DEFAULT_TENANT_BRANDING.fontFamily,
      tagline: (settings.tagline as string | undefined) ?? DEFAULT_TENANT_BRANDING.tagline,
      customCss: record.customCss ?? DEFAULT_TENANT_BRANDING.customCss,
      customDomain: record.domain ?? null,
    };
  }

  // ─── getBranding ───────────────────────────────────────────────────────────

  /**
   * Fetch the tenant's full branding configuration (TenantBranding shape).
   * Serves from Redis cache when available.
   */
  async getBranding(tenantId: string): Promise<TenantBranding> {
    const cacheKey = this.brandingCacheKey(tenantId);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as TenantBranding;
      } catch {
        // fall through to DB
      }
    }

    const record = await this.getWhiteLabelRecord(tenantId);
    if (!record) {
      const defaults: TenantBranding = {
        tenantId,
        ...DEFAULT_TENANT_BRANDING,
        customDomain: null,
      };
      return defaults;
    }

    const branding = this.recordToTenantBranding(tenantId, record);
    await this.cache.set(cacheKey, JSON.stringify(branding), BRANDING_TTL);
    return branding;
  }

  // ─── getBrandingLegacy ─────────────────────────────────────────────────────

  /** @deprecated Use getBranding() which now returns TenantBranding. */
  async getBrandingLegacy(tenantId: string): Promise<BrandingConfig> {
    const cacheKey = this.brandingCacheKey(tenantId);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as TenantBranding;
        // Convert TenantBranding back to BrandingConfig for compatibility
        return {
          logoUrl: parsed.logoUrl || undefined,
          faviconUrl: parsed.faviconUrl || undefined,
          primaryColor: parsed.primaryColor,
          secondaryColor: parsed.secondaryColor,
          fontFamily: parsed.fontFamily,
          customCss: parsed.customCss || undefined,
        };
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
   * Accepts the new UpdateBrandingDto (which includes accentColor, tagline).
   */
  async updateBranding(tenantId: string, dto: UpdateBrandingDto): Promise<TenantBranding> {
    const record = await this.getOrCreateRecord(tenantId);
    const existingSettings = this.extractSettings(record);

    const newSettings: Prisma.InputJsonValue = {
      ...existingSettings,
      ...(dto.fontFamily !== undefined && { fontFamily: dto.fontFamily }),
      ...(dto.accentColor !== undefined && { accentColor: dto.accentColor }),
      ...(dto.tagline !== undefined && { tagline: dto.tagline }),
    };

    const updated = await this.prisma.whiteLabel.update({
      where: { tenantId },
      data: {
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.faviconUrl !== undefined && { faviconUrl: dto.faviconUrl }),
        ...(dto.primaryColor !== undefined && { primaryColor: dto.primaryColor }),
        ...(dto.secondaryColor !== undefined && { secondaryColor: dto.secondaryColor }),
        ...(dto.customCss !== undefined && { customCss: dto.customCss }),
        settings: newSettings,
      },
    });

    await this.cache.del(this.brandingCacheKey(tenantId));
    this.logger.log(`Branding updated for tenant ${tenantId}`);

    return this.recordToTenantBranding(tenantId, updated);
  }

  // ─── updateBrandingLegacy ──────────────────────────────────────────────────

  /** @deprecated Use updateBranding() with UpdateBrandingDto instead. */
  async updateBrandingLegacy(tenantId: string, dto: UpdateBrandingLegacyDto): Promise<BrandingConfig> {
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
    this.logger.log(`Branding updated (legacy) for tenant ${tenantId}`);

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
      '--color-primary': branding.primaryColor,
      '--color-secondary': branding.secondaryColor,
      '--color-accent': branding.accentColor,
      '--font-family': branding.fontFamily,
    };

    const rootBlock = Object.entries(variables)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');

    const css = `:root {\n${rootBlock}\n}\n${branding.customCss}`.trim();

    return { css, variables };
  }

  // ─── exportBrandingConfig ──────────────────────────────────────────────────

  /**
   * Export the full branding configuration as a portable JSON snapshot.
   */
  async exportBrandingConfig(tenantId: string): Promise<FullBrandingExport> {
    const [tenantBranding, customDomain, emailTemplates] = await Promise.all([
      this.getBranding(tenantId),
      this.getCustomDomain(tenantId),
      this.getEmailTemplates(tenantId),
    ]);

    // Map TenantBranding to BrandingConfig for the export snapshot
    const branding: BrandingConfig = {
      logoUrl: tenantBranding.logoUrl || undefined,
      faviconUrl: tenantBranding.faviconUrl || undefined,
      primaryColor: tenantBranding.primaryColor,
      secondaryColor: tenantBranding.secondaryColor,
      fontFamily: tenantBranding.fontFamily,
      customCss: tenantBranding.customCss || undefined,
    };

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
      await this.updateBrandingLegacy(tenantId, config.branding);
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

  // ─── generateCssVariables ─────────────────────────────────────────────────

  /**
   * Generate a CSS :root block string from a TenantBranding object.
   * This is a pure synchronous utility — no DB or cache access.
   */
  generateCssVariables(branding: TenantBranding): string {
    const lines = [
      `  --color-primary: ${branding.primaryColor};`,
      `  --color-secondary: ${branding.secondaryColor};`,
      `  --color-accent: ${branding.accentColor};`,
      `  --font-family: ${branding.fontFamily};`,
    ];
    return `:root {\n${lines.join('\n')}\n}`;
  }

  // ─── getAssetUrl ──────────────────────────────────────────────────────────

  /**
   * Return the CDN URL for a per-tenant asset (logo, favicon, banner).
   * Format: {CDN_BASE_URL}/tenants/{tenantId}/{assetType}
   */
  getAssetUrl(tenantId: string, assetType: 'logo' | 'favicon' | 'banner'): string {
    const base = this.config.get<string>('CDN_BASE_URL', 'https://cdn.eduai.example.com');
    return `${base}/tenants/${tenantId}/${assetType}`;
  }

  // ─── validateCustomDomain ─────────────────────────────────────────────────

  /**
   * Validate that the tenant has added the expected DNS TXT record for
   * domain ownership verification.
   *
   * Returns { valid: boolean; txtRecord: string } where txtRecord is the
   * expected value the tenant must add.
   */
  async validateCustomDomain(
    tenantId: string,
    domain: string,
  ): Promise<{ valid: boolean; txtRecord: string }> {
    const normalized = domain.trim().toLowerCase();

    if (!DOMAIN_REGEX.test(normalized)) {
      throw new BadRequestException(
        `"${domain}" is not a valid domain name. Use the format: example.com`,
      );
    }

    const txtRecord = `eduai-verify=${tenantId.substring(0, 8)}`;

    try {
      const records = await dns.promises.resolveTxt(normalized);
      // resolveTxt returns string[][] — each entry is an array of chunks
      const flat = records.map((chunks) => chunks.join('')).flat();
      const valid = flat.includes(txtRecord);
      return { valid, txtRecord };
    } catch (err) {
      this.logger.warn(
        `DNS TXT lookup failed for domain "${normalized}": ${(err as Error).message}`,
      );
      return { valid: false, txtRecord };
    }
  }

  // ─── registerCustomDomain ─────────────────────────────────────────────────

  /**
   * Persist the custom domain for a tenant and mark it as pending verification.
   * The cert-manager ClusterIssuer (infra/k8s/cert-manager/cluster-issuer.yaml)
   * will automatically provision a TLS certificate once the domain is verified
   * and a matching Ingress/Certificate resource is created.
   */
  async registerCustomDomain(tenantId: string, domain: string): Promise<void> {
    await this.updateCustomDomain(tenantId, domain);
    this.logger.log(
      `Custom domain "${domain}" registered for tenant ${tenantId}. ` +
      'Awaiting DNS TXT verification before cert provisioning.',
    );
  }

  // ─── Phase-7a: getConfig ──────────────────────────────────────────────────

  /**
   * Return the full WhiteLabelConfig for a tenant, merging DB values with defaults.
   * Reads from `whiteLabel` record and maps to the new WhiteLabelConfig shape.
   */
  async getConfig(tenantId: string): Promise<WhiteLabelConfig> {
    const record = await this.getWhiteLabelRecord(tenantId);
    const settings = record ? this.extractSettings(record) : {};

    const branding: BrandingConfigV2 = {
      primaryColor: record?.primaryColor ?? DEFAULT_TENANT_BRANDING.primaryColor,
      secondaryColor: record?.secondaryColor ?? DEFAULT_TENANT_BRANDING.secondaryColor,
      accentColor: (settings.accentColor as string | undefined) ?? DEFAULT_TENANT_BRANDING.accentColor,
      logoUrl: record?.logoUrl ?? undefined,
      faviconUrl: record?.faviconUrl ?? undefined,
      brandName: record?.brandName ?? 'EduAI',
      tagline: (settings.tagline as string | undefined) ?? undefined,
      fontFamily: (settings.fontFamily as string | undefined) ?? DEFAULT_TENANT_BRANDING.fontFamily,
      borderRadius: (settings.borderRadius as BrandingConfigV2['borderRadius']) ?? 'rounded',
      darkModeEnabled: (settings.darkModeEnabled as boolean | undefined) ?? false,
    };

    const loginPage = settings.customLoginPage as WhiteLabelConfig['customLoginPage'] | undefined;

    return {
      tenantId,
      branding,
      customDomain: record?.domain ?? undefined,
      customEmailDomain: (settings.customEmailDomain as string | undefined) ?? undefined,
      hideEduAIBranding: (settings.hideEduAIBranding as boolean | undefined) ?? false,
      customLoginPage: loginPage,
      features: (settings.features as Record<string, boolean> | undefined) ?? {},
      updatedAt: new Date(),
    };
  }

  // ─── Phase-7a: updateBrandingV2 ───────────────────────────────────────────

  /**
   * Update branding using the new BrandingConfigV2 shape.
   * Validates hex colors, merges with existing settings.
   */
  async updateBrandingV2(tenantId: string, partial: Partial<BrandingConfigV2>): Promise<WhiteLabelConfig> {
    const HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

    for (const colorField of ['primaryColor', 'secondaryColor', 'accentColor'] as const) {
      const val = partial[colorField];
      if (val !== undefined && !HEX_REGEX.test(val)) {
        throw new BadRequestException(`Invalid hex color for ${colorField}: "${val}"`);
      }
    }

    const record = await this.getOrCreateRecord(tenantId);
    const existingSettings = this.extractSettings(record);

    const newSettings: Prisma.InputJsonValue = {
      ...existingSettings,
      ...(partial.accentColor !== undefined && { accentColor: partial.accentColor }),
      ...(partial.fontFamily !== undefined && { fontFamily: partial.fontFamily }),
      ...(partial.tagline !== undefined && { tagline: partial.tagline }),
      ...(partial.borderRadius !== undefined && { borderRadius: partial.borderRadius }),
      ...(partial.darkModeEnabled !== undefined && { darkModeEnabled: partial.darkModeEnabled }),
    };

    await this.prisma.whiteLabel.update({
      where: { tenantId },
      data: {
        ...(partial.primaryColor !== undefined && { primaryColor: partial.primaryColor }),
        ...(partial.secondaryColor !== undefined && { secondaryColor: partial.secondaryColor }),
        ...(partial.logoUrl !== undefined && { logoUrl: partial.logoUrl }),
        ...(partial.faviconUrl !== undefined && { faviconUrl: partial.faviconUrl }),
        ...(partial.brandName !== undefined && { brandName: partial.brandName }),
        settings: newSettings,
      },
    });

    await this.cache.del(this.brandingCacheKey(tenantId));
    this.logger.log(`Branding (v2) updated for tenant ${tenantId}`);

    return this.getConfig(tenantId);
  }

  // ─── Phase-7a: updateCustomDomainV2 ──────────────────────────────────────

  /**
   * Set custom domain using basic format validation per spec.
   * Stores in `whiteLabel.domain`.
   */
  async updateCustomDomainV2(tenantId: string, domain: string): Promise<void> {
    const DOMAIN_REGEX_V2 = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
    const normalized = domain.trim().toLowerCase();

    if (!DOMAIN_REGEX_V2.test(normalized)) {
      throw new BadRequestException(
        `"${domain}" is not a valid domain. Use format: example.com`,
      );
    }

    const conflict = await this.prisma.whiteLabel.findFirst({
      where: { domain: normalized, tenantId: { not: tenantId } },
    });
    if (conflict) {
      throw new BadRequestException('Domain is already in use by another tenant');
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
    this.logger.log(`Custom domain (v2) set to "${normalized}" for tenant ${tenantId}`);
  }

  // ─── Phase-7a: generateCssVariablesV2 ────────────────────────────────────

  /**
   * Generate a :root CSS block from a WhiteLabelConfig.
   */
  generateCssVariablesV2(config: WhiteLabelConfig): string {
    const b = config.branding;
    const lines = [
      `  --primary: ${b.primaryColor};`,
      `  --secondary: ${b.secondaryColor};`,
      `  --accent: ${b.accentColor};`,
      ...(b.fontFamily ? [`  --font-family: ${b.fontFamily};`] : []),
      ...(b.borderRadius ? [`  --border-radius: ${b.borderRadius === 'sharp' ? '0' : b.borderRadius === 'pill' ? '9999px' : '0.5rem'};`] : []),
    ];
    return `:root {\n${lines.join('\n')}\n}`;
  }

  // ─── Phase-7a: getPublicBranding ──────────────────────────────────────────

  /**
   * Lightweight public branding response for login page bootstrap.
   * No auth required on the endpoint; reads from DB/cache.
   */
  async getPublicBranding(tenantId: string): Promise<{
    brandName: string;
    logoUrl?: string;
    primaryColor: string;
    cssVariables: string;
  }> {
    const config = await this.getConfig(tenantId);
    const cssVariables = this.generateCssVariablesV2(config);

    return {
      brandName: config.branding.brandName,
      logoUrl: config.branding.logoUrl,
      primaryColor: config.branding.primaryColor,
      cssVariables,
    };
  }
}
