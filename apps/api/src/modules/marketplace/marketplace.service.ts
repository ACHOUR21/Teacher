import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MarketplaceService {
  constructor(private readonly prisma: PrismaService) {}

  async browseCourses(query: {
    search?: string;
    category?: string;
    level?: string;
    maxPrice?: number;
    minRating?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { isPublished: true };
    if (query.category) where.category = query.category;
    if (query.level) where.level = query.level;
    if (query.maxPrice !== undefined) where.price = { lte: query.maxPrice };
    if (query.minRating !== undefined) where.rating = { gte: query.minRating };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search.toLowerCase() } },
      ];
    }

    const orderBy: Record<string, string> = {};
    switch (query.sortBy) {
      case 'popular': orderBy.enrollCount = 'desc'; break;
      case 'rating': orderBy.rating = 'desc'; break;
      case 'newest': orderBy.createdAt = 'desc'; break;
      case 'price-low': orderBy.price = 'asc'; break;
      case 'price-high': orderBy.price = 'desc'; break;
      default: orderBy.enrollCount = 'desc';
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          teacher: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return { data: courses, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async purchaseCourse(userId: string, courseId: string) {
    const existing = await this.prisma.courseProgress.findUnique({
      where: { studentId_courseId: { studentId: userId, courseId } },
    });
    if (existing) throw new ConflictException('Already enrolled in this course');

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    // For paid courses, a Stripe payment intent would be created here
    // For free courses, direct enrollment
    const [student] = await Promise.all([
      this.prisma.student.findFirst({ where: { userId } }),
    ]);

    if (!student) throw new NotFoundException('Student profile required to enroll');

    const [progress] = await this.prisma.$transaction([
      this.prisma.courseProgress.create({ data: { studentId: student.id, courseId } }),
      this.prisma.course.update({ where: { id: courseId }, data: { enrollCount: { increment: 1 } } }),
    ]);

    return progress;
  }

  async addReview(userId: string, courseId: string, rating: number, comment?: string) {
    const existing = await this.prisma.review.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
    if (existing) throw new ConflictException('Already reviewed this course');

    const review = await this.prisma.review.create({ data: { courseId, userId, rating, comment } });

    const avg = await this.prisma.review.aggregate({ where: { courseId }, _avg: { rating: true } });
    await this.prisma.course.update({ where: { id: courseId }, data: { rating: avg._avg.rating ?? 0 } });

    return review;
  }

  async getCourseReviews(courseId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { courseId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      }),
      this.prisma.review.count({ where: { courseId } }),
    ]);
    return { data: reviews, total, page, limit };
  }

  async getCategories() {
    const cats = await this.prisma.course.groupBy({
      by: ['category'],
      where: { isPublished: true, category: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    return cats.filter(c => c.category).map(c => ({ name: c.category, count: c._count.id }));
  }
}
