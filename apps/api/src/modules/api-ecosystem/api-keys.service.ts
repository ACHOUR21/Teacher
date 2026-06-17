import { randomBytes } from 'crypto';

import * as bcrypt from 'bcrypt';
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

// ─── DTOs & Result Types ─────────────────────────────────────────────────────

export interface CreateApiKeyDto {
  name: string;
  scopes: string[];
  rateLimit?: number;
  expiresInDays?: number;
}

export interface ApiKeyResult {
  id: string;
  name: string;
  key: string;       // only returned on creation: "eak_<64-char-hex>"
  keyPrefix: string;
  scopes: string[];
  rateLimit: number;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface ApiKeyListItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface ValidatedKeyContext {
  userId: string;
  tenantId: string;
  scopes: string[];
}

export interface ApiKeyUsageStat {
  keyId: string;
  name: string;
  requestsToday: number;
  requestsThisMonth: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a new API key, bcrypt-hash it for storage, and return the plain
   * key exactly once (it will never be retrievable again).
   */
  async createApiKey(
    userId: string,
    tenantId: string,
    dto: CreateApiKeyDto,
  ): Promise<ApiKeyResult> {
    const rawHex = randomBytes(32).toString('hex');           // 64 hex chars
    const rawKey = `eak_${rawHex}`;                          // "eak_<64>"
    const keyPrefix = rawKey.substring(0, 12);               // "eak_" + 8 hex

    const keyHash = await bcrypt.hash(rawKey, 10);

    const expiresAt = dto.expiresInDays
      ? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

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
        isActive: true,
      },
    });

    return {
      id: created.id,
      name: created.name,
      key: rawKey,
      keyPrefix: created.keyPrefix,
      scopes: created.scopes,
      rateLimit: created.rateLimit,
      expiresAt: created.expiresAt,
      createdAt: created.createdAt,
    };
  }

  /**
   * List all API keys for a user (never returns keyHash).
   */
  async listApiKeys(
    userId: string,
    tenantId: string,
  ): Promise<ApiKeyListItem[]> {
    return this.prisma.apiKey.findMany({
      where: { userId, tenantId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        rateLimit: true,
        isActive: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Revoke (soft-delete) an API key.
   */
  async revokeApiKey(
    userId: string,
    tenantId: string,
    keyId: string,
  ): Promise<void> {
    const existing = await this.prisma.apiKey.findFirst({
      where: { id: keyId, userId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
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
  async validateApiKey(rawKey: string): Promise<ValidatedKeyContext | null> {
    if (!rawKey.startsWith('eak_')) {
      return null;
    }

    const keyPrefix = rawKey.substring(0, 12);

    const candidates = await this.prisma.apiKey.findMany({
      where: { keyPrefix, isActive: true },
      select: {
        id: true,
        userId: true,
        tenantId: true,
        keyHash: true,
        scopes: true,
        isActive: true,
        expiresAt: true,
      },
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
        where: { id: candidate.id },
        data: { lastUsedAt: new Date() },
      });

      return {
        userId: candidate.userId,
        tenantId: candidate.tenantId,
        scopes: candidate.scopes,
      };
    }

    return null;
  }

  /**
   * Return per-key usage statistics.
   * In production these would be stored in Redis counters; here we return
   * placeholder 0s alongside real key metadata.
   */
  async getUsageStats(
    userId: string,
    tenantId: string,
  ): Promise<ApiKeyUsageStat[]> {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId, tenantId },
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' },
    });

    // Placeholder: in production read Redis counters keyed by keyId + date
    return keys.map(k => ({
      keyId: k.id,
      name: k.name,
      requestsToday: 0,
      requestsThisMonth: 0,
    }));
  }
}
