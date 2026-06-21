"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ApiKeysService = void 0;
var _crypto = require("crypto");
var bcrypt = _interopRequireWildcard(require("bcrypt"));
var _common = require("@nestjs/common");
var _prisma = require("../database/prisma.service");
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
// ─── Service ─────────────────────────────────────────────────────────────────
let ApiKeysService = exports.ApiKeysService = class ApiKeysService {
  constructor(prisma) {
    this.prisma = prisma;
  }
  /**
   * Generate a new API key, bcrypt-hash it for storage, and return the plain
   * key exactly once (it will never be retrievable again).
   */
  async createApiKey(userId, tenantId, dto) {
    const rawHex = (0, _crypto.randomBytes)(32).toString('hex'); // 64 hex chars
    const rawKey = `eak_${rawHex}`; // "eak_<64>"
    const keyPrefix = rawKey.substring(0, 12); // "eak_" + 8 hex
    const keyHash = await bcrypt.hash(rawKey, 10);
    const expiresAt = dto.expiresInDays ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000) : null;
    const created = await this.prisma.apiKey.create({
      data: {
        tenantId,
        userId,
        name: dto.name,
        keyHash,
        keyPrefix,
        scopes: dto.scopes,
        rateLimit: dto.rateLimit ?? 1000,
        expiresAt,
        isActive: true
      }
    });
    return {
      id: created.id,
      name: created.name,
      key: rawKey,
      keyPrefix: created.keyPrefix,
      scopes: created.scopes,
      rateLimit: created.rateLimit,
      expiresAt: created.expiresAt,
      createdAt: created.createdAt
    };
  }
  /**
   * List all API keys for a user (never returns keyHash).
   */
  async listApiKeys(userId, tenantId) {
    return this.prisma.apiKey.findMany({
      where: {
        userId,
        tenantId
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        rateLimit: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
  /**
   * Revoke (soft-delete) an API key.
   */
  async revokeApiKey(userId, tenantId, keyId) {
    const existing = await this.prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId,
        tenantId
      }
    });
    if (!existing) {
      throw new _common.NotFoundException('API key not found');
    }
    await this.prisma.apiKey.update({
      where: {
        id: keyId
      },
      data: {
        isActive: false
      }
    });
  }
  /**
   * Validate a raw API key from an incoming request.
   * Finds by prefix (first 12 chars), then bcrypt-compares against all
   * candidate keys for that prefix, then checks isActive and expiry.
   * Updates lastUsedAt on success.
   *
   * Returns null if the key is invalid/expired/revoked.
   */
  async validateApiKey(rawKey) {
    if (!rawKey.startsWith('eak_')) {
      return null;
    }
    const keyPrefix = rawKey.substring(0, 12);
    const candidates = await this.prisma.apiKey.findMany({
      where: {
        keyPrefix,
        isActive: true
      },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        keyHash: true,
        scopes: true,
        isActive: true,
        expiresAt: true
      }
    });
    for (const candidate of candidates) {
      const match = await bcrypt.compare(rawKey, candidate.keyHash);
      if (!match) continue;
      // Check expiry
      if (candidate.expiresAt && candidate.expiresAt < new Date()) {
        return null;
      }
      // Update lastUsedAt asynchronously (fire-and-forget)
      void this.prisma.apiKey.update({
        where: {
          id: candidate.id
        },
        data: {
          lastUsedAt: new Date()
        }
      });
      return {
        userId: candidate.userId,
        tenantId: candidate.tenantId,
        scopes: candidate.scopes
      };
    }
    return null;
  }
  /**
   * Return per-key usage statistics.
   * In production these would be stored in Redis counters; here we return
   * placeholder 0s alongside real key metadata.
   */
  async getUsageStats(userId, tenantId) {
    const keys = await this.prisma.apiKey.findMany({
      where: {
        userId,
        tenantId
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    // Placeholder: in production read Redis counters keyed by keyId + date
    return keys.map(k => ({
      keyId: k.id,
      name: k.name,
      requestsToday: 0,
      requestsThisMonth: 0
    }));
  }
};
exports.ApiKeysService = ApiKeysService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], ApiKeysService);