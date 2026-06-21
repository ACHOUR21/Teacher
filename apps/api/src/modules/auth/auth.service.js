"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AuthService = void 0;
var _crypto = require("crypto");
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _jwt = require("@nestjs/jwt");
var _client = require("@prisma/client");
var bcrypt = _interopRequireWildcard(require("bcrypt"));
var QRCode = _interopRequireWildcard(require("qrcode"));
var speakeasy = _interopRequireWildcard(require("speakeasy"));
var _redis = require("../cache/redis.service");
var _prisma = require("../database/prisma.service");
var _email = require("../notifications/email/email.service");
var _notifications = require("../notifications/notifications.service");
var _auth = require("./domain/entities/auth.entity");
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
var AuthService_1;
let AuthService = exports.AuthService = AuthService_1 = class AuthService {
  logger = new _common.Logger(AuthService_1.name);
  BCRYPT_ROUNDS = 12;
  REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
  constructor(prisma, jwtService, configService, redis, notifications, emailService) {
    this.prisma = prisma;
    this.jwtService = jwtService;
    this.configService = configService;
    this.redis = redis;
    this.notifications = notifications;
    this.emailService = emailService;
  }
  async createTenantAndAdmin(cmd) {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: {
        slug: cmd.tenantSlug
      }
    });
    if (existingTenant) {
      throw new _common.ConflictException('Tenant slug already taken');
    }
    const result = await this.prisma.$transaction(async tx => {
      const tenant = await tx.tenant.create({
        data: {
          name: cmd.tenantName,
          slug: cmd.tenantSlug,
          type: cmd.tenantType || _client.TenantType.SCHOOL,
          isActive: true
        }
      });
      const passwordHash = await bcrypt.hash(cmd.adminPassword, this.BCRYPT_ROUNDS);
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: cmd.adminEmail.toLowerCase(),
          passwordHash,
          firstName: cmd.adminFirstName,
          lastName: cmd.adminLastName,
          phone: cmd.adminPhone,
          role: _client.UserRole.ADMIN,
          emailVerified: false
        }
      });
      await tx.userProfile.create({
        data: {
          userId: user.id
        }
      });
      // Create default subscription (trial)
      const now = new Date();
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          plan: 'FREE_TRIAL',
          status: 'TRIALING',
          currentPeriodStart: now,
          currentPeriodEnd: trialEnd
        }
      });
      return {
        tenant,
        user
      };
    });
    const tokens = await this.generateTokens(result.user);
    const authUser = new _auth.AuthUser({
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      role: result.user.role,
      tenantId: result.user.tenantId,
      tenantName: result.tenant.name,
      tenantSlug: result.tenant.slug,
      mfaEnabled: result.user.mfaEnabled
    });
    this.logger.log(`New tenant created: ${cmd.tenantSlug} by ${cmd.adminEmail}`);
    this.notifications.sendWelcomeEmail(cmd.adminEmail, cmd.adminFirstName, result.tenant.name).catch(() => {});
    this.emailService.sendWelcome(cmd.adminEmail, {
      name: cmd.adminFirstName,
      tenantName: result.tenant.name,
      loginUrl: `${this.configService.get('APP_URL', 'http://localhost:3000')}/login`
    }).catch(() => null);
    return {
      user: authUser,
      tokens
    };
  }
  async register(cmd) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: cmd.tenantId,
          email: cmd.email.toLowerCase()
        }
      }
    });
    if (existingUser) {
      throw new _common.ConflictException('User with this email already exists');
    }
    const passwordHash = await bcrypt.hash(cmd.password, this.BCRYPT_ROUNDS);
    const user = await this.prisma.$transaction(async tx => {
      const newUser = await tx.user.create({
        data: {
          tenantId: cmd.tenantId,
          email: cmd.email.toLowerCase(),
          passwordHash,
          firstName: cmd.firstName,
          lastName: cmd.lastName,
          phone: cmd.phone,
          role: cmd.role || _client.UserRole.STUDENT
        }
      });
      await tx.userProfile.create({
        data: {
          userId: newUser.id
        }
      });
      return newUser;
    });
    const tokens = await this.generateTokens(user);
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: cmd.tenantId
      },
      select: {
        name: true,
        slug: true
      }
    });
    this.notifications.sendWelcomeEmail(user.email, user.firstName, tenant?.name ?? 'EduAI').catch(() => {});
    this.emailService.sendWelcome(user.email, {
      name: user.firstName,
      tenantName: tenant?.name ?? 'EduAI',
      loginUrl: `${this.configService.get('APP_URL', 'http://localhost:3000')}/login`
    }).catch(() => null);
    // Send email verification link (fire-and-forget)
    this.sendVerificationEmail(user.id).catch(() => {});
    return {
      user: new _auth.AuthUser({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenant?.name ?? '',
        tenantSlug: tenant?.slug ?? '',
        mfaEnabled: user.mfaEnabled
      }),
      tokens
    };
  }
  async login(cmd) {
    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: cmd.tenantId,
          email: cmd.email.toLowerCase()
        }
      },
      include: {
        tenant: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });
    if (!user || !user.isActive) {
      throw new _common.UnauthorizedException('Invalid credentials');
    }
    const passwordValid = await bcrypt.compare(cmd.password, user.passwordHash);
    if (!passwordValid) {
      throw new _common.UnauthorizedException('Invalid credentials');
    }
    // Update last login and device
    await this.prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        lastLoginAt: new Date()
      }
    });
    let deviceTrusted = false;
    if (cmd.deviceId) {
      const device = await this.prisma.userDevice.upsert({
        where: {
          deviceId: cmd.deviceId
        },
        update: {
          lastSeenAt: new Date(),
          isActive: true
        },
        create: {
          userId: user.id,
          deviceId: cmd.deviceId,
          deviceName: cmd.deviceName,
          lastSeenAt: new Date()
        }
      });
      deviceTrusted = device.mfaTrusted && device.mfaTrustedUntil !== null && device.mfaTrustedUntil > new Date();
    }
    if (user.mfaEnabled && !deviceTrusted) {
      const mfaChallengeToken = (0, _crypto.randomUUID)();
      await this.redis.set(`mfa:challenge:${mfaChallengeToken}`, user.id, 300);
      return {
        user: new _auth.AuthUser({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
          mfaEnabled: true
        }),
        tokens: {
          accessToken: mfaChallengeToken,
          refreshToken: '',
          expiresIn: 300,
          tokenType: 'MFA-Challenge'
        },
        requiresMfa: true
      };
    }
    const tokens = await this.generateTokens(user);
    return {
      user: new _auth.AuthUser({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name ?? '',
        tenantSlug: user.tenant?.slug ?? '',
        mfaEnabled: user.mfaEnabled,
        avatarUrl: user.avatarUrl ?? undefined
      }),
      tokens
    };
  }
  async validateUser(email, password, tenantId) {
    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: email.toLowerCase()
        }
      }
    });
    if (!user || !user.isActive) {
      return null;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return null;
    }
    return new _auth.AuthUser({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      mfaEnabled: user.mfaEnabled
    });
  }
  async refreshTokens(refreshToken) {
    const session = await this.prisma.userSession.findUnique({
      where: {
        refreshToken
      },
      include: {
        user: true
      }
    });
    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      throw new _common.UnauthorizedException('Invalid or expired refresh token');
    }
    // Rotate refresh token
    await this.prisma.userSession.delete({
      where: {
        id: session.id
      }
    });
    const tokens = await this.generateTokens(session.user);
    return tokens;
  }
  async logout(userId, refreshToken) {
    if (refreshToken) {
      await this.prisma.userSession.deleteMany({
        where: {
          userId,
          refreshToken
        }
      });
    } else {
      await this.prisma.userSession.deleteMany({
        where: {
          userId
        }
      });
    }
    await this.redis.del(`user:${userId}:profile`);
  }
  async setupMfa(userId) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });
    if (!user) {
      throw new _common.NotFoundException('User not found');
    }
    if (user.mfaEnabled) {
      throw new _common.BadRequestException('MFA is already enabled');
    }
    const secret = speakeasy.generateSecret({
      name: `EduAI (${user.email})`,
      length: 20
    });
    const tempKey = `mfa:setup:${userId}`;
    await this.redis.set(tempKey, secret.base32, 600);
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');
    const backupCodes = this.generatePlainBackupCodes();
    // Store plain backup codes temporarily; they're hashed and persisted in verifyAndEnableMfa
    await this.redis.set(`mfa:backup:${userId}`, JSON.stringify(backupCodes), 600);
    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes
    };
  }
  async verifyAndEnableMfa(userId, token) {
    const secret = await this.redis.get(`mfa:setup:${userId}`);
    if (!secret) {
      throw new _common.BadRequestException('MFA setup session expired. Please restart setup.');
    }
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2
    });
    if (!isValid) {
      throw new _common.BadRequestException('Invalid MFA token');
    }
    // Retrieve the plain backup codes that were generated in setupMfa
    const storedRaw = await this.redis.get(`mfa:backup:${userId}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const plainCodes = storedRaw ? JSON.parse(storedRaw) : this.generatePlainBackupCodes();
    // Hash backup codes before persisting
    const hashedCodes = await Promise.all(plainCodes.map(c => bcrypt.hash(c, this.BCRYPT_ROUNDS)));
    await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        mfaEnabled: true,
        mfaSecret: secret,
        mfaBackupCodes: hashedCodes
      }
    });
    await this.redis.del(`mfa:setup:${userId}`);
    await this.redis.del(`mfa:backup:${userId}`);
    this.logger.log(`MFA enabled for user ${userId}`);
    // Return plain codes once so the user can write them down
    return {
      backupCodes: plainCodes
    };
  }
  async verifyMfaLogin(challengeToken, code, opts) {
    const userId = await this.redis.get(`mfa:challenge:${challengeToken}`);
    if (!userId) {
      throw new _common.UnauthorizedException('MFA challenge expired');
    }
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });
    if (!user || !user.mfaSecret) {
      throw new _common.UnauthorizedException('MFA not configured');
    }
    // Try TOTP first
    const totpValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });
    if (!totpValid) {
      // Fall back to backup code redemption
      const matched = await this.redeemBackupCode(user.id, code, user.mfaBackupCodes);
      if (!matched) {
        throw new _common.UnauthorizedException('Invalid MFA code');
      }
    }
    await this.redis.del(`mfa:challenge:${challengeToken}`);
    // Optionally trust the device for 30 days
    if (opts?.trustDevice && opts.deviceId) {
      await this.trustDevice(userId, opts.deviceId, opts.deviceName, 30);
    }
    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      deviceTrusted: opts?.trustDevice ?? false
    };
  }
  async disableMfa(userId, token, password) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });
    if (!user) {
      throw new _common.NotFoundException('User not found');
    }
    if (!user.mfaEnabled) {
      throw new _common.BadRequestException('MFA is not enabled');
    }
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new _common.UnauthorizedException('Invalid password');
    }
    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret || '',
      encoding: 'base32',
      token,
      window: 2
    });
    if (!isValid) {
      throw new _common.BadRequestException('Invalid MFA token');
    }
    await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: []
      }
    });
    // Revoke trust on all devices
    await this.prisma.userDevice.updateMany({
      where: {
        userId
      },
      data: {
        mfaTrusted: false,
        mfaTrustedUntil: null
      }
    });
  }
  async regenerateBackupCodes(userId, password) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });
    if (!user) {
      throw new _common.NotFoundException('User not found');
    }
    if (!user.mfaEnabled) {
      throw new _common.BadRequestException('MFA is not enabled');
    }
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new _common.UnauthorizedException('Invalid password');
    }
    const plainCodes = this.generatePlainBackupCodes();
    const hashedCodes = await Promise.all(plainCodes.map(c => bcrypt.hash(c, this.BCRYPT_ROUNDS)));
    await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        mfaBackupCodes: hashedCodes
      }
    });
    this.logger.log(`Backup codes regenerated for user ${userId}`);
    return {
      backupCodes: plainCodes
    };
  }
  async trustDevice(userId, deviceId, deviceName, days = 30) {
    const trustedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await this.prisma.userDevice.upsert({
      where: {
        deviceId
      },
      update: {
        mfaTrusted: true,
        mfaTrustedUntil: trustedUntil,
        lastSeenAt: new Date()
      },
      create: {
        userId,
        deviceId,
        deviceName: deviceName ?? 'Unknown Device',
        mfaTrusted: true,
        mfaTrustedUntil: trustedUntil,
        lastSeenAt: new Date()
      }
    });
    this.logger.log(`Device ${deviceId} trusted for user ${userId} until ${trustedUntil.toISOString()}`);
  }
  async revokeTrustedDevice(userId, deviceId) {
    const device = await this.prisma.userDevice.findUnique({
      where: {
        deviceId
      }
    });
    if (!device || device.userId !== userId) {
      throw new _common.NotFoundException('Device not found');
    }
    await this.prisma.userDevice.update({
      where: {
        deviceId
      },
      data: {
        mfaTrusted: false,
        mfaTrustedUntil: null
      }
    });
  }
  async getUserDevices(userId) {
    return this.prisma.userDevice.findMany({
      where: {
        userId,
        isActive: true
      },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        lastSeenAt: true,
        mfaTrusted: true,
        mfaTrustedUntil: true,
        createdAt: true
      },
      orderBy: {
        lastSeenAt: 'desc'
      }
    });
  }
  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });
    if (!user) {
      throw new _common.NotFoundException('User not found');
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new _common.UnauthorizedException('Current password is incorrect');
    }
    const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        passwordHash
      }
    });
    await this.prisma.userSession.deleteMany({
      where: {
        userId
      }
    });
    this.logger.log(`Password changed for user ${userId}`);
  }
  async forgotPassword(email, tenantId) {
    const user = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: email.toLowerCase()
        }
      }
    });
    // Always return success to prevent email enumeration
    if (!user) {
      return;
    }
    const resetToken = (0, _crypto.randomUUID)();
    await this.redis.set(`pwd:reset:${resetToken}`, user.id, 3600);
    this.logger.log(`Password reset token generated for ${email}`);
    this.notifications.sendPasswordResetEmail(user.email, user.firstName, resetToken).catch(() => {});
    const resetUrl = `${this.configService.get('APP_URL', 'http://localhost:3000')}/reset-password?token=${resetToken}`;
    this.emailService.sendPasswordReset(user.email, {
      name: user.firstName,
      resetUrl,
      expiresIn: '1 hour'
    }).catch(() => null);
  }
  async sendVerificationEmail(userId) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    });
    if (!user) {
      throw new _common.NotFoundException('User not found');
    }
    if (user.emailVerified) {
      return;
    } // already verified
    const verificationToken = (0, _crypto.randomUUID)();
    await this.redis.set(`email:verify:${verificationToken}`, userId, 24 * 3600); // 24 hours
    await this.notifications.sendEmailVerification(user.email, user.firstName, verificationToken).catch(() => {});
    const verifyUrl = `${this.configService.get('APP_URL', 'http://localhost:3000')}/verify-email?token=${verificationToken}`;
    this.emailService.sendEmailVerification(user.email, {
      name: user.firstName,
      verifyUrl
    }).catch(() => null);
    this.logger.log(`Email verification token sent to ${user.email}`);
  }
  async verifyEmail(token) {
    const userId = await this.redis.get(`email:verify:${token}`);
    if (!userId) {
      throw new _common.BadRequestException('Invalid or expired verification token');
    }
    await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        emailVerified: true
      }
    });
    await this.redis.del(`email:verify:${token}`);
    this.logger.log(`Email verified for user ${userId}`);
    return {
      verified: true
    };
  }
  async resetPassword(token, newPassword) {
    const userId = await this.redis.get(`pwd:reset:${token}`);
    if (!userId) {
      throw new _common.BadRequestException('Invalid or expired reset token');
    }
    const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        passwordHash
      }
    });
    await this.redis.del(`pwd:reset:${token}`);
    // Invalidate all sessions
    await this.prisma.userSession.deleteMany({
      where: {
        userId
      }
    });
    this.logger.log(`Password reset for user ${userId}`);
  }
  generatePlainBackupCodes() {
    return Array.from({
      length: 8
    }, () => Math.random().toString(36).substring(2, 10).toUpperCase());
  }
  async redeemBackupCode(userId, plainCode, hashedCodes) {
    for (let i = 0; i < hashedCodes.length; i++) {
      const match = await bcrypt.compare(plainCode.toUpperCase(), hashedCodes[i]);
      if (match) {
        // Remove the used code
        const remaining = [...hashedCodes];
        remaining.splice(i, 1);
        await this.prisma.user.update({
          where: {
            id: userId
          },
          data: {
            mfaBackupCodes: remaining
          }
        });
        this.logger.warn(`Backup code used for user ${userId}, ${remaining.length} remaining`);
        return true;
      }
    }
    return false;
  }
  async generateTokensForUser(user) {
    return this.generateTokens(user);
  }
  async generateTokens(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      mfaEnabled: user.mfaEnabled
    };
    const [accessToken, refreshToken] = await Promise.all([this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m')
    }), this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d')
    })]);
    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_TTL * 1000);
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt
      }
    });
    return new _auth.AuthTokens(accessToken, refreshToken, 900);
  }
};
exports.AuthService = AuthService = AuthService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_jwt.JwtService)), __param(2, (0, _common.Inject)(_config.ConfigService)), __param(3, (0, _common.Inject)(_redis.RedisService)), __param(4, (0, _common.Inject)(_notifications.NotificationsService)), __param(5, (0, _common.Inject)(_email.EmailService)), __metadata("design:paramtypes", [Object, Object, Object, Object, Object, Object])], AuthService);