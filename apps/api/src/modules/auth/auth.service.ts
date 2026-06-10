import { randomUUID } from 'crypto';

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TenantType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as QRCode from 'qrcode';
import * as speakeasy from 'speakeasy';

import { RedisService } from '../cache/redis.service';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

import { LoginCommand } from './application/commands/login.command';
import { RegisterCommand, CreateTenantAndAdminCommand } from './application/commands/register.command';
import {
  AuthTokens,
  AuthUser,
  JwtPayload,
  MfaSetupResult,
} from './domain/entities/auth.entity';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 12;
  private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redis: RedisService,
    private notifications: NotificationsService,
  ) {}

  async createTenantAndAdmin(cmd: CreateTenantAndAdminCommand): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: cmd.tenantSlug },
    });
    if (existingTenant) {
      throw new ConflictException('Tenant slug already taken');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: cmd.tenantName,
          slug: cmd.tenantSlug,
          type: cmd.tenantType || TenantType.SCHOOL,
          isActive: true,
        },
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
          role: UserRole.ADMIN,
          emailVerified: false,
        },
      });

      await tx.userProfile.create({
        data: { userId: user.id },
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
          currentPeriodEnd: trialEnd,
        },
      });

      return { tenant, user };
    });

    const tokens = await this.generateTokens(result.user);

    const authUser = new AuthUser({
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      role: result.user.role,
      tenantId: result.user.tenantId,
      tenantName: result.tenant.name,
      tenantSlug: result.tenant.slug,
      mfaEnabled: result.user.mfaEnabled,
    });

    this.logger.log(`New tenant created: ${cmd.tenantSlug} by ${cmd.adminEmail}`);
    this.notifications.sendWelcomeEmail(cmd.adminEmail, cmd.adminFirstName, result.tenant.name).catch(() => {});
    return { user: authUser, tokens };
  }

  async register(cmd: RegisterCommand): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: cmd.tenantId, email: cmd.email.toLowerCase() } },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(cmd.password, this.BCRYPT_ROUNDS);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          tenantId: cmd.tenantId,
          email: cmd.email.toLowerCase(),
          passwordHash,
          firstName: cmd.firstName,
          lastName: cmd.lastName,
          phone: cmd.phone,
          role: cmd.role || UserRole.STUDENT,
        },
      });
      await tx.userProfile.create({ data: { userId: newUser.id } });
      return newUser;
    });

    const tokens = await this.generateTokens(user);

    const tenant = await this.prisma.tenant.findUnique({ where: { id: cmd.tenantId }, select: { name: true, slug: true } });
    this.notifications.sendWelcomeEmail(user.email, user.firstName, tenant?.name ?? 'EduAI').catch(() => {});
    // Send email verification link (fire-and-forget)
    this.sendVerificationEmail(user.id).catch(() => {});

    return {
      user: new AuthUser({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenant?.name ?? '',
        tenantSlug: tenant?.slug ?? '',
        mfaEnabled: user.mfaEnabled,
      }),
      tokens,
    };
  }

  async login(cmd: LoginCommand): Promise<{ user: AuthUser; tokens: AuthTokens; requiresMfa?: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: cmd.tenantId, email: cmd.email.toLowerCase() } },
      include: { tenant: { select: { name: true, slug: true } } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(cmd.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login and device
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    let deviceTrusted = false;
    if (cmd.deviceId) {
      const device = await this.prisma.userDevice.upsert({
        where: { deviceId: cmd.deviceId },
        update: { lastSeenAt: new Date(), isActive: true },
        create: {
          userId: user.id,
          deviceId: cmd.deviceId,
          deviceName: cmd.deviceName,
          lastSeenAt: new Date(),
        },
      });
      deviceTrusted =
        device.mfaTrusted && device.mfaTrustedUntil !== null && device.mfaTrustedUntil > new Date();
    }

    if (user.mfaEnabled && !deviceTrusted) {
      const mfaChallengeToken = randomUUID();
      await this.redis.set(`mfa:challenge:${mfaChallengeToken}`, user.id, 300);
      return {
        user: new AuthUser({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          tenantId: user.tenantId,
          mfaEnabled: true,
        }),
        tokens: { accessToken: mfaChallengeToken, refreshToken: '', expiresIn: 300, tokenType: 'MFA-Challenge' },
        requiresMfa: true,
      };
    }

    const tokens = await this.generateTokens(user);

    return {
      user: new AuthUser({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant?.name ?? '',
        tenantSlug: user.tenant?.slug ?? '',
        mfaEnabled: user.mfaEnabled,
        avatarUrl: user.avatarUrl ?? undefined,
      }),
      tokens,
    };
  }

  async validateUser(email: string, password: string, tenantId: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: email.toLowerCase() } },
    });
    if (!user || !user.isActive) {return null;}
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {return null;}
    return new AuthUser({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      tenantId: user.tenantId,
      mfaEnabled: user.mfaEnabled,
    });
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const session = await this.prisma.userSession.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date() || !session.user.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate refresh token
    await this.prisma.userSession.delete({ where: { id: session.id } });
    const tokens = await this.generateTokens(session.user);
    return tokens;
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.userSession.deleteMany({ where: { userId, refreshToken } });
    } else {
      await this.prisma.userSession.deleteMany({ where: { userId } });
    }
    await this.redis.del(`user:${userId}:profile`);
  }

  async setupMfa(userId: string): Promise<MfaSetupResult> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {throw new NotFoundException('User not found');}
    if (user.mfaEnabled) {throw new BadRequestException('MFA is already enabled');}

    const secret = speakeasy.generateSecret({
      name: `EduAI (${user.email})`,
      length: 20,
    });

    const tempKey = `mfa:setup:${userId}`;
    await this.redis.set(tempKey, secret.base32, 600);

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');
    const backupCodes = this.generatePlainBackupCodes();

    // Store plain backup codes temporarily; they're hashed and persisted in verifyAndEnableMfa
    await this.redis.set(`mfa:backup:${userId}`, JSON.stringify(backupCodes), 600);

    return { secret: secret.base32, qrCodeUrl, backupCodes };
  }

  async verifyAndEnableMfa(userId: string, token: string): Promise<{ backupCodes: string[] }> {
    const secret = await this.redis.get(`mfa:setup:${userId}`);
    if (!secret) {throw new BadRequestException('MFA setup session expired. Please restart setup.');}

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {throw new BadRequestException('Invalid MFA token');}

    // Retrieve the plain backup codes that were generated in setupMfa
    const storedRaw = await this.redis.get(`mfa:backup:${userId}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const plainCodes: string[] = storedRaw ? JSON.parse(storedRaw) : this.generatePlainBackupCodes();

    // Hash backup codes before persisting
    const hashedCodes = await Promise.all(plainCodes.map((c) => bcrypt.hash(c, this.BCRYPT_ROUNDS)));

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true, mfaSecret: secret, mfaBackupCodes: hashedCodes },
    });

    await this.redis.del(`mfa:setup:${userId}`);
    await this.redis.del(`mfa:backup:${userId}`);
    this.logger.log(`MFA enabled for user ${userId}`);

    // Return plain codes once so the user can write them down
    return { backupCodes: plainCodes };
  }

  async verifyMfaLogin(
    challengeToken: string,
    code: string,
    opts?: { trustDevice?: boolean; deviceId?: string; deviceName?: string },
  ): Promise<AuthTokens & { deviceTrusted?: boolean }> {
    const userId = await this.redis.get(`mfa:challenge:${challengeToken}`);
    if (!userId) {throw new UnauthorizedException('MFA challenge expired');}

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) {throw new UnauthorizedException('MFA not configured');}

    // Try TOTP first
    const totpValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!totpValid) {
      // Fall back to backup code redemption
      const matched = await this.redeemBackupCode(user.id, code, user.mfaBackupCodes);
      if (!matched) {throw new UnauthorizedException('Invalid MFA code');}
    }

    await this.redis.del(`mfa:challenge:${challengeToken}`);

    // Optionally trust the device for 30 days
    if (opts?.trustDevice && opts.deviceId) {
      await this.trustDevice(userId, opts.deviceId, opts.deviceName, 30);
    }

    const tokens = await this.generateTokens(user);
    return { ...tokens, deviceTrusted: opts?.trustDevice ?? false };
  }

  async disableMfa(userId: string, token: string, password: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {throw new NotFoundException('User not found');}
    if (!user.mfaEnabled) {throw new BadRequestException('MFA is not enabled');}

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {throw new UnauthorizedException('Invalid password');}

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret || '',
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!isValid) {throw new BadRequestException('Invalid MFA token');}

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null, mfaBackupCodes: [] },
    });

    // Revoke trust on all devices
    await this.prisma.userDevice.updateMany({
      where: { userId },
      data: { mfaTrusted: false, mfaTrustedUntil: null },
    });
  }

  async regenerateBackupCodes(userId: string, password: string): Promise<{ backupCodes: string[] }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {throw new NotFoundException('User not found');}
    if (!user.mfaEnabled) {throw new BadRequestException('MFA is not enabled');}

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {throw new UnauthorizedException('Invalid password');}

    const plainCodes = this.generatePlainBackupCodes();
    const hashedCodes = await Promise.all(plainCodes.map((c) => bcrypt.hash(c, this.BCRYPT_ROUNDS)));

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaBackupCodes: hashedCodes },
    });

    this.logger.log(`Backup codes regenerated for user ${userId}`);
    return { backupCodes: plainCodes };
  }

  async trustDevice(userId: string, deviceId: string, deviceName?: string, days = 30): Promise<void> {
    const trustedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await this.prisma.userDevice.upsert({
      where: { deviceId },
      update: { mfaTrusted: true, mfaTrustedUntil: trustedUntil, lastSeenAt: new Date() },
      create: {
        userId,
        deviceId,
        deviceName: deviceName ?? 'Unknown Device',
        mfaTrusted: true,
        mfaTrustedUntil: trustedUntil,
        lastSeenAt: new Date(),
      },
    });
    this.logger.log(`Device ${deviceId} trusted for user ${userId} until ${trustedUntil.toISOString()}`);
  }

  async revokeTrustedDevice(userId: string, deviceId: string): Promise<void> {
    const device = await this.prisma.userDevice.findUnique({ where: { deviceId } });
    if (!device || device.userId !== userId) {throw new NotFoundException('Device not found');}
    await this.prisma.userDevice.update({
      where: { deviceId },
      data: { mfaTrusted: false, mfaTrustedUntil: null },
    });
  }

  async getUserDevices(userId: string) {
    return this.prisma.userDevice.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        lastSeenAt: true,
        mfaTrusted: true,
        mfaTrustedUntil: true,
        createdAt: true,
      },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {throw new NotFoundException('User not found');}

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {throw new UnauthorizedException('Current password is incorrect');}

    const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.prisma.userSession.deleteMany({ where: { userId } });
    this.logger.log(`Password changed for user ${userId}`);
  }

  async forgotPassword(email: string, tenantId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: email.toLowerCase() } },
    });
    // Always return success to prevent email enumeration
    if (!user) {return;}

    const resetToken = randomUUID();
    await this.redis.set(`pwd:reset:${resetToken}`, user.id, 3600);

    this.logger.log(`Password reset token generated for ${email}`);
    this.notifications.sendPasswordResetEmail(user.email, user.firstName, resetToken).catch(() => {});
  }

  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {throw new NotFoundException('User not found');}
    if (user.emailVerified) {return;} // already verified

    const verificationToken = randomUUID();
    await this.redis.set(`email:verify:${verificationToken}`, userId, 24 * 3600); // 24 hours
    await this.notifications.sendEmailVerification(user.email, user.firstName, verificationToken).catch(() => {});
    this.logger.log(`Email verification token sent to ${user.email}`);
  }

  async verifyEmail(token: string): Promise<{ verified: boolean }> {
    const userId = await this.redis.get(`email:verify:${token}`);
    if (!userId) {throw new BadRequestException('Invalid or expired verification token');}

    await this.prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
    await this.redis.del(`email:verify:${token}`);
    this.logger.log(`Email verified for user ${userId}`);
    return { verified: true };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await this.redis.get(`pwd:reset:${token}`);
    if (!userId) {throw new BadRequestException('Invalid or expired reset token');}

    const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.redis.del(`pwd:reset:${token}`);
    // Invalidate all sessions
    await this.prisma.userSession.deleteMany({ where: { userId } });
    this.logger.log(`Password reset for user ${userId}`);
  }

  private generatePlainBackupCodes(): string[] {
    return Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase(),
    );
  }

  private async redeemBackupCode(userId: string, plainCode: string, hashedCodes: string[]): Promise<boolean> {
    for (let i = 0; i < hashedCodes.length; i++) {
      const match = await bcrypt.compare(plainCode.toUpperCase(), hashedCodes[i]);
      if (match) {
        // Remove the used code
        const remaining = [...hashedCodes];
        remaining.splice(i, 1);
        await this.prisma.user.update({
          where: { id: userId },
          data: { mfaBackupCodes: remaining },
        });
        this.logger.warn(`Backup code used for user ${userId}, ${remaining.length} remaining`);
        return true;
      }
    }
    return false;
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    tenantId: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    mfaEnabled: boolean;
  }): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      mfaEnabled: user.mfaEnabled,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_TTL * 1000);
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
      },
    });

    return new AuthTokens(accessToken, refreshToken, 900);
  }
}
