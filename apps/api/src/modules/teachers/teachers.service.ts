import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TeachersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(tenantId: string, query: { search?: string; schoolId?: string; subject?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { user: { tenantId, isActive: true } };
    if (query.schoolId) {where.schoolId = query.schoolId;}
    if (query.search) {
      where.user = {
        tenantId,
        isActive: true,
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [teachers, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, createdAt: true } },
          school: { select: { name: true } },
          _count: { select: { courses: true, liveSessions: true } },
        },
        orderBy: { user: { firstName: 'asc' } },
      }),
      this.prisma.teacher.count({ where }),
    ]);

    return { data: teachers, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByUserId(userId: string) {
    return this.prisma.teacher.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
        school: { select: { name: true } },
        courses: { where: { isPublished: true }, take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, thumbnailUrl: true, rating: true, enrollCount: true } },
        _count: { select: { courses: true, liveSessions: true } },
      },
    });
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, phone: true } },
        school: { select: { name: true } },
        courses: { where: { isPublished: true }, take: 5, select: { id: true, title: true, thumbnailUrl: true, rating: true, enrollCount: true } },
        _count: { select: { courses: true, liveSessions: true } },
      },
    });
    if (!teacher) {throw new NotFoundException('Teacher not found');}
    return teacher;
  }

  async update(id: string, dto: { bio?: string; subjects?: string[]; yearsExperience?: number; qualifications?: object[] }) {
    return this.prisma.teacher.update({
      where: { id },
      data: dto,
    });
  }

  async getPerformanceStats(id: string) {
    const [coursesCount, studentsCount, avgRating, completionsCount] = await Promise.all([
      this.prisma.course.count({ where: { teacherId: id, isPublished: true } }),
      this.prisma.courseProgress.count({ where: { course: { teacherId: id } } }),
      this.prisma.course.aggregate({ where: { teacherId: id }, _avg: { rating: true } }),
      this.prisma.courseProgress.count({ where: { course: { teacherId: id }, completedAt: { not: null } } }),
    ]);

    return {
      coursesCount,
      studentsCount,
      avgRating: avgRating._avg.rating ?? 0,
      completionsCount,
      completionRate: studentsCount > 0 ? (completionsCount / studentsCount) * 100 : 0,
    };
  }

  async getTenantStats(tenantId: string) {
    const [total, activeThisMonth, totalCourses] = await Promise.all([
      this.prisma.teacher.count({ where: { user: { tenantId } } }),
      this.prisma.teacher.count({
        where: {
          user: { tenantId },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.course.count({ where: { teacher: { user: { tenantId } }, isPublished: true } }),
    ]);
    return { total, activeThisMonth, totalCourses };
  }

  async inviteTeacher(tenantId: string, dto: { email: string; firstName?: string; lastName?: string }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, slug: true } });
    const inviteLink = `${process.env['APP_URL'] ?? 'http://localhost:3000'}/join/${tenant?.slug ?? ''}`;
    await this.notifications.sendEmail(
      dto.email,
      `You're invited to teach on ${tenant?.name ?? 'EduAI'}`,
      `<p>Hi ${dto.firstName ?? 'there'},</p>
       <p>You've been invited to join <strong>${tenant?.name ?? 'EduAI'}</strong> as a teacher.</p>
       <a href="${inviteLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Accept Invitation →</a>`,
    );
    return { message: 'Invitation sent', email: dto.email, inviteLink };
  }

  async getSchedule(id: string) {
    const sessions = await this.prisma.liveSession.findMany({
      where: { teacherId: id, status: { in: ['SCHEDULED', 'LIVE'] } },
      orderBy: { scheduledAt: 'asc' },
      take: 20,
    });
    return sessions;
  }
}
