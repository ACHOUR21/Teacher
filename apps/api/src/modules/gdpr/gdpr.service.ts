import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConsentType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../database/prisma.service';


@Injectable()
export class GdprService {
  private readonly logger = new Logger(GdprService.name);
  // Anonymized placeholder values
  private readonly ANON_EMAIL = (id: string) => `deleted-${id}@anon.local`;
  private readonly GRACE_DAYS = 30;

  constructor(private prisma: PrismaService) {}

  // ── Data Export (Article 15 / 20) ─────────────────────────────────────────

  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        sessions: {
          select: { id: true, deviceId: true, ipAddress: true, userAgent: true, createdAt: true, expiresAt: true },
        },
        devices: {
          select: { id: true, deviceId: true, deviceName: true, deviceType: true, lastSeenAt: true, createdAt: true },
        },
        consents: true,
        issuedCertificates: {
          select: { id: true, verifyCode: true, issuedAt: true },
        },
        examAttempts: {
          select: { id: true, score: true, startedAt: true, submittedAt: true },
        },
        flashcardReviews: {
          select: { id: true, rating: true, interval: true, reviewedAt: true },
        },
        auditLogs: {
          select: { id: true, action: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 500,
        },
      },
    });

    if (!user) {throw new NotFoundException('User not found');}

    // Strip sensitive fields
    const { passwordHash, mfaSecret, mfaBackupCodes, ...safeUser } = user as any;
    void passwordHash; void mfaSecret; void mfaBackupCodes;

    this.logger.log(`Data export generated for user ${userId}`);
    return {
      exportedAt: new Date().toISOString(),
      schema: '1.0',
      data: safeUser,
    };
  }

  // ── Consent Management (Article 6/7) ─────────────────────────────────────

  async getConsents(userId: string) {
    return this.prisma.userConsent.findMany({
      where: { userId },
      orderBy: { grantedAt: 'desc' },
    });
  }

  async upsertConsents(
    userId: string,
    tenantId: string,
    consents: { type: ConsentType; granted: boolean; version?: string }[],
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    const now = new Date();
    await Promise.all(
      consents.map(async (c) => {
        await this.prisma.userConsent.upsert({
          where: { userId_type: { userId, type: c.type } },
          update: {
            granted: c.granted,
            version: c.version ?? '1.0',
            revokedAt: c.granted ? null : now,
            grantedAt: c.granted ? now : undefined,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
          },
          create: {
            userId,
            tenantId,
            type: c.type,
            granted: c.granted,
            version: c.version ?? '1.0',
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            grantedAt: now,
          },
        });
      }),
    );
    this.logger.log(`Consents updated for user ${userId}`);
  }

  // ── Right to Erasure (Article 17) ─────────────────────────────────────────

  async requestDeletion(userId: string, tenantId: string, reason?: string) {
    const existing = await this.prisma.dataDeletionRequest.findUnique({ where: { userId } });
    if (existing && existing.status === 'PENDING') {
      return existing;
    }

    const scheduledFor = new Date(Date.now() + this.GRACE_DAYS * 24 * 60 * 60 * 1000);

    const request = await this.prisma.dataDeletionRequest.upsert({
      where: { userId },
      update: { status: 'PENDING', scheduledFor, reason, requestedAt: new Date(), completedAt: null },
      create: { userId, tenantId, reason, scheduledFor },
    });

    // Disable account immediately while in grace period
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    this.logger.warn(`Deletion requested for user ${userId}, scheduled for ${scheduledFor.toISOString()}`);
    return { scheduledFor, graceDays: this.GRACE_DAYS };
  }

  async cancelDeletion(userId: string) {
    const request = await this.prisma.dataDeletionRequest.findUnique({ where: { userId } });
    if (!request || request.status !== 'PENDING') {
      throw new BadRequestException('No pending deletion request found');
    }

    await this.prisma.dataDeletionRequest.update({
      where: { userId },
      data: { status: 'CANCELLED' },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    this.logger.log(`Deletion cancelled for user ${userId}`);
  }

  async getDeletionRequest(userId: string) {
    return this.prisma.dataDeletionRequest.findUnique({ where: { userId } });
  }

  // ── Scheduled Anonymisation (called by a cron task) ───────────────────────

  async processScheduledDeletions(): Promise<number> {
    const due = await this.prisma.dataDeletionRequest.findMany({
      where: { status: 'PENDING', scheduledFor: { lte: new Date() } },
    });

    let processed = 0;
    for (const req of due) {
      try {
        await this.anonymizeUser(req.userId);
        await this.prisma.dataDeletionRequest.update({
          where: { id: req.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        processed++;
      } catch (err) {
        this.logger.error(`Failed to anonymize user ${req.userId}: ${err}`);
      }
    }

    if (processed > 0) {this.logger.log(`Anonymized ${processed} user(s)`);}
    return processed;
  }

  private async anonymizeUser(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {return;}

    const anonEmail = this.ANON_EMAIL(userId);
    const anonHash = await bcrypt.hash(crypto.randomUUID(), 12);

    await this.prisma.$transaction([
      // Wipe PII from user row
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: anonEmail,
          firstName: 'Deleted',
          lastName: 'User',
          phone: null,
          avatarUrl: null,
          passwordHash: anonHash,
          mfaSecret: null,
          mfaBackupCodes: [],
          isActive: false,
          emailVerified: false,
        },
      }),
      // Wipe profile PII
      this.prisma.userProfile.updateMany({
        where: { userId },
        data: { bio: null, address: undefined, socialLinks: '{}' },
      }),
      // Delete all sessions and devices
      this.prisma.userSession.deleteMany({ where: { userId } }),
      this.prisma.userDevice.deleteMany({ where: { userId } }),
    ]);

    this.logger.warn(`User ${userId} anonymized (GDPR erasure)`);
  }
}
