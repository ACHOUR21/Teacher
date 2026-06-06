import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: { search?: string; schoolId?: string; subject?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { user: { tenantId, isActive: true } };
    if (query.schoolId) where.schoolId = query.schoolId;
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
    if (!teacher) throw new NotFoundException('Teacher not found');
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

  async getSchedule(id: string) {
    const sessions = await this.prisma.liveSession.findMany({
      where: { teacherId: id, status: { in: ['SCHEDULED', 'LIVE'] } },
      orderBy: { scheduledAt: 'asc' },
      take: 20,
    });
    return sessions;
  }
}
