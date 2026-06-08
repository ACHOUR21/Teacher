import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../cache/redis.service';
import { NotificationsService } from '../../notifications/notifications.service';
import * as bcrypt from 'bcrypt';

const mockPrisma = {
  tenant: { findUnique: jest.fn(), create: jest.fn() },
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  userProfile: { create: jest.fn(), upsert: jest.fn() },
  userSession: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  userDevice: { upsert: jest.fn() },
  subscription: { create: jest.fn() },
  $transaction: jest.fn((cb: any) => cb(mockPrisma)),
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-token'),
  signAsync: jest.fn().mockResolvedValue('mock-token'),
  verify: jest.fn(),
  verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1' }),
};

const mockConfig = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      JWT_SECRET: 'test-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      JWT_ISSUER: 'test-issuer',
      JWT_AUDIENCE: 'test-audience',
    };
    return map[key];
  }),
};

const mockRedis = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

const mockNotifications = {
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendEmailVerification: jest.fn().mockResolvedValue(undefined),
  sendCourseEnrollmentEmail: jest.fn().mockResolvedValue(undefined),
};

// Shared user fixture factory
function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'user@test.com',
    passwordHash: '',
    firstName: 'Test',
    lastName: 'User',
    role: 'STUDENT',
    tenantId: 'tenant-1',
    isActive: true,
    mfaEnabled: false,
    mfaSecret: null,
    avatarUrl: null,
    emailVerified: false,
    tenant: { id: 'tenant-1', name: 'Test School', slug: 'test-school' },
    profile: null,
    ...overrides,
  };
}

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: RedisService, useValue: mockRedis },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    // Default: signAsync always resolves so generateTokens doesn't stall
    mockJwt.signAsync.mockResolvedValue('mock-token');
    mockPrisma.userSession.create.mockResolvedValue({ id: 'session-1' });
  });

  // ---------------------------------------------------------------------------
  // createTenantAndAdmin
  // ---------------------------------------------------------------------------
  describe('createTenantAndAdmin', () => {
    it('should throw ConflictException when tenant slug already exists', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({ id: 'existing-id' });

      await expect(
        service.createTenantAndAdmin({
          tenantName: 'Test School',
          tenantSlug: 'test-school',
          tenantType: 'SCHOOL' as any,
          adminEmail: 'admin@test.com',
          adminPassword: 'Password123!',
          adminFirstName: 'Admin',
          adminLastName: 'User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create tenant and admin user on success', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValueOnce(null);
      const mockTenant = { id: 'tenant-1', name: 'Test School', slug: 'test-school' };
      const mockUser = makeUser({
        role: 'ADMIN',
        email: 'admin@test.com',
        tenant: mockTenant,
      });

      mockPrisma.$transaction.mockImplementationOnce(async (cb: any) => {
        mockPrisma.tenant.create.mockResolvedValueOnce(mockTenant);
        mockPrisma.user.create.mockResolvedValueOnce(mockUser);
        mockPrisma.userProfile.create.mockResolvedValueOnce({ id: 'profile-1' });
        mockPrisma.subscription.create.mockResolvedValueOnce({ id: 'sub-1' });
        return cb(mockPrisma);
      });

      const result = await service.createTenantAndAdmin({
        tenantName: 'Test School',
        tenantSlug: 'test-school',
        tenantType: 'SCHOOL' as any,
        adminEmail: 'admin@test.com',
        adminPassword: 'Password123!',
        adminFirstName: 'Admin',
        adminLastName: 'User',
      });

      expect(result).toHaveProperty('tokens');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });
  });

  // ---------------------------------------------------------------------------
  // register
  // ---------------------------------------------------------------------------
  describe('register', () => {
    const registerCmd = {
      tenantId: 'tenant-1',
      email: 'newuser@test.com',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User',
    };

    it('should throw ConflictException when user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(makeUser());

      await expect(service.register(registerCmd)).rejects.toThrow(ConflictException);
    });

    it('should create user and return tokens on success', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const newUser = makeUser({ id: 'user-new', email: 'newuser@test.com' });
      mockPrisma.$transaction.mockImplementationOnce(async (cb: any) => {
        mockPrisma.user.create.mockResolvedValueOnce(newUser);
        mockPrisma.userProfile.create.mockResolvedValueOnce({ id: 'profile-new' });
        return cb(mockPrisma);
      });
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({
        id: 'tenant-1',
        name: 'Test School',
        slug: 'test-school',
      });
      // sendVerificationEmail calls user.findUnique internally
      mockPrisma.user.findUnique.mockResolvedValueOnce(newUser);
      mockRedis.set.mockResolvedValueOnce('OK');

      const result = await service.register(registerCmd);

      expect(result).toHaveProperty('tokens');
      expect(result.tokens.accessToken).toBe('mock-token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('newuser@test.com');
    });

    it('should call sendWelcomeEmail as fire-and-forget on success', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const newUser = makeUser({ id: 'user-new', email: 'newuser@test.com', firstName: 'New' });
      mockPrisma.$transaction.mockImplementationOnce(async (cb: any) => {
        mockPrisma.user.create.mockResolvedValueOnce(newUser);
        mockPrisma.userProfile.create.mockResolvedValueOnce({ id: 'profile-new' });
        return cb(mockPrisma);
      });
      mockPrisma.tenant.findUnique.mockResolvedValueOnce({
        id: 'tenant-1',
        name: 'Test School',
        slug: 'test-school',
      });
      // sendVerificationEmail calls user.findUnique internally
      mockPrisma.user.findUnique.mockResolvedValueOnce(newUser);
      mockRedis.set.mockResolvedValueOnce('OK');

      await service.register(registerCmd);

      // sendWelcomeEmail is called but not awaited; give event loop a tick
      await Promise.resolve();
      expect(mockNotifications.sendWelcomeEmail).toHaveBeenCalledWith(
        'newuser@test.com',
        'New',
        'Test School',
      );
    });
  });

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------
  describe('login', () => {
    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.login({ email: 'nonexistent@test.com', password: 'Password123!', tenantId: 'tenant-1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPw = await bcrypt.hash('correct-password', 1);
      mockPrisma.user.findUnique.mockResolvedValueOnce(makeUser({ passwordHash: hashedPw }));

      await expect(
        service.login({ email: 'user@test.com', password: 'wrong-password', tenantId: 'tenant-1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on successful login', async () => {
      const password = 'Password123!';
      const hashedPw = await bcrypt.hash(password, 1);
      mockPrisma.user.findUnique.mockResolvedValueOnce(makeUser({ passwordHash: hashedPw }));
      mockPrisma.user.update.mockResolvedValueOnce({});

      const result = await service.login({ email: 'user@test.com', password, tenantId: 'tenant-1' });

      expect(result).toHaveProperty('tokens');
      expect(result.tokens.accessToken).toBe('mock-token');
    });

    it('should return requiresMfa:true and MFA-Challenge token when mfaEnabled is true', async () => {
      const password = 'Password123!';
      const hashedPw = await bcrypt.hash(password, 1);
      mockPrisma.user.findUnique.mockResolvedValueOnce(
        makeUser({ passwordHash: hashedPw, mfaEnabled: true }),
      );
      mockPrisma.user.update.mockResolvedValueOnce({});
      mockRedis.set.mockResolvedValueOnce('OK');

      const result = await service.login({ email: 'user@test.com', password, tenantId: 'tenant-1' });

      expect(result.requiresMfa).toBe(true);
      expect(result.tokens.tokenType).toBe('MFA-Challenge');
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^mfa:challenge:/),
        'user-1',
        300,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // refreshTokens
  // ---------------------------------------------------------------------------
  describe('refreshTokens', () => {
    it('should throw UnauthorizedException when session not found', async () => {
      mockPrisma.userSession.findUnique.mockResolvedValueOnce(null);

      await expect(service.refreshTokens('invalid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when session is expired', async () => {
      const expiredSession = {
        id: 'session-1',
        refreshToken: 'old-refresh-token',
        expiresAt: new Date(Date.now() - 1000), // in the past
        user: makeUser(),
      };
      mockPrisma.userSession.findUnique.mockResolvedValueOnce(expiredSession);

      await expect(service.refreshTokens('old-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should rotate refresh token: delete old session, create new one, return new tokens', async () => {
      const validSession = {
        id: 'session-1',
        refreshToken: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 60_000), // future
        user: makeUser(),
      };
      mockPrisma.userSession.findUnique.mockResolvedValueOnce(validSession);
      mockPrisma.userSession.delete.mockResolvedValueOnce({ id: 'session-1' });

      const tokens = await service.refreshTokens('valid-refresh-token');

      expect(mockPrisma.userSession.delete).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
      expect(mockPrisma.userSession.create).toHaveBeenCalled();
      expect(tokens.accessToken).toBe('mock-token');
    });
  });

  // ---------------------------------------------------------------------------
  // logout
  // ---------------------------------------------------------------------------
  describe('logout', () => {
    it('should delete specific session when refreshToken provided', async () => {
      mockPrisma.userSession.deleteMany.mockResolvedValueOnce({ count: 1 });
      mockRedis.del.mockResolvedValueOnce(1);

      await service.logout('user-1', 'specific-refresh-token');

      expect(mockPrisma.userSession.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', refreshToken: 'specific-refresh-token' },
      });
      expect(mockRedis.del).toHaveBeenCalledWith('user:user-1:profile');
    });

    it('should delete all sessions when no refreshToken provided', async () => {
      mockPrisma.userSession.deleteMany.mockResolvedValueOnce({ count: 3 });
      mockRedis.del.mockResolvedValueOnce(1);

      await service.logout('user-1');

      expect(mockPrisma.userSession.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(mockRedis.del).toHaveBeenCalledWith('user:user-1:profile');
    });
  });

  // ---------------------------------------------------------------------------
  // changePassword
  // ---------------------------------------------------------------------------
  describe('changePassword', () => {
    it('should throw UnauthorizedException when current password is wrong', async () => {
      const hashedPw = await bcrypt.hash('correct-password', 1);
      mockPrisma.user.findUnique.mockResolvedValueOnce(makeUser({ passwordHash: hashedPw }));

      await expect(
        service.changePassword('user-1', 'wrong-password', 'NewPassword123!'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update passwordHash and clear all sessions on success', async () => {
      const currentPassword = 'current-password';
      const hashedPw = await bcrypt.hash(currentPassword, 1);
      mockPrisma.user.findUnique.mockResolvedValueOnce(makeUser({ passwordHash: hashedPw }));
      mockPrisma.user.update.mockResolvedValueOnce({});
      mockPrisma.userSession.deleteMany.mockResolvedValueOnce({ count: 2 });

      await service.changePassword('user-1', currentPassword, 'NewPassword123!');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
      expect(mockPrisma.userSession.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // forgotPassword
  // ---------------------------------------------------------------------------
  describe('forgotPassword', () => {
    it('should silently return without throwing when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.forgotPassword('unknown@test.com', 'tenant-1'),
      ).resolves.toBeUndefined();

      expect(mockRedis.set).not.toHaveBeenCalled();
      expect(mockNotifications.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should store reset token in redis and call sendPasswordResetEmail when user found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(
        makeUser({ email: 'user@test.com', firstName: 'Test' }),
      );
      mockRedis.set.mockResolvedValueOnce('OK');

      await service.forgotPassword('user@test.com', 'tenant-1');

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^pwd:reset:/),
        'user-1',
        3600,
      );

      await Promise.resolve(); // flush fire-and-forget
      expect(mockNotifications.sendPasswordResetEmail).toHaveBeenCalledWith(
        'user@test.com',
        'Test',
        expect.any(String),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // verifyEmail
  // ---------------------------------------------------------------------------
  describe('verifyEmail', () => {
    it('should throw BadRequestException when token not found in redis', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        'Invalid or expired verification token',
      );
    });

    it('should mark emailVerified=true and delete token on success', async () => {
      mockRedis.get.mockResolvedValueOnce('user-1');
      mockPrisma.user.update.mockResolvedValueOnce({});
      mockRedis.del.mockResolvedValueOnce(1);

      const result = await service.verifyEmail('valid-verify-token');

      expect(result).toEqual({ verified: true });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { emailVerified: true },
      });
      expect(mockRedis.del).toHaveBeenCalledWith('email:verify:valid-verify-token');
    });
  });

  // ---------------------------------------------------------------------------
  // resetPassword
  // ---------------------------------------------------------------------------
  describe('resetPassword', () => {
    it('should throw BadRequestException when token not found in redis', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      await expect(service.resetPassword('bad-token', 'NewPassword!')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resetPassword('bad-token', 'NewPassword!')).rejects.toThrow(
        'Invalid or expired reset token',
      );
    });

    it('should update passwordHash and invalidate all sessions on success', async () => {
      mockRedis.get.mockResolvedValueOnce('user-1');
      mockPrisma.user.update.mockResolvedValueOnce({});
      mockRedis.del.mockResolvedValueOnce(1);
      mockPrisma.userSession.deleteMany.mockResolvedValueOnce({ count: 2 });

      await service.resetPassword('valid-reset-token', 'NewPassword123!');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
      expect(mockRedis.del).toHaveBeenCalledWith('pwd:reset:valid-reset-token');
      expect(mockPrisma.userSession.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});
