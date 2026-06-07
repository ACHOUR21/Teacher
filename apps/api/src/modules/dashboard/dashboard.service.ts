import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) {
      // Teacher dashboard stats
      const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
      if (!teacher) return { enrolledCourses: 0, completedCourses: 0, upcomingSessions: 0, totalPoints: 0 };
      const [courses, sessions, points] = await Promise.all([
        this.prisma.course.count({ where: { teacherId: teacher.id } }),
        this.prisma.liveSession.count({ where: { teacherId: teacher.id, status: { in: ['SCHEDULED', 'LIVE'] } } }),
        this.prisma.userPoints.findUnique({ where: { userId }, select: { total: true } }),
      ]);
      return { enrolledCourses: courses, completedCourses: 0, upcomingSessions: sessions, totalPoints: points?.total ?? 0 };
    }

    const [enrolled, completed, sessions, points] = await Promise.all([
      this.prisma.courseProgress.count({ where: { studentId: student.id } }),
      this.prisma.courseProgress.count({ where: { studentId: student.id, completedAt: { not: null } } }),
      this.prisma.liveSession.count({ where: { status: { in: ['SCHEDULED', 'LIVE'] } } }),
      this.prisma.userPoints.findUnique({ where: { userId }, select: { total: true } }),
    ]);

    return {
      enrolledCourses: enrolled,
      completedCourses: completed,
      upcomingSessions: sessions,
      totalPoints: points?.total ?? 0,
    };
  }

  async getRecentCourses(userId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true } });
    if (!student) return [];

    const progress = await this.prisma.courseProgress.findMany({
      where: { studentId: student.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true,
            totalLessons: true,
            teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { lastAccessedAt: 'desc' },
      take: 5,
    });

    return progress.map(p => ({
      id: p.course.id,
      title: p.course.title,
      thumbnailUrl: p.course.thumbnailUrl,
      instructor: p.course.teacher
        ? `${p.course.teacher.user.firstName} ${p.course.teacher.user.lastName}`
        : 'Unknown',
      progress: p.course.totalLessons > 0
        ? Math.round((p.completedLessons.length / p.course.totalLessons) * 100)
        : Math.round(p.progressPercent),
      nextLesson: null,
    }));
  }

  async getRecommendations(userId: string, tenantId: string) {
    const student = await this.prisma.student.findUnique({ where: { userId }, select: { id: true } });

    const enrolledIds = student
      ? (await this.prisma.courseProgress.findMany({ where: { studentId: student.id }, select: { courseId: true } })).map(p => p.courseId)
      : [];

    const courses = await this.prisma.course.findMany({
      where: {
        tenantId,
        isPublished: true,
        id: { notIn: enrolledIds },
      },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        category: true,
        rating: true,
        enrollCount: true,
      },
      orderBy: { rating: 'desc' },
      take: 6,
    });

    return courses.map(c => ({
      id: c.id,
      title: c.title,
      reason: `Top rated in ${c.category ?? 'General'}`,
      category: c.category ?? 'General',
      thumbnailUrl: c.thumbnailUrl,
      rating: c.rating,
    }));
  }

  async getUpcomingSessions(tenantId: string) {
    return this.prisma.liveSession.findMany({
      where: {
        status: { in: ['SCHEDULED', 'LIVE'] },
        teacher: { user: { tenantId } },
      },
      include: {
        teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { participants: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    });
  }
}
