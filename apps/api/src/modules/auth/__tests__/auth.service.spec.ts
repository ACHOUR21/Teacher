import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../cache/redis.service';
import * as bcrypt from 'bcrypt';

const mockPrisma = {
  tenant: { findUnique: jest.fn(), create: jest.fn() },
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  userProfile: { create: jest.fn(), upsert: jest.fn() },
  userSession: { create: jest.fn(), findFirst: jest.fn(), delete: jest.fn(), deleteMany: jest.fn() },
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
      'JWT_SECRET': 'test-secret',
      'JWT_REFRESH_SECRET': 'test-refresh-secret',
      'JWT_ACCESS_EXPIRES_IN': '15m',
      'JWT_REFRESH_EXPIRES_IN': '7d',
      'JWT_ISSUER': 'test-issuer',
      'JWT_AUDIENCE': 'test-audience',
    };
    return map[key];
  }),
};

const mockRedis = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

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
      const hashedPw = await bcrypt.hash('Password123!', 1);
      const mockUser = {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'ADMIN',
        tenantId: 'tenant-1',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        mfaEnabled: false,
        tenant: mockTenant,
        profile: null,
      };

      mockPrisma.$transaction.mockImplementationOnce(async (cb: any) => {
        mockPrisma.tenant.create.mockResolvedValueOnce(mockTenant);
        mockPrisma.user.create.mockResolvedValueOnce(mockUser);
        return cb(mockPrisma);
      });
      mockPrisma.userSession.create.mockResolvedValueOnce({ id: 'session-1' });

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

  describe('login', () => {
    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.login({ email: 'nonexistent@test.com', password: 'Password123!', tenantId: 'tenant-1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashedPw = await bcrypt.hash('correct-password', 1);
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@test.com',
        passwordHash: hashedPw,
        isActive: true,
        mfaEnabled: false,
        role: 'STUDENT',
        tenantId: 'tenant-1',
        firstName: 'Test',
        lastName: 'User',
        tenant: { id: 'tenant-1' },
        profile: null,
      });

      await expect(
        service.login({ email: 'user@test.com', password: 'wrong-password', tenantId: 'tenant-1' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on successful login', async () => {
      const password = 'Password123!';
      const hashedPw = await bcrypt.hash(password, 1);
      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        passwordHash: hashedPw,
        isActive: true,
        mfaEnabled: false,
        role: 'STUDENT',
        tenantId: 'tenant-1',
        firstName: 'Test',
        lastName: 'User',
        tenant: { id: 'tenant-1' },
        profile: null,
      };

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrisma.userSession.create.mockResolvedValueOnce({ id: 'session-1' });
      mockPrisma.userDevice.upsert.mockResolvedValueOnce({ id: 'device-1' });
      mockPrisma.user.update.mockResolvedValueOnce(mockUser);

      const result = await service.login({
        email: 'user@test.com',
        password,
        tenantId: 'tenant-1',
      });

      expect(result).toHaveProperty('tokens');
      expect(result.tokens.accessToken).toBe('mock-token');
    });
  });
});
