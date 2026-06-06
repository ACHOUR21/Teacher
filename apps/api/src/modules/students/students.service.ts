import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(tenantId: string, query: { search?: string; schoolId?: string; classId?: string; grade?: string; page?: number; limit?: number }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const userWhere: Record<string, unknown> = { tenantId, isActive: true };
    if (query.search) {
      userWhere.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const where: Record<string, unknown> = { user: userWhere };
    if (query.schoolId) where.schoolId = query.schoolId;
    if (query.classId) where.classId = query.classId;
    if (query.grade) where.grade = query.grade;

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, createdAt: true, isActive: true } },
          school: { select: { name: true } },
          class: { select: { name: true, grade: true } },
          _count: { select: { courseProgress: true, certificates: true } },
        },
        orderBy: { user: { firstName: 'asc' } },
      }),
      this.prisma.student.count({ where }),
    ]);

    return { data: students, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, phone: true } },
        school: { select: { name: true } },
        class: { select: { name: true, grade: true } },
        courseProgress: {
          include: { course: { select: { id: true, title: true, thumbnailUrl: true, totalLessons: true } } },
          orderBy: { lastAccessedAt: 'desc' },
          take: 10,
        },
        certificates: { include: { template: { include: { course: { select: { title: true } } } } } },
        _count: { select: { courseProgress: true, certificates: true, submissions: true } },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async getLearningProgress(id: string) {
    const progress = await this.prisma.courseProgress.findMany({
      where: { studentId: id },
      include: { course: { select: { id: true, title: true, totalLessons: true, thumbnailUrl: true } } },
      orderBy: { lastAccessedAt: 'desc' },
    });
    return progress;
  }

  async getSubmissions(studentId: string) {
    return this.prisma.submission.findMany({
      where: { studentId },
      include: {
        assignment: { select: { title: true, maxScore: true, dueDate: true } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    });
  }

  async getPerformanceSummary(id: string) {
    const [totalCourses, completedCourses, pendingAssignments, gradedAssignments, points] = await Promise.all([
      this.prisma.courseProgress.count({ where: { studentId: id } }),
      this.prisma.courseProgress.count({ where: { studentId: id, completedAt: { not: null } } }),
      this.prisma.submission.count({ where: { studentId: id, status: 'PENDING' } }),
      this.prisma.submission.count({ where: { studentId: id, status: 'GRADED' } }),
      this.prisma.userPoints.findUnique({ where: { userId: id }, select: { total: true, level: true } }),
    ]);

    const avgScore = await this.prisma.submission.aggregate({
      where: { studentId: id, status: 'GRADED', score: { not: null } },
      _avg: { score: true },
    });

    return {
      totalCourses,
      completedCourses,
      completionRate: totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0,
      pendingAssignments,
      gradedAssignments,
      avgScore: avgScore._avg.score ?? 0,
      points: points?.total ?? 0,
      level: points?.level ?? 1,
    };
  }

  async inviteStudent(tenantId: string, dto: { email: string; firstName?: string; lastName?: string; grade?: string }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, slug: true } });
    const inviteLink = `${process.env['APP_URL'] ?? 'http://localhost:3000'}/join/${tenant?.slug ?? ''}`;
    await this.notifications.sendEmail(
      dto.email,
      `You're invited to join ${tenant?.name ?? 'EduAI'}`,
      `<p>Hi ${dto.firstName ?? 'there'},</p>
       <p>You've been invited to join <strong>${tenant?.name ?? 'EduAI'}</strong> as a student.</p>
       <a href="${inviteLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Accept Invitation →</a>`,
    );
    return { message: 'Invitation sent', email: dto.email, inviteLink };
  }
}
