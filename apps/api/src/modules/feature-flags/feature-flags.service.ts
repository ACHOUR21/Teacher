import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { RedisService } from '../cache/redis.service';

import { DEFAULT_FLAGS, type FeatureFlag, FEATURE_FLAGS } from './feature-flags.constants';

interface FlagOverride {
  enabled: boolean;
  tenantId?: string;
  userId?: string;
  rolloutPercentage?: number;
  updatedAt: string;
  updatedBy?: string;
}

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);
  private readonly CACHE_TTL = 60; // 1 minute
  private readonly envOverrides: Map<FeatureFlag, boolean> = new Map();

  constructor(
    private readonly config: ConfigService,
    private readonly cache: RedisService,
  ) {
    this.loadEnvOverrides();
  }

  // Check if a feature is enabled for a given context
  async isEnabled(
    flag: FeatureFlag,
    context?: { tenantId?: string; userId?: string },
  ): Promise<boolean> {
    // 1. Check env override (highest priority)
    if (this.envOverrides.has(flag)) {
      return this.envOverrides.get(flag)!;
    }

    // 2. Check tenant-level override from cache/DB
    if (context?.tenantId) {
      const tenantOverride = await this.getTenantOverride(flag, context.tenantId);
      if (tenantOverride !== null) {
        return tenantOverride;
      }
    }

    // 3. Check global override from cache/DB
    const globalOverride = await this.getGlobalOverride(flag);
    if (globalOverride !== null) {
      return globalOverride;
    }

    // 4. Default
    return DEFAULT_FLAGS[flag] ?? false;
  }

  // Get all flags for a context (used by frontend to get feature state in one call)
  async getAllFlags(context?: { tenantId?: string; userId?: string }): Promise<Record<string, boolean>> {
    const flags = Object.values(FEATURE_FLAGS) as FeatureFlag[];
    const results: Record<string, boolean> = {};
    await Promise.all(
      flags.map(async (flag) => {
        results[flag] = await this.isEnabled(flag, context);
      }),
    );
    return results;
  }

  // Set a global flag override (super admin only)
  async setGlobalFlag(flag: FeatureFlag, enabled: boolean, updatedBy: string): Promise<void> {
    const key = this.globalCacheKey(flag);
    const override: FlagOverride = { enabled, updatedAt: new Date().toISOString(), updatedBy };
    await this.cache.set(key, JSON.stringify(override), 0); // No TTL - persist
    this.logger.log(`Global flag ${flag} set to ${enabled} by ${updatedBy}`);
  }

  // Set a tenant-level flag override (admin only)
  async setTenantFlag(
    flag: FeatureFlag,
    tenantId: string,
    enabled: boolean,
    updatedBy: string,
  ): Promise<void> {
    const key = this.tenantCacheKey(flag, tenantId);
    const override: FlagOverride = {
      enabled,
      tenantId,
      updatedAt: new Date().toISOString(),
      updatedBy,
    };
    await this.cache.set(key, JSON.stringify(override), 0);
    this.logger.log(`Tenant flag ${flag} set to ${enabled} for tenant ${tenantId}`);
  }

  // Reset a flag to its default
  async resetFlag(flag: FeatureFlag, tenantId?: string): Promise<void> {
    if (tenantId) {
      await this.cache.del(this.tenantCacheKey(flag, tenantId));
    } else {
      await this.cache.del(this.globalCacheKey(flag));
    }
  }

  private async getGlobalOverride(flag: FeatureFlag): Promise<boolean | null> {
    const cached = await this.cache.get(this.globalCacheKey(flag));
    if (!cached) { return null; }
    try {
      const parsed = JSON.parse(cached) as FlagOverride;
      return parsed.enabled;
    } catch {
      return null;
    }
  }

  private async getTenantOverride(flag: FeatureFlag, tenantId: string): Promise<boolean | null> {
    const cached = await this.cache.get(this.tenantCacheKey(flag, tenantId));
    if (!cached) { return null; }
    try {
      const parsed = JSON.parse(cached) as FlagOverride;
      return parsed.enabled;
    } catch {
      return null;
    }
  }

  private loadEnvOverrides(): void {
    for (const [, value] of Object.entries(FEATURE_FLAGS)) {
      const envKey = `FEATURE_${value.toUpperCase()}`;
      const envVal = this.config.get<string>(envKey);
      if (envVal !== undefined && envVal !== '') {
        this.envOverrides.set(value as FeatureFlag, envVal === 'true' || envVal === '1');
        this.logger.debug(`Flag ${value} overridden by env: ${envVal}`);
      }
    }
  }

  private globalCacheKey(flag: FeatureFlag): string {
    return `feature-flag:global:${flag}`;
  }

  private tenantCacheKey(flag: FeatureFlag, tenantId: string): string {
    return `feature-flag:tenant:${tenantId}:${flag}`;
  }
}
