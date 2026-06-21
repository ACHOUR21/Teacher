"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GdprService = void 0;
var _common = require("@nestjs/common");
var bcrypt = _interopRequireWildcard(require("bcrypt"));
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
var GdprService_1;
let GdprService = exports.GdprService = GdprService_1 = class GdprService {
  logger = new _common.Logger(GdprService_1.name);
  // Anonymized placeholder values
  ANON_EMAIL = id => `deleted-${id}@anon.local`;
  GRACE_DAYS = 30;
  constructor(prisma) {
    this.prisma = prisma;
  }
  // ── Data Export (Article 15 / 20) ─────────────────────────────────────────
  async exportUserData(userId) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        profile: true,
        sessions: {
          select: {
            id: true,
            deviceId: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
            expiresAt: true
          }
        },
        devices: {
          select: {
            id: true,
            deviceId: true,
            deviceName: true,
            deviceType: true,
            lastSeenAt: true,
            createdAt: true
          }
        },
        consents: true,
        issuedCertificates: {
          select: {
            id: true,
            verifyCode: true,
            issuedAt: true
          }
        },
        examAttempts: {
          select: {
            id: true,
            score: true,
            startedAt: true,
            submittedAt: true
          }
        },
        flashcardReviews: {
          select: {
            id: true,
            rating: true,
            interval: true,
            reviewedAt: true
          }
        },
        auditLogs: {
          select: {
            id: true,
            action: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 500
        }
      }
    });
    if (!user) {
      throw new _common.NotFoundException('User not found');
    }
    // Strip sensitive fields
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const {
      passwordHash,
      mfaSecret,
      mfaBackupCodes,
      ...safeUser
    } = user;
    void passwordHash;
    void mfaSecret;
    void mfaBackupCodes;
    this.logger.log(`Data export generated for user ${userId}`);
    return {
      exportedAt: new Date().toISOString(),
      schema: '1.0',
      data: safeUser
    };
  }
  // ── Consent Management (Article 6/7) ─────────────────────────────────────
  async getConsents(userId) {
    return this.prisma.userConsent.findMany({
      where: {
        userId
      },
      orderBy: {
        grantedAt: 'desc'
      }
    });
  }
  async upsertConsents(userId, tenantId, consents, meta) {
    const now = new Date();
    await Promise.all(consents.map(async c => {
      await this.prisma.userConsent.upsert({
        where: {
          userId_type: {
            userId,
            type: c.type
          }
        },
        update: {
          granted: c.granted,
          version: c.version ?? '1.0',
          revokedAt: c.granted ? null : now,
          grantedAt: c.granted ? now : undefined,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent
        },
        create: {
          userId,
          tenantId,
          type: c.type,
          granted: c.granted,
          version: c.version ?? '1.0',
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          grantedAt: now
        }
      });
    }));
    this.logger.log(`Consents updated for user ${userId}`);
  }
  // ── Right to Erasure (Article 17) ─────────────────────────────────────────
  async requestDeletion(userId, tenantId, reason) {
    const existing = await this.prisma.dataDeletionRequest.findUnique({
      where: {
        userId
      }
    });
    if (existing && existing.status === 'PENDING') {
      return existing;
    }
    const scheduledFor = new Date(Date.now() + this.GRACE_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.dataDeletionRequest.upsert({
      where: {
        userId
      },
      update: {
        status: 'PENDING',
        scheduledFor,
        reason,
        requestedAt: new Date(),
        completedAt: null
      },
      create: {
        userId,
        tenantId,
        reason,
        scheduledFor
      }
    });
    // Disable account immediately while in grace period
    await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        isActive: false
      }
    });
    this.logger.warn(`Deletion requested for user ${userId}, scheduled for ${scheduledFor.toISOString()}`);
    return {
      scheduledFor,
      graceDays: this.GRACE_DAYS
    };
  }
  async cancelDeletion(userId) {
    const request = await this.prisma.dataDeletionRequest.findUnique({
      where: {
        userId
      }
    });
    if (!request || request.status !== 'PENDING') {
      throw new _common.BadRequestException('No pending deletion request found');
    }
    await this.prisma.dataDeletionRequest.update({
      where: {
        userId
      },
      data: {
        status: 'CANCELLED'
      }
    });
    await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        isActive: true
      }
    });
    this.logger.log(`Deletion cancelled for user ${userId}`);
  }
  async getDeletionRequest(userId) {
    return this.prisma.dataDeletionRequest.findUnique({
      where: {
        userId
      }
    });
  }
  // ── Scheduled Anonymisation (called by a cron task) ───────────────────────
  async processScheduledDeletions() {
    const due = await this.prisma.dataDeletionRequest.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: {
          lte: new Date()
        }
      }
    });
    let processed = 0;
    for (const req of due) {
      try {
        await this.anonymizeUser(req.userId);
        await this.prisma.dataDeletionRequest.update({
          where: {
            id: req.id
          },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        });
        processed++;
      } catch (err) {
        this.logger.error(`Failed to anonymize user ${req.userId}: ${String(err)}`);
      }
    }
    if (processed > 0) {
      this.logger.log(`Anonymized ${processed} user(s)`);
    }
    return processed;
  }
  async anonymizeUser(userId) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });
    if (!user) {
      return;
    }
    const anonEmail = this.ANON_EMAIL(userId);
    const anonHash = await bcrypt.hash(crypto.randomUUID(), 12);
    await this.prisma.$transaction([
    // Wipe PII from user row
    this.prisma.user.update({
      where: {
        id: userId
      },
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
        emailVerified: false
      }
    }),
    // Wipe profile PII
    this.prisma.userProfile.updateMany({
      where: {
        userId
      },
      data: {
        bio: null,
        address: undefined,
        socialLinks: '{}'
      }
    }),
    // Delete all sessions and devices
    this.prisma.userSession.deleteMany({
      where: {
        userId
      }
    }), this.prisma.userDevice.deleteMany({
      where: {
        userId
      }
    })]);
    this.logger.warn(`User ${userId} anonymized (GDPR erasure)`);
  }
};
exports.GdprService = GdprService = GdprService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], GdprService);