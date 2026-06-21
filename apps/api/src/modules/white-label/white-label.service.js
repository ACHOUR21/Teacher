"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WhiteLabelService = void 0;
var dns = _interopRequireWildcard(require("dns"));
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _redis = require("../cache/redis.service");
var _prisma = require("../database/prisma.service");
var _tenantBranding = require("./dto/tenant-branding.interface");
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
var WhiteLabelService_1;
// Default branding values applied on reset
const DEFAULT_BRANDING = {
  primaryColor: '#2563EB',
  secondaryColor: '#7C3AED',
  fontFamily: 'Inter, sans-serif',
  customCss: '',
  emailFrom: 'noreply@eduai.app',
  brandName: 'EduAI'
};
// Regex for basic domain format validation
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
// ─── Cache TTLs ───────────────────────────────────────────────────────────────
const BRANDING_TTL = 600; // 10 min
let WhiteLabelService = exports.WhiteLabelService = WhiteLabelService_1 = class WhiteLabelService {
  logger = new _common.Logger(WhiteLabelService_1.name);
  constructor(prisma, cache, config) {
    this.prisma = prisma;
    this.cache = cache;
    this.config = config;
  }
  // ─── Private helpers ───────────────────────────────────────────────────────
  brandingCacheKey(tenantId) {
    return `white-label:branding:${tenantId}`;
  }
  async getWhiteLabelRecord(tenantId) {
    return this.prisma.whiteLabel.findUnique({
      where: {
        tenantId
      }
    });
  }
  async getOrCreateRecord(tenantId) {
    const existing = await this.getWhiteLabelRecord(tenantId);
    if (existing) {
      return existing;
    }
    // Ensure the tenant exists before creating a record
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId
      }
    });
    if (!tenant) {
      throw new _common.NotFoundException('Tenant not found');
    }
    return this.prisma.whiteLabel.create({
      data: {
        tenantId,
        brandName: DEFAULT_BRANDING.brandName ?? 'EduAI'
      }
    });
  }
  extractSettings(record) {
    if (record.settings && typeof record.settings === 'object' && !Array.isArray(record.settings)) {
      return record.settings;
    }
    return {};
  }
  // ─── recordToTenantBranding ────────────────────────────────────────────────
  recordToTenantBranding(tenantId, record) {
    const settings = this.extractSettings(record);
    return {
      tenantId,
      logoUrl: record.logoUrl ?? _tenantBranding.DEFAULT_TENANT_BRANDING.logoUrl,
      faviconUrl: record.faviconUrl ?? _tenantBranding.DEFAULT_TENANT_BRANDING.faviconUrl,
      primaryColor: record.primaryColor ?? _tenantBranding.DEFAULT_TENANT_BRANDING.primaryColor,
      secondaryColor: record.secondaryColor ?? _tenantBranding.DEFAULT_TENANT_BRANDING.secondaryColor,
      accentColor: settings.accentColor ?? _tenantBranding.DEFAULT_TENANT_BRANDING.accentColor,
      fontFamily: settings.fontFamily ?? _tenantBranding.DEFAULT_TENANT_BRANDING.fontFamily,
      tagline: settings.tagline ?? _tenantBranding.DEFAULT_TENANT_BRANDING.tagline,
      customCss: record.customCss ?? _tenantBranding.DEFAULT_TENANT_BRANDING.customCss,
      customDomain: record.domain ?? null
    };
  }
  // ─── getBranding ───────────────────────────────────────────────────────────
  /**
   * Fetch the tenant's full branding configuration (TenantBranding shape).
   * Serves from Redis cache when available.
   */
  async getBranding(tenantId) {
    const cacheKey = this.brandingCacheKey(tenantId);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // fall through to DB
      }
    }
    const record = await this.getWhiteLabelRecord(tenantId);
    if (!record) {
      const defaults = {
        tenantId,
        ..._tenantBranding.DEFAULT_TENANT_BRANDING,
        customDomain: null
      };
      return defaults;
    }
    const branding = this.recordToTenantBranding(tenantId, record);
    await this.cache.set(cacheKey, JSON.stringify(branding), BRANDING_TTL);
    return branding;
  }
  // ─── getBrandingLegacy ─────────────────────────────────────────────────────
  /** @deprecated Use getBranding() which now returns TenantBranding. */
  async getBrandingLegacy(tenantId) {
    const cacheKey = this.brandingCacheKey(tenantId);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Convert TenantBranding back to BrandingConfig for compatibility
        return {
          logoUrl: parsed.logoUrl || undefined,
          faviconUrl: parsed.faviconUrl || undefined,
          primaryColor: parsed.primaryColor,
          secondaryColor: parsed.secondaryColor,
          fontFamily: parsed.fontFamily,
          customCss: parsed.customCss || undefined
        };
      } catch {
        // fall through to DB
      }
    }
    const record = await this.getWhiteLabelRecord(tenantId);
    if (!record) {
      return {
        ...DEFAULT_BRANDING
      };
    }
    const settings = this.extractSettings(record);
    const branding = {
      logoUrl: record.logoUrl ?? undefined,
      faviconUrl: record.faviconUrl ?? undefined,
      primaryColor: record.primaryColor,
      secondaryColor: record.secondaryColor,
      fontFamily: settings.fontFamily ?? DEFAULT_BRANDING.fontFamily,
      customCss: record.customCss ?? undefined,
      emailFrom: record.emailFrom ?? undefined,
      brandName: record.brandName
    };
    await this.cache.set(cacheKey, JSON.stringify(branding), BRANDING_TTL);
    return branding;
  }
  // ─── updateBranding ────────────────────────────────────────────────────────
  /**
   * Update logo URL, colors, font family, and custom CSS for the tenant.
   * Accepts the new UpdateBrandingDto (which includes accentColor, tagline).
   */
  async updateBranding(tenantId, dto) {
    const record = await this.getOrCreateRecord(tenantId);
    const existingSettings = this.extractSettings(record);
    const newSettings = {
      ...existingSettings,
      ...(dto.fontFamily !== undefined && {
        fontFamily: dto.fontFamily
      }),
      ...(dto.accentColor !== undefined && {
        accentColor: dto.accentColor
      }),
      ...(dto.tagline !== undefined && {
        tagline: dto.tagline
      })
    };
    const updated = await this.prisma.whiteLabel.update({
      where: {
        tenantId
      },
      data: {
        ...(dto.logoUrl !== undefined && {
          logoUrl: dto.logoUrl
        }),
        ...(dto.faviconUrl !== undefined && {
          faviconUrl: dto.faviconUrl
        }),
        ...(dto.primaryColor !== undefined && {
          primaryColor: dto.primaryColor
        }),
        ...(dto.secondaryColor !== undefined && {
          secondaryColor: dto.secondaryColor
        }),
        ...(dto.customCss !== undefined && {
          customCss: dto.customCss
        }),
        settings: newSettings
      }
    });
    await this.cache.del(this.brandingCacheKey(tenantId));
    this.logger.log(`Branding updated for tenant ${tenantId}`);
    return this.recordToTenantBranding(tenantId, updated);
  }
  // ─── updateBrandingLegacy ──────────────────────────────────────────────────
  /** @deprecated Use updateBranding() with UpdateBrandingDto instead. */
  async updateBrandingLegacy(tenantId, dto) {
    const record = await this.getOrCreateRecord(tenantId);
    const existingSettings = this.extractSettings(record);
    const newSettings = {
      ...existingSettings,
      ...(dto.fontFamily !== undefined && {
        fontFamily: dto.fontFamily
      })
    };
    const updated = await this.prisma.whiteLabel.update({
      where: {
        tenantId
      },
      data: {
        ...(dto.logoUrl !== undefined && {
          logoUrl: dto.logoUrl
        }),
        ...(dto.faviconUrl !== undefined && {
          faviconUrl: dto.faviconUrl
        }),
        ...(dto.primaryColor !== undefined && {
          primaryColor: dto.primaryColor
        }),
        ...(dto.secondaryColor !== undefined && {
          secondaryColor: dto.secondaryColor
        }),
        ...(dto.customCss !== undefined && {
          customCss: dto.customCss
        }),
        ...(dto.emailFrom !== undefined && {
          emailFrom: dto.emailFrom
        }),
        ...(dto.brandName !== undefined && {
          brandName: dto.brandName
        }),
        settings: newSettings
      }
    });
    await this.cache.del(this.brandingCacheKey(tenantId));
    this.logger.log(`Branding updated (legacy) for tenant ${tenantId}`);
    const settings = this.extractSettings(updated);
    return {
      logoUrl: updated.logoUrl ?? undefined,
      faviconUrl: updated.faviconUrl ?? undefined,
      primaryColor: updated.primaryColor,
      secondaryColor: updated.secondaryColor,
      fontFamily: settings.fontFamily ?? DEFAULT_BRANDING.fontFamily,
      customCss: updated.customCss ?? undefined,
      emailFrom: updated.emailFrom ?? undefined,
      brandName: updated.brandName
    };
  }
  // ─── getCustomDomain ───────────────────────────────────────────────────────
  /**
   * Returns the current custom domain configuration for the tenant.
   */
  async getCustomDomain(tenantId) {
    const record = await this.getWhiteLabelRecord(tenantId);
    if (!record || !record.domain) {
      return {
        domain: null,
        verificationStatus: 'unset'
      };
    }
    const settings = this.extractSettings(record);
    const verificationStatus = settings.domainVerified === true ? 'verified' : 'pending';
    return {
      domain: record.domain,
      verificationStatus
    };
  }
  // ─── updateCustomDomain ────────────────────────────────────────────────────
  /**
   * Set or update the custom domain for a tenant.
   * Validates the domain format and checks for conflicts with other tenants.
   */
  async updateCustomDomain(tenantId, domain) {
    const normalized = domain.trim().toLowerCase();
    if (!DOMAIN_REGEX.test(normalized)) {
      throw new _common.BadRequestException(`"${domain}" is not a valid domain name. Use the format: example.com`);
    }
    // Check if another tenant already owns this domain
    const conflict = await this.prisma.whiteLabel.findFirst({
      where: {
        domain: normalized,
        tenantId: {
          not: tenantId
        }
      }
    });
    if (conflict) {
      throw new _common.BadRequestException('This domain is already in use by another tenant');
    }
    const record = await this.getOrCreateRecord(tenantId);
    const existingSettings = this.extractSettings(record);
    await this.prisma.whiteLabel.update({
      where: {
        tenantId
      },
      data: {
        domain: normalized,
        settings: {
          ...existingSettings,
          domainVerified: false
        }
      }
    });
    await this.cache.del(this.brandingCacheKey(tenantId));
    this.logger.log(`Custom domain set to "${normalized}" for tenant ${tenantId}`);
    return {
      domain: normalized,
      verificationStatus: 'pending'
    };
  }
  // ─── getEmailTemplates ─────────────────────────────────────────────────────
  /**
   * List all customized email templates for the tenant.
   * Returns only templates that have been explicitly overridden.
   */
  async getEmailTemplates(tenantId) {
    const record = await this.getWhiteLabelRecord(tenantId);
    if (!record) {
      return [];
    }
    const settings = this.extractSettings(record);
    const templates = settings.emailTemplates;
    if (!templates) {
      return [];
    }
    return Object.entries(templates).map(([type, tpl]) => ({
      type: type,
      subject: tpl.subject,
      htmlContent: tpl.htmlContent,
      updatedAt: tpl.updatedAt
    }));
  }
  // ─── updateEmailTemplate ───────────────────────────────────────────────────
  /**
   * Save an email template override for a specific template type.
   */
  async updateEmailTemplate(tenantId, templateType, subject, htmlContent) {
    if (!subject.trim()) {
      throw new _common.BadRequestException('Subject cannot be empty');
    }
    if (!htmlContent.trim()) {
      throw new _common.BadRequestException('HTML content cannot be empty');
    }
    const record = await this.getOrCreateRecord(tenantId);
    const existingSettings = this.extractSettings(record);
    const existingTemplates = existingSettings.emailTemplates ?? {};
    const updatedAt = new Date().toISOString();
    const newTemplates = {
      ...existingTemplates,
      [templateType]: {
        subject,
        htmlContent,
        updatedAt
      }
    };
    await this.prisma.whiteLabel.update({
      where: {
        tenantId
      },
      data: {
        settings: {
          ...existingSettings,
          emailTemplates: newTemplates
        }
      }
    });
    await this.cache.del(this.brandingCacheKey(tenantId));
    this.logger.log(`Email template "${templateType}" updated for tenant ${tenantId}`);
    return {
      type: templateType,
      subject,
      htmlContent,
      updatedAt
    };
  }
  // ─── resetToDefaults ───────────────────────────────────────────────────────
  /**
   * Wipe all customizations and restore the platform defaults.
   * This also clears the custom domain and any email template overrides.
   */
  async resetToDefaults(tenantId) {
    const record = await this.getWhiteLabelRecord(tenantId);
    if (!record) {
      throw new _common.NotFoundException('No white-label configuration found for this tenant');
    }
    await this.prisma.whiteLabel.update({
      where: {
        tenantId
      },
      data: {
        logoUrl: null,
        faviconUrl: null,
        primaryColor: DEFAULT_BRANDING.primaryColor,
        secondaryColor: DEFAULT_BRANDING.secondaryColor,
        customCss: null,
        emailFrom: null,
        domain: null,
        brandName: DEFAULT_BRANDING.brandName,
        settings: {}
      }
    });
    await this.cache.del(this.brandingCacheKey(tenantId));
    this.logger.log(`White-label configuration reset to defaults for tenant ${tenantId}`);
    return {
      message: 'White-label configuration has been reset to platform defaults'
    };
  }
  // ─── previewBranding ───────────────────────────────────────────────────────
  /**
   * Return a compiled CSS :root block with custom properties for preview.
   */
  async previewBranding(tenantId) {
    const branding = await this.getBranding(tenantId);
    const variables = {
      '--color-primary': branding.primaryColor,
      '--color-secondary': branding.secondaryColor,
      '--color-accent': branding.accentColor,
      '--font-family': branding.fontFamily
    };
    const rootBlock = Object.entries(variables).map(([k, v]) => `  ${k}: ${v};`).join('\n');
    const css = `:root {\n${rootBlock}\n}\n${branding.customCss}`.trim();
    return {
      css,
      variables
    };
  }
  // ─── exportBrandingConfig ──────────────────────────────────────────────────
  /**
   * Export the full branding configuration as a portable JSON snapshot.
   */
  async exportBrandingConfig(tenantId) {
    const [tenantBranding, customDomain, emailTemplates] = await Promise.all([this.getBranding(tenantId), this.getCustomDomain(tenantId), this.getEmailTemplates(tenantId)]);
    // Map TenantBranding to BrandingConfig for the export snapshot
    const branding = {
      logoUrl: tenantBranding.logoUrl || undefined,
      faviconUrl: tenantBranding.faviconUrl || undefined,
      primaryColor: tenantBranding.primaryColor,
      secondaryColor: tenantBranding.secondaryColor,
      fontFamily: tenantBranding.fontFamily,
      customCss: tenantBranding.customCss || undefined
    };
    return {
      branding,
      customDomain,
      emailTemplates,
      exportedAt: new Date().toISOString()
    };
  }
  // ─── importBrandingConfig ──────────────────────────────────────────────────
  /**
   * Import branding from a JSON snapshot produced by exportBrandingConfig.
   * Partial imports are supported — only present keys are applied.
   */
  async importBrandingConfig(tenantId, config) {
    const imported = [];
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
    return {
      imported
    };
  }
  // ─── Legacy / Compatibility ────────────────────────────────────────────────
  /**
   * @deprecated Use getBranding() instead.
   */
  async getSettings(tenantId) {
    const cacheKey = `white-label:${tenantId}`;
    const cached = await this.cache.get(cacheKey);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    if (cached) {
      return JSON.parse(cached);
    }
    const settings = await this.prisma.whiteLabel.findUnique({
      where: {
        tenantId
      }
    });
    if (settings) {
      await this.cache.set(cacheKey, JSON.stringify(settings), BRANDING_TTL);
    }
    return settings;
  }
  /**
   * @deprecated Use updateBranding() instead.
   */
  async upsertSettings(tenantId, dto) {
    const {
      settings,
      ...rest
    } = dto;
    const jsonSettings = settings;
    const result = await this.prisma.whiteLabel.upsert({
      where: {
        tenantId
      },
      update: {
        ...rest,
        ...(jsonSettings !== undefined && {
          settings: jsonSettings
        })
      },
      create: {
        tenantId,
        brandName: rest.brandName ?? 'EduAI',
        ...rest,
        ...(jsonSettings !== undefined && {
          settings: jsonSettings
        })
      }
    });
    await this.cache.del(`white-label:${tenantId}`);
    await this.cache.del(this.brandingCacheKey(tenantId));
    return result;
  }
  async getByDomain(domain) {
    return this.prisma.whiteLabel.findFirst({
      where: {
        domain
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            plan: true
          }
        }
      }
    });
  }
  /** @deprecated Use previewBranding() for the full compiled CSS + variables object. */
  async generateThemeCSS(tenantId) {
    const {
      css
    } = await this.previewBranding(tenantId);
    return css;
  }
  // ─── generateCssVariables ─────────────────────────────────────────────────
  /**
   * Generate a CSS :root block string from a TenantBranding object.
   * This is a pure synchronous utility — no DB or cache access.
   */
  generateCssVariables(branding) {
    const lines = [`  --color-primary: ${branding.primaryColor};`, `  --color-secondary: ${branding.secondaryColor};`, `  --color-accent: ${branding.accentColor};`, `  --font-family: ${branding.fontFamily};`];
    return `:root {\n${lines.join('\n')}\n}`;
  }
  // ─── getAssetUrl ──────────────────────────────────────────────────────────
  /**
   * Return the CDN URL for a per-tenant asset (logo, favicon, banner).
   * Format: {CDN_BASE_URL}/tenants/{tenantId}/{assetType}
   */
  getAssetUrl(tenantId, assetType) {
    const base = this.config.get('CDN_BASE_URL', 'https://cdn.eduai.example.com');
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
  async validateCustomDomain(tenantId, domain) {
    const normalized = domain.trim().toLowerCase();
    if (!DOMAIN_REGEX.test(normalized)) {
      throw new _common.BadRequestException(`"${domain}" is not a valid domain name. Use the format: example.com`);
    }
    const txtRecord = `eduai-verify=${tenantId.substring(0, 8)}`;
    try {
      const records = await dns.promises.resolveTxt(normalized);
      // resolveTxt returns string[][] — each entry is an array of chunks
      const flat = records.map(chunks => chunks.join('')).flat();
      const valid = flat.includes(txtRecord);
      return {
        valid,
        txtRecord
      };
    } catch (err) {
      this.logger.warn(`DNS TXT lookup failed for domain "${normalized}": ${err.message}`);
      return {
        valid: false,
        txtRecord
      };
    }
  }
  // ─── registerCustomDomain ─────────────────────────────────────────────────
  /**
   * Persist the custom domain for a tenant and mark it as pending verification.
   * The cert-manager ClusterIssuer (infra/k8s/cert-manager/cluster-issuer.yaml)
   * will automatically provision a TLS certificate once the domain is verified
   * and a matching Ingress/Certificate resource is created.
   */
  async registerCustomDomain(tenantId, domain) {
    await this.updateCustomDomain(tenantId, domain);
    this.logger.log(`Custom domain "${domain}" registered for tenant ${tenantId}. ` + 'Awaiting DNS TXT verification before cert provisioning.');
  }
  // ─── Phase-7a: getConfig ──────────────────────────────────────────────────
  /**
   * Return the full WhiteLabelConfig for a tenant, merging DB values with defaults.
   * Reads from `whiteLabel` record and maps to the new WhiteLabelConfig shape.
   */
  async getConfig(tenantId) {
    const record = await this.getWhiteLabelRecord(tenantId);
    const settings = record ? this.extractSettings(record) : {};
    const branding = {
      primaryColor: record?.primaryColor ?? _tenantBranding.DEFAULT_TENANT_BRANDING.primaryColor,
      secondaryColor: record?.secondaryColor ?? _tenantBranding.DEFAULT_TENANT_BRANDING.secondaryColor,
      accentColor: settings.accentColor ?? _tenantBranding.DEFAULT_TENANT_BRANDING.accentColor,
      logoUrl: record?.logoUrl ?? undefined,
      faviconUrl: record?.faviconUrl ?? undefined,
      brandName: record?.brandName ?? 'EduAI',
      tagline: settings.tagline ?? undefined,
      fontFamily: settings.fontFamily ?? _tenantBranding.DEFAULT_TENANT_BRANDING.fontFamily,
      borderRadius: settings.borderRadius ?? 'rounded',
      darkModeEnabled: settings.darkModeEnabled ?? false
    };
    const loginPage = settings.customLoginPage;
    return {
      tenantId,
      branding,
      customDomain: record?.domain ?? undefined,
      customEmailDomain: settings.customEmailDomain ?? undefined,
      hideEduAIBranding: settings.hideEduAIBranding ?? false,
      customLoginPage: loginPage,
      features: settings.features ?? {},
      updatedAt: new Date()
    };
  }
  // ─── Phase-7a: updateBrandingV2 ───────────────────────────────────────────
  /**
   * Update branding using the new BrandingConfigV2 shape.
   * Validates hex colors, merges with existing settings.
   */
  async updateBrandingV2(tenantId, partial) {
    const HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
    for (const colorField of ['primaryColor', 'secondaryColor', 'accentColor']) {
      const val = partial[colorField];
      if (val !== undefined && !HEX_REGEX.test(val)) {
        throw new _common.BadRequestException(`Invalid hex color for ${colorField}: "${val}"`);
      }
    }
    const record = await this.getOrCreateRecord(tenantId);
    const existingSettings = this.extractSettings(record);
    const newSettings = {
      ...existingSettings,
      ...(partial.accentColor !== undefined && {
        accentColor: partial.accentColor
      }),
      ...(partial.fontFamily !== undefined && {
        fontFamily: partial.fontFamily
      }),
      ...(partial.tagline !== undefined && {
        tagline: partial.tagline
      }),
      ...(partial.borderRadius !== undefined && {
        borderRadius: partial.borderRadius
      }),
      ...(partial.darkModeEnabled !== undefined && {
        darkModeEnabled: partial.darkModeEnabled
      })
    };
    await this.prisma.whiteLabel.update({
      where: {
        tenantId
      },
      data: {
        ...(partial.primaryColor !== undefined && {
          primaryColor: partial.primaryColor
        }),
        ...(partial.secondaryColor !== undefined && {
          secondaryColor: partial.secondaryColor
        }),
        ...(partial.logoUrl !== undefined && {
          logoUrl: partial.logoUrl
        }),
        ...(partial.faviconUrl !== undefined && {
          faviconUrl: partial.faviconUrl
        }),
        ...(partial.brandName !== undefined && {
          brandName: partial.brandName
        }),
        settings: newSettings
      }
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
  async updateCustomDomainV2(tenantId, domain) {
    const DOMAIN_REGEX_V2 = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
    const normalized = domain.trim().toLowerCase();
    if (!DOMAIN_REGEX_V2.test(normalized)) {
      throw new _common.BadRequestException(`"${domain}" is not a valid domain. Use format: example.com`);
    }
    const conflict = await this.prisma.whiteLabel.findFirst({
      where: {
        domain: normalized,
        tenantId: {
          not: tenantId
        }
      }
    });
    if (conflict) {
      throw new _common.BadRequestException('Domain is already in use by another tenant');
    }
    const record = await this.getOrCreateRecord(tenantId);
    const existingSettings = this.extractSettings(record);
    await this.prisma.whiteLabel.update({
      where: {
        tenantId
      },
      data: {
        domain: normalized,
        settings: {
          ...existingSettings,
          domainVerified: false
        }
      }
    });
    await this.cache.del(this.brandingCacheKey(tenantId));
    this.logger.log(`Custom domain (v2) set to "${normalized}" for tenant ${tenantId}`);
  }
  // ─── Phase-7a: generateCssVariablesV2 ────────────────────────────────────
  /**
   * Generate a :root CSS block from a WhiteLabelConfig.
   */
  generateCssVariablesV2(config) {
    const b = config.branding;
    const lines = [`  --primary: ${b.primaryColor};`, `  --secondary: ${b.secondaryColor};`, `  --accent: ${b.accentColor};`, ...(b.fontFamily ? [`  --font-family: ${b.fontFamily};`] : []), ...(b.borderRadius ? [`  --border-radius: ${b.borderRadius === 'sharp' ? '0' : b.borderRadius === 'pill' ? '9999px' : '0.5rem'};`] : [])];
    return `:root {\n${lines.join('\n')}\n}`;
  }
  // ─── Phase-7a: getPublicBranding ──────────────────────────────────────────
  /**
   * Lightweight public branding response for login page bootstrap.
   * No auth required on the endpoint; reads from DB/cache.
   */
  async getPublicBranding(tenantId) {
    const config = await this.getConfig(tenantId);
    const cssVariables = this.generateCssVariablesV2(config);
    return {
      brandName: config.branding.brandName,
      logoUrl: config.branding.logoUrl,
      primaryColor: config.branding.primaryColor,
      cssVariables
    };
  }
};
exports.WhiteLabelService = WhiteLabelService = WhiteLabelService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_redis.RedisService)), __param(2, (0, _common.Inject)(_config.ConfigService)), __metadata("design:paramtypes", [Object, Object, Object])], WhiteLabelService);