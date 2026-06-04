import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { SearchService } from '../search/search.service';
import { PaginationDto, paginate } from '../core/pagination/pagination.dto';
import { CourseLevel, ContentType, UserRole } from '@prisma/client';
import slugify from 'slugify';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateCourseDto {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  level?: CourseLevel;
  language?: string;
  price?: number;
  thumbnailUrl?: string;
}

export class UpdateCourseDto {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  level?: CourseLevel;
  language?: string;
  price?: number;
  thumbnailUrl?: string;
  isFeatured?: boolean;
}

export class CreateSectionDto {
  title: string;
  position: number;
}

export class CreateLessonDto {
  title: string;
  description?: string;
  contentType: ContentType;
  contentUrl?: string;
  duration?: number;
  position: number;
  isPreview?: boolean;
}

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private searchService: SearchService,
  ) {}

  async findAll(tenantId: string, pagination: PaginationDto, filters?: {
    category?: string;
    level?: CourseLevel;
    teacherId?: string;
    published?: boolean;
  }) {
    const { skip, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    const where = {
      tenantId,
      ...(filters?.category && { category: filters.category }),
      ...(filters?.level && { level: filters.level }),
      ...(filters?.teacherId && { teacherId: filters.teacherId }),
      ...(filters?.published !== undefined && { isPublished: filters.published }),
      ...(pagination.search && {
        OR: [
          { title: { contains: pagination.search, mode: 'insensitive' as const } },
          { description: { contains: pagination.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          teacher: {
            include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
          },
          _count: { select: { sections: true, reviews: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return paginate(items, total, pagination.page, limit);
  }

  async search(tenantId: string, query: string, filters?: Record<string, unknown>) {
    return this.searchService.searchCourses(query, { tenantId, ...filters });
  }

  async findById(id: string, tenantId: string) {
    const cacheKey = `course:${id}`;
    const cached = await this.redis.getObject<unknown>(cacheKey);
    if (cached) return cached;

    const course = await this.prisma.course.findFirst({
      where: { id, tenantId },
      include: {
        teacher: {
          include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
        sections: {
          include: { lessons: { orderBy: { position: 'asc' } } },
          orderBy: { position: 'asc' },
        },
        reviews: {
          include: { course: { select: { title: true } } },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { progress: true } },
      },
    });

    if (!course) throw new NotFoundException('Course not found');

    await this.redis.setObject(cacheKey, course, 300);
    return course;
  }

  async create(tenantId: string, teacherId: string, dto: CreateCourseDto) {
    const baseSlug = slugify(dto.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.course.findUnique({ where: { tenantId_slug: { tenantId, slug } } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const course = await this.prisma.course.create({
      data: {
        tenantId,
        teacherId,
        title: dto.title,
        slug,
        description: dto.description,
        category: dto.category,
        tags: dto.tags || [],
        level: dto.level || CourseLevel.BEGINNER,
        language: dto.language || 'en',
        price: dto.price ? new Decimal(dto.price) : new Decimal(0),
        thumbnailUrl: dto.thumbnailUrl,
      },
    });

    this.logger.log(`Course created: ${course.slug} in tenant ${tenantId}`);
    return course;
  }

  async update(id: string, tenantId: string, dto: UpdateCourseDto, userId: string) {
    const course = await this.prisma.course.findFirst({ where: { id, tenantId } });
    if (!course) throw new NotFoundException('Course not found');

    const teacher = await this.prisma.teacher.findFirst({ where: { userId } });
    if (teacher && course.teacherId !== teacher.id) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('You can only edit your own courses');
      }
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.level && { level: dto.level }),
        ...(dto.language && { language: dto.language }),
        ...(dto.price !== undefined && { price: new Decimal(dto.price) }),
        ...(dto.thumbnailUrl !== undefined && { thumbnailUrl: dto.thumbnailUrl }),
        ...(dto.isFeatured !== undefined && { isFeatured: dto.isFeatured }),
      },
    });

    await this.redis.del(`course:${id}`);

    if (updated.isPublished) {
      await this.searchService.indexCourse(updated);
    }

    return updated;
  }

  async publish(id: string, tenantId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, tenantId },
      include: { sections: { include: { lessons: true } } },
    });
    if (!course) throw new NotFoundException('Course not found');

    if (course.sections.length === 0) {
      throw new BadRequestException('Course must have at least one section with lessons to publish');
    }

    const published = await this.prisma.course.update({
      where: { id },
      data: { isPublished: true },
    });

    await this.redis.del(`course:${id}`);
    await this.searchService.indexCourse(published);
    return published;
  }

  async unpublish(id: string, tenantId: string) {
    const course = await this.prisma.course.findFirst({ where: { id, tenantId } });
    if (!course) throw new NotFoundException('Course not found');

    const unpublished = await this.prisma.course.update({
      where: { id },
      data: { isPublished: false },
    });

    await this.redis.del(`course:${id}`);
    await this.searchService.deleteDocument('courses', id);
    return unpublished;
  }

  async delete(id: string, tenantId: string) {
    const course = await this.prisma.course.findFirst({ where: { id, tenantId } });
    if (!course) throw new NotFoundException('Course not found');

    await this.prisma.course.delete({ where: { id } });
    await this.redis.del(`course:${id}`);
    await this.searchService.deleteDocument('courses', id);
  }

  async createSection(courseId: string, tenantId: string, dto: CreateSectionDto) {
    const course = await this.prisma.course.findFirst({ where: { id: courseId, tenantId } });
    if (!course) throw new NotFoundException('Course not found');

    const section = await this.prisma.courseSection.create({
      data: { courseId, title: dto.title, position: dto.position },
    });

    await this.redis.del(`course:${courseId}`);
    return section;
  }

  async createLesson(sectionId: string, tenantId: string, dto: CreateLessonDto) {
    const section = await this.prisma.courseSection.findFirst({
      where: { id: sectionId, course: { tenantId } },
      include: { course: true },
    });
    if (!section) throw new NotFoundException('Section not found');

    const lesson = await this.prisma.lesson.create({
      data: {
        sectionId,
        title: dto.title,
        description: dto.description,
        contentType: dto.contentType,
        contentUrl: dto.contentUrl,
        duration: dto.duration || 0,
        position: dto.position,
        isPreview: dto.isPreview || false,
      },
    });

    // Update total lessons count
    const lessonCount = await this.prisma.lesson.count({
      where: { section: { courseId: section.courseId } },
    });
    await this.prisma.course.update({
      where: { id: section.courseId },
      data: { totalLessons: lessonCount },
    });

    await this.redis.del(`course:${section.courseId}`);
    return lesson;
  }

  async enrollStudent(courseId: string, studentId: string, tenantId: string) {
    const course = await this.prisma.course.findFirst({ where: { id: courseId, tenantId, isPublished: true } });
    if (!course) throw new NotFoundException('Course not found or not published');

    const student = await this.prisma.student.findFirst({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const existing = await this.prisma.courseProgress.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing) throw new ConflictException('Already enrolled in this course');

    const progress = await this.prisma.courseProgress.create({
      data: { studentId, courseId, completedLessons: [] },
    });

    await this.prisma.course.update({
      where: { id: courseId },
      data: { enrollCount: { increment: 1 } },
    });

    return progress;
  }

  async updateProgress(courseId: string, studentId: string, lessonId: string, tenantId: string) {
    const progress = await this.prisma.courseProgress.findFirst({
      where: { courseId, student: { id: studentId } },
    });
    if (!progress) throw new NotFoundException('Enrollment not found');

    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId },
      select: { totalLessons: true },
    });
    if (!course) throw new NotFoundException('Course not found');

    const completedLessons = Array.from(new Set([...progress.completedLessons, lessonId]));
    const progressPercent = course.totalLessons > 0
      ? (completedLessons.length / course.totalLessons) * 100
      : 0;

    const updated = await this.prisma.courseProgress.update({
      where: { id: progress.id },
      data: {
        completedLessons,
        progressPercent,
        lastAccessedAt: new Date(),
        completedAt: progressPercent >= 100 ? new Date() : null,
      },
    });

    return updated;
  }

  async addReview(courseId: string, userId: string, rating: number, comment?: string) {
    const existing = await this.prisma.review.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
    if (existing) throw new ConflictException('You have already reviewed this course');

    if (rating < 1 || rating > 5) throw new BadRequestException('Rating must be between 1 and 5');

    const review = await this.prisma.review.create({
      data: { courseId, userId, rating, comment },
    });

    // Update course average rating
    const avgResult = await this.prisma.review.aggregate({
      where: { courseId },
      _avg: { rating: true },
    });

    await this.prisma.course.update({
      where: { id: courseId },
      data: { rating: avgResult._avg.rating || 0 },
    });

    await this.redis.del(`course:${courseId}`);
    return review;
  }
}
