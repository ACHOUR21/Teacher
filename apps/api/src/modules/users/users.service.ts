import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { PaginationDto, paginate } from '../core/pagination/pagination.dto';
import { UserRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export class UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

export class UpdateUserProfileDto {
  bio?: string;
  timezone?: string;
  language?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: Record<string, unknown>;
  socialLinks?: Record<string, unknown>;
  preferences?: Record<string, unknown>;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(tenantId: string, pagination: PaginationDto, roleFilter?: UserRole) {
    const { skip, limit, search, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    const where = {
      tenantId,
      ...(roleFilter && { role: roleFilter }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          avatarUrl: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          profile: { select: { timezone: true, language: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(items, total, pagination.page, limit);
  }

  async findById(id: string, tenantId: string) {
    const cacheKey = `user:${id}:profile`;
    const cached = await this.redis.getObject<unknown>(cacheKey);
    if (cached) return cached;

    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        phone: true,
        emailVerified: true,
        phoneVerified: true,
        mfaEnabled: true,
        createdAt: true,
        lastLoginAt: true,
        profile: true,
        teacherProfile: {
          select: { subjects: true, bio: true, rating: true, isVerified: true },
        },
        studentProfile: {
          select: { grade: true, gpa: true, studentId: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    await this.redis.setObject(cacheKey, user, 300);
    return user;
  }

  async update(id: string, tenantId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    await this.redis.del(`user:${id}:profile`);
    return updated;
  }

  async updateProfile(userId: string, tenantId: string, dto: UpdateUserProfileDto) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.timezone && { timezone: dto.timezone }),
        ...(dto.language && { language: dto.language }),
        ...(dto.dateOfBirth && { dateOfBirth: dto.dateOfBirth }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.address && { address: dto.address as Prisma.InputJsonValue }),
        ...(dto.socialLinks && { socialLinks: dto.socialLinks as Prisma.InputJsonValue }),
        ...(dto.preferences && { preferences: dto.preferences as Prisma.InputJsonValue }),
      },
      create: {
        userId,
        bio: dto.bio,
        timezone: dto.timezone || 'UTC',
        language: dto.language || 'en',
        dateOfBirth: dto.dateOfBirth,
        gender: dto.gender,
        address: dto.address as Prisma.InputJsonValue | undefined,
        socialLinks: (dto.socialLinks || {}) as Prisma.InputJsonValue,
        preferences: (dto.preferences || {}) as Prisma.InputJsonValue,
      },
    });

    await this.redis.del(`user:${userId}:profile`);
    return profile;
  }

  async delete(id: string, tenantId: string, requestingUser: { id: string; role: UserRole }) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('User not found');

    if (
      requestingUser.role !== UserRole.SUPER_ADMIN &&
      requestingUser.role !== UserRole.ADMIN &&
      requestingUser.id !== id
    ) {
      throw new ForbiddenException('Insufficient permissions to delete this user');
    }

    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
    await this.redis.del(`user:${id}:profile`);
    this.logger.log(`User ${id} deactivated by ${requestingUser.id}`);
  }

  async assignRole(userId: string, tenantId: string, role: UserRole, requestingUser: { role: UserRole }) {
    if (
      requestingUser.role !== UserRole.SUPER_ADMIN &&
      requestingUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Only admins can assign roles');
    }

    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    await this.redis.del(`user:${userId}:profile`);
    this.logger.log(`Role ${role} assigned to user ${userId} by ${requestingUser.role}`);
    return updated;
  }

  async updateMe(userId: string, tenantId: string, dto: UpdateUserDto & UpdateUserProfileDto) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('User not found');

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.firstName && { firstName: dto.firstName }),
          ...(dto.lastName && { lastName: dto.lastName }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        },
      }),
      this.prisma.userProfile.upsert({
        where: { userId },
        update: {
          ...(dto.bio !== undefined && { bio: dto.bio }),
          ...(dto.timezone && { timezone: dto.timezone }),
          ...(dto.language && { language: dto.language }),
        },
        create: {
          userId,
          bio: dto.bio,
          timezone: dto.timezone ?? 'UTC',
          language: dto.language ?? 'en',
        },
      }),
    ]);

    await this.redis.del(`user:${userId}:profile`);
    return updatedUser;
  }

  async getUserDevices(userId: string) {
    return this.prisma.userDevice.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async revokeDevice(userId: string, deviceId: string) {
    const device = await this.prisma.userDevice.findFirst({ where: { userId, deviceId } });
    if (!device) throw new NotFoundException('Device not found');
    await this.prisma.userDevice.update({ where: { deviceId }, data: { isActive: false } });
  }

  async getUserActivity(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('User not found');

    const [recentSessions, recentAuditLogs, courseProgress, achievements] = await Promise.all([
      this.prisma.userSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, ipAddress: true, userAgent: true, createdAt: true, expiresAt: true },
      }),
      this.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { action: true, resource: true, resourceId: true, createdAt: true },
      }),
      this.prisma.courseProgress.findMany({
        where: { student: { userId } },
        orderBy: { lastAccessedAt: 'desc' },
        take: 5,
        include: { course: { select: { title: true, slug: true } } },
      }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' },
        take: 5,
        include: { achievement: true },
      }),
    ]);

    return {
      sessions: recentSessions,
      auditLogs: recentAuditLogs,
      courseProgress,
      achievements,
    };
  }
}
