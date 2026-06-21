"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FeatureFlagsService = void 0;
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _redis = require("../cache/redis.service");
var _featureFlags = require("./feature-flags.constants");
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
var FeatureFlagsService_1;
let FeatureFlagsService = exports.FeatureFlagsService = FeatureFlagsService_1 = class FeatureFlagsService {
  logger = new _common.Logger(FeatureFlagsService_1.name);
  CACHE_TTL = 60; // 1 minute
  envOverrides = new Map();
  constructor(config, cache) {
    this.config = config;
    this.cache = cache;
    this.loadEnvOverrides();
  }
  // Check if a feature is enabled for a given context
  async isEnabled(flag, context) {
    // 1. Check env override (highest priority)
    if (this.envOverrides.has(flag)) {
      return this.envOverrides.get(flag);
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
    return _featureFlags.DEFAULT_FLAGS[flag] ?? false;
  }
  // Get all flags for a context (used by frontend to get feature state in one call)
  async getAllFlags(context) {
    const flags = Object.values(_featureFlags.FEATURE_FLAGS);
    const results = {};
    await Promise.all(flags.map(async flag => {
      results[flag] = await this.isEnabled(flag, context);
    }));
    return results;
  }
  // Set a global flag override (super admin only)
  async setGlobalFlag(flag, enabled, updatedBy) {
    const key = this.globalCacheKey(flag);
    const override = {
      enabled,
      updatedAt: new Date().toISOString(),
      updatedBy
    };
    await this.cache.set(key, JSON.stringify(override), 0); // No TTL - persist
    this.logger.log(`Global flag ${flag} set to ${enabled} by ${updatedBy}`);
  }
  // Set a tenant-level flag override (admin only)
  async setTenantFlag(flag, tenantId, enabled, updatedBy) {
    const key = this.tenantCacheKey(flag, tenantId);
    const override = {
      enabled,
      tenantId,
      updatedAt: new Date().toISOString(),
      updatedBy
    };
    await this.cache.set(key, JSON.stringify(override), 0);
    this.logger.log(`Tenant flag ${flag} set to ${enabled} for tenant ${tenantId}`);
  }
  // Reset a flag to its default
  async resetFlag(flag, tenantId) {
    if (tenantId) {
      await this.cache.del(this.tenantCacheKey(flag, tenantId));
    } else {
      await this.cache.del(this.globalCacheKey(flag));
    }
  }
  async getGlobalOverride(flag) {
    const cached = await this.cache.get(this.globalCacheKey(flag));
    if (!cached) {
      return null;
    }
    try {
      const parsed = JSON.parse(cached);
      return parsed.enabled;
    } catch {
      return null;
    }
  }
  async getTenantOverride(flag, tenantId) {
    const cached = await this.cache.get(this.tenantCacheKey(flag, tenantId));
    if (!cached) {
      return null;
    }
    try {
      const parsed = JSON.parse(cached);
      return parsed.enabled;
    } catch {
      return null;
    }
  }
  loadEnvOverrides() {
    for (const [, value] of Object.entries(_featureFlags.FEATURE_FLAGS)) {
      const envKey = `FEATURE_${value.toUpperCase()}`;
      const envVal = this.config.get(envKey);
      if (envVal !== undefined && envVal !== '') {
        this.envOverrides.set(value, envVal === 'true' || envVal === '1');
        this.logger.debug(`Flag ${value} overridden by env: ${envVal}`);
      }
    }
  }
  globalCacheKey(flag) {
    return `feature-flag:global:${flag}`;
  }
  tenantCacheKey(flag, tenantId) {
    return `feature-flag:tenant:${tenantId}:${flag}`;
  }
};
exports.FeatureFlagsService = FeatureFlagsService = FeatureFlagsService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_config.ConfigService)), __param(1, (0, _common.Inject)(_redis.RedisService)), __metadata("design:paramtypes", [Object, Object])], FeatureFlagsService);