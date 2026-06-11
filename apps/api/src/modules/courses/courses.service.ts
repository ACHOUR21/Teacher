/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CourseLevel, ContentType, UserRole } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, IsEnum, IsInt, Min } from 'class-validator';
import slugify from 'slugify';

import { ApiEcosystemService } from '../api-ecosystem/api-ecosystem.service';
import { RedisService } from '../cache/redis.service';
import { PaginationDto, paginate } from '../core/pagination/pagination.dto';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../notifications/email/email.service';
import { SearchService } from '../search/search.service';


export class CreateCourseDto {
  @IsString()
  title: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  category?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsEnum(CourseLevel)
  level?: CourseLevel;

  @IsOptional() @IsString()
  language?: string;

  @IsOptional() @IsNumber()
  price?: number;

  @IsOptional() @IsString()
  thumbnailUrl?: string;
}

export class UpdateCourseDto {
  @IsOptional() @IsString()
  title?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  category?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsEnum(CourseLevel)
  level?: CourseLevel;

  @IsOptional() @IsString()
  language?: string;

  @IsOptional() @IsNumber()
  price?: number;

  @IsOptional() @IsString()
  thumbnailUrl?: string;

  @IsOptional() @IsBoolean()
  isFeatured?: boolean;
}

export class CreateSectionDto {
  @IsString()
  title: string;

  @IsInt() @Min(0)
  position: number;
}

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsOptional() @IsString()
  description?: string;

  @IsEnum(ContentType)
  contentType: ContentType;

  @IsOptional() @IsString()
  contentUrl?: string;

  @IsOptional() @IsNumber()
  duration?: number;

  @IsInt() @Min(0)
  position: number;

  @IsOptional() @IsBoolean()
  isPreview?: boolean;
}

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private searchService: SearchService,
    private apiEcosystem: ApiEcosystemService,
    private emailService: EmailService,
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
    return this.searchService.searchCourses(query, tenantId, filters as any);
  }

  async findById(id: string, tenantId: string) {
    const cacheKey = `course:${id}`;
    const cached = await this.redis.getObject<unknown>(cacheKey);
    if (cached) {return cached;}

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

    if (!course) {throw new NotFoundException('Course not found');}

    await this.redis.setObject(cacheKey, course, 300);
    return course;
  }

  async create(tenantId: string, userId: string, dto: CreateCourseDto) {
    const baseSlug = slugify(dto.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await this.prisma.course.findUnique({ where: { tenantId_slug: { tenantId, slug } } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Resolve Teacher record from userId (Course.teacherId → Teacher.id, not User.id)
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });

    const course = await this.prisma.course.create({
      data: {
        tenantId,
        teacherId: teacher?.id ?? null,
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
    if (!course) {throw new NotFoundException('Course not found');}

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
      await this.searchService.indexCourse({ ...updated, teacherName: '' });
    }

    return updated;
  }

  async publish(id: string, tenantId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, tenantId },
      include: { sections: { include: { lessons: true } } },
    });
    if (!course) {throw new NotFoundException('Course not found');}

    if (course.isPublished) {return course;}

    const published = await this.prisma.course.update({
      where: { id },
      data: { isPublished: true },
    });

    await this.redis.del(`course:${id}`);
    await this.searchService.indexCourse({ ...published, teacherName: '' });
    return published;
  }

  async unpublish(id: string, tenantId: string) {
    const course = await this.prisma.course.findFirst({ where: { id, tenantId } });
    if (!course) {throw new NotFoundException('Course not found');}

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
    if (!course) {throw new NotFoundException('Course not found');}

    await this.prisma.course.delete({ where: { id } });
    await this.redis.del(`course:${id}`);
    await this.searchService.deleteDocument('courses', id);
  }

  async updateSection(sectionId: string, tenantId: string, dto: { title?: string; position?: number }) {
    const section = await this.prisma.courseSection.findFirst({
      where: { id: sectionId, course: { tenantId } },
    });
    if (!section) {throw new NotFoundException('Section not found');}
    const updated = await this.prisma.courseSection.update({ where: { id: sectionId }, data: dto });
    await this.redis.del(`course:${section.courseId}`);
    return updated;
  }

  async deleteSection(sectionId: string, tenantId: string) {
    const section = await this.prisma.courseSection.findFirst({
      where: { id: sectionId, course: { tenantId } },
    });
    if (!section) {throw new NotFoundException('Section not found');}
    await this.prisma.courseSection.delete({ where: { id: sectionId } });
    // Recalculate lesson count
    const lessonCount = await this.prisma.lesson.count({ where: { section: { courseId: section.courseId } } });
    await this.prisma.course.update({ where: { id: section.courseId }, data: { totalLessons: lessonCount } });
    await this.redis.del(`course:${section.courseId}`);
  }

  async updateLesson(lessonId: string, tenantId: string, dto: { title?: string; description?: string; contentType?: string; contentUrl?: string; duration?: number; position?: number; isPreview?: boolean }) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, section: { course: { tenantId } } },
      include: { section: true },
    });
    if (!lesson) {throw new NotFoundException('Lesson not found');}
    const updated = await this.prisma.lesson.update({ where: { id: lessonId }, data: dto as any });
    await this.redis.del(`course:${lesson.section.courseId}`);
    return updated;
  }

  async deleteLesson(lessonId: string, tenantId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, section: { course: { tenantId } } },
      include: { section: true },
    });
    if (!lesson) {throw new NotFoundException('Lesson not found');}
    await this.prisma.lesson.delete({ where: { id: lessonId } });
    const lessonCount = await this.prisma.lesson.count({ where: { section: { courseId: lesson.section.courseId } } });
    await this.prisma.course.update({ where: { id: lesson.section.courseId }, data: { totalLessons: lessonCount } });
    await this.redis.del(`course:${lesson.section.courseId}`);
  }

  async createSection(courseId: string, tenantId: string, dto: CreateSectionDto) {
    const course = await this.prisma.course.findFirst({ where: { id: courseId, tenantId } });
    if (!course) {throw new NotFoundException('Course not found');}

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
    if (!section) {throw new NotFoundException('Section not found');}

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
    const course = await this.prisma.course.findFirst({ where: { id: courseId, tenantId } });
    if (!course) {throw new NotFoundException('Course not found');}

    const student = await this.prisma.student.findFirst({ where: { id: studentId } });
    if (!student) {throw new NotFoundException('Student profile not found');}

    const existing = await this.prisma.courseProgress.findUnique({
      where: { studentId_courseId: { studentId, courseId } },
    });
    if (existing) {return existing;}

    const progress = await this.prisma.courseProgress.create({
      data: { studentId, courseId, completedLessons: [] },
    });

    await this.prisma.course.update({
      where: { id: courseId },
      data: { enrollCount: { increment: 1 } },
    });

    // Fire-and-forget enrollment email
    this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    }).then(async (s) => {
      if (!s?.user?.email) { return; }
      const instructor = await this.prisma.teacher.findFirst({
        where: { courses: { some: { id: courseId } } },
        include: { user: { select: { firstName: true, lastName: true } } },
      });
      const instructorName = instructor?.user
        ? `${instructor.user.firstName} ${instructor.user.lastName}`
        : 'EduAI';
      const courseUrl = `${process.env['APP_URL'] ?? 'http://localhost:3000'}/courses/${courseId}`;
      await this.emailService.sendCourseEnrollment(s.user.email, {
        name: s.user.firstName,
        courseName: course.title,
        courseUrl,
        instructorName,
      }).catch(() => null);
    }).catch(() => null);

    // Fire-and-forget webhook
    this.apiEcosystem
      .deliverWebhook(tenantId, 'course.enrolled', { courseId, studentId })
      .catch(() => {});

    return progress;
  }

  async updateProgress(courseId: string, studentId: string, lessonId: string, tenantId: string) {
    const progress = await this.prisma.courseProgress.findFirst({
      where: { courseId, student: { id: studentId } },
    });
    if (!progress) {throw new NotFoundException('Enrollment not found');}

    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId },
      select: { totalLessons: true },
    });
    if (!course) {throw new NotFoundException('Course not found');}

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

    if (progressPercent >= 100) {
      // fire-and-forget: issue certificate if a template exists for this course
      this.issueCertificateIfTemplate(courseId, studentId).catch(() => {});
    }

    return updated;
  }

  private async issueCertificateIfTemplate(courseId: string, studentId: string) {
    const template = await this.prisma.certificateTemplate.findFirst({
      where: { courseId },
    });
    if (!template) {return;}

    const alreadyIssued = await this.prisma.issuedCertificate.findFirst({
      where: { templateId: template.id, studentId },
    });
    if (alreadyIssued) {return;}

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    const course = await this.prisma.course.findUnique({ where: { id: courseId }, select: { title: true } });
    if (!student || !course) {return;}

    await this.prisma.issuedCertificate.create({
      data: {
        templateId: template.id,
        studentId,
        issuedAt: new Date(),
        verifyCode: Math.random().toString(36).substring(2, 12).toUpperCase(),
        metadata: {
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          courseName: course.title,
          issuedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        },
      },
    });
  }

  async addReview(courseId: string, userId: string, rating: number, comment?: string) {
    const existing = await this.prisma.review.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
    if (existing) {throw new ConflictException('You have already reviewed this course');}

    if (rating < 1 || rating > 5) {throw new BadRequestException('Rating must be between 1 and 5');}

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
