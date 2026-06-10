import { NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { ApiEcosystemService } from '../../api-ecosystem/api-ecosystem.service';
import { RedisService } from '../../cache/redis.service';
import { PaginationDto } from '../../core/pagination/pagination.dto';
import { PrismaService } from '../../database/prisma.service';
import { SearchService } from '../../search/search.service';
import { CoursesService } from '../courses.service';

// Helper: build a PaginationDto-compatible object with the skip getter
function makePagination(page = 1, limit = 20, extra: Partial<PaginationDto> = {}): PaginationDto {
  const dto = new PaginationDto();
  dto.page = page;
  dto.limit = limit;
  Object.assign(dto, extra);
  return dto;
}

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  getObject: jest.fn().mockResolvedValue(null),
  set: jest.fn(),
  setObject: jest.fn(),
  del: jest.fn(),
  delPattern: jest.fn(),
};

const mockSearch = { indexCourse: jest.fn(), deleteDocument: jest.fn(), searchCourses: jest.fn() };

const mockApiEcosystem = { deliverWebhook: jest.fn().mockResolvedValue(undefined) };

const mockPrisma = {
  course: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  courseSection: {
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
  lesson: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  courseProgress: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  enrollment: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  teacher: {
    findFirst: jest.fn(),
    findUnique: jest.fn().mockResolvedValue(null),
  },
  user: {
    findUnique: jest.fn(),
  },
  review: {
    findUnique: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  student: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  certificateTemplate: {
    findFirst: jest.fn(),
  },
  issuedCertificate: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

describe('CoursesService', () => {
  let service: CoursesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: SearchService, useValue: mockSearch },
        { provide: ApiEcosystemService, useValue: mockApiEcosystem },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    jest.clearAllMocks();
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated courses filtered by tenant', async () => {
      const mockCourses = [
        { id: 'course-1', title: 'Algebra 101', tenantId: 'tenant-1', level: 'BEGINNER' },
        { id: 'course-2', title: 'Physics Advanced', tenantId: 'tenant-1', level: 'ADVANCED' },
      ];
      mockPrisma.course.findMany.mockResolvedValueOnce(mockCourses);
      mockPrisma.course.count.mockResolvedValueOnce(2);

      const result = await service.findAll('tenant-1', makePagination(1, 10));

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      );
    });

    it('should filter by level when provided', async () => {
      mockPrisma.course.findMany.mockResolvedValueOnce([]);
      mockPrisma.course.count.mockResolvedValueOnce(0);

      await service.findAll('tenant-1', makePagination(1, 10), { level: 'BEGINNER' as any });

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ level: 'BEGINNER' }),
        }),
      );
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('should return a course by ID', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'Algebra 101',
        tenantId: 'tenant-1',
        sections: [],
        teacher: { user: { firstName: 'John', lastName: 'Doe' } },
      };
      mockPrisma.course.findFirst.mockResolvedValueOnce(mockCourse);

      const result = await service.findById('course-1', 'tenant-1');

      expect(result.id).toBe('course-1');
    });

    it('should throw NotFoundException when course does not exist', async () => {
      mockPrisma.course.findFirst.mockResolvedValueOnce(null);

      await expect(service.findById('nonexistent', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create a new course', async () => {
      const newCourse = {
        id: 'course-new',
        title: 'New Course',
        tenantId: 'tenant-1',
        level: 'BEGINNER',
        price: 0,
      };
      mockPrisma.course.findUnique.mockResolvedValue(null);
      mockPrisma.course.create.mockResolvedValueOnce(newCourse);

      const result = await service.create('tenant-1', 'teacher-1', {
        title: 'New Course',
        level: 'BEGINNER' as any,
        price: 0,
      });

      expect(result.id).toBe('course-new');
      expect(mockPrisma.course.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: 'tenant-1', title: 'New Course' }),
        }),
      );
    });
  });

  // ─── updateProgress ───────────────────────────────────────────────────────

  describe('updateProgress', () => {
    it('should update course progress for enrolled student', async () => {
      mockPrisma.courseProgress.findFirst.mockResolvedValueOnce({
        id: 'progress-1',
        courseId: 'course-1',
        completedLessons: [],
      });
      mockPrisma.course.findFirst.mockResolvedValueOnce({
        id: 'course-1',
        totalLessons: 10,
      });
      mockPrisma.courseProgress.update.mockResolvedValueOnce({
        id: 'progress-1',
        userId: 'user-1',
        courseId: 'course-1',
        completedLessons: ['lesson-1'],
        progressPercent: 10,
      });

      const result = await service.updateProgress('course-1', 'user-1', 'lesson-1', 'tenant-1');

      expect(result).toHaveProperty('progressPercent');
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('should throw NotFoundException when course not found', async () => {
      mockPrisma.course.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.update('nonexistent', 'tenant-1', { title: 'Updated' }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when teacher tries to edit another teacher course', async () => {
      mockPrisma.course.findFirst.mockResolvedValueOnce({
        id: 'course-1',
        tenantId: 'tenant-1',
        teacherId: 'teacher-99',
        isPublished: false,
      });
      mockPrisma.teacher.findFirst.mockResolvedValueOnce({ id: 'teacher-1', userId: 'user-1' });
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-1', role: 'TEACHER' });

      await expect(
        service.update('course-1', 'tenant-1', { title: 'Hacked' }, 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow admin to edit any course without ForbiddenException', async () => {
      const updatedCourse = {
        id: 'course-1',
        tenantId: 'tenant-1',
        teacherId: 'teacher-99',
        title: 'Admin Edit',
        isPublished: false,
      };
      mockPrisma.course.findFirst.mockResolvedValueOnce({
        id: 'course-1',
        tenantId: 'tenant-1',
        teacherId: 'teacher-99',
        isPublished: false,
      });
      mockPrisma.teacher.findFirst.mockResolvedValueOnce({ id: 'teacher-1', userId: 'user-admin' });
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'user-admin', role: 'ADMIN' });
      mockPrisma.course.update.mockResolvedValueOnce(updatedCourse);

      const result = await service.update('course-1', 'tenant-1', { title: 'Admin Edit' }, 'user-admin');

      expect(result.title).toBe('Admin Edit');
    });

    it('should update course fields and invalidate cache', async () => {
      const updatedCourse = {
        id: 'course-1',
        tenantId: 'tenant-1',
        teacherId: 'teacher-1',
        title: 'Updated Title',
        isPublished: false,
      };
      mockPrisma.course.findFirst.mockResolvedValueOnce({
        id: 'course-1',
        tenantId: 'tenant-1',
        teacherId: 'teacher-1',
        isPublished: false,
      });
      // teacher.findFirst returns null → user is not a teacher → no ownership check
      mockPrisma.teacher.findFirst.mockResolvedValueOnce(null);
      mockPrisma.course.update.mockResolvedValueOnce(updatedCourse);

      const result = await service.update('course-1', 'tenant-1', { title: 'Updated Title' }, 'user-1');

      expect(result.title).toBe('Updated Title');
      expect(mockPrisma.course.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'course-1' } }),
      );
      expect(mockRedis.del).toHaveBeenCalledWith('course:course-1');
    });
  });

  // ─── publish ──────────────────────────────────────────────────────────────

  describe('publish', () => {
    it('should throw NotFoundException when course not found', async () => {
      mockPrisma.course.findFirst.mockResolvedValueOnce(null);

      await expect(service.publish('nonexistent', 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('should return course idempotently when already published', async () => {
      const alreadyPublished = { id: 'course-1', tenantId: 'tenant-1', isPublished: true, sections: [] };
      mockPrisma.course.findFirst.mockResolvedValueOnce(alreadyPublished);

      const result = await service.publish('course-1', 'tenant-1');

      expect(result).toEqual(alreadyPublished);
      expect(mockPrisma.course.update).not.toHaveBeenCalled();
    });

    it('should publish unpublished course and index in search', async () => {
      const publishedCourse = {
        id: 'course-1',
        tenantId: 'tenant-1',
        isPublished: true,
        sections: [],
      };
      mockPrisma.course.findFirst.mockResolvedValueOnce({
        id: 'course-1',
        tenantId: 'tenant-1',
        isPublished: false,
        sections: [],
      });
      mockPrisma.course.update.mockResolvedValueOnce(publishedCourse);

      const result = await service.publish('course-1', 'tenant-1');

      expect(result.isPublished).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('course:course-1');
      expect(mockSearch.indexCourse).toHaveBeenCalled();
    });
  });

  // ─── unpublish ────────────────────────────────────────────────────────────

  describe('unpublish', () => {
    it('should throw NotFoundException when course not found', async () => {
      mockPrisma.course.findFirst.mockResolvedValueOnce(null);

      await expect(service.unpublish('nonexistent', 'tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('should set isPublished to false and remove from search index', async () => {
      const unpublishedCourse = { id: 'course-1', tenantId: 'tenant-1', isPublished: false };
      mockPrisma.course.findFirst.mockResolvedValueOnce({ id: 'course-1', tenantId: 'tenant-1' });
      mockPrisma.course.update.mockResolvedValueOnce(unpublishedCourse);

      const result = await service.unpublish('course-1', 'tenant-1');

      expect(result.isPublished).toBe(false);
      expect(mockRedis.del).toHaveBeenCalledWith('course:course-1');
      expect(mockSearch.deleteDocument).toHaveBeenCalledWith('courses', 'course-1');
    });
  });

  // ─── enrollStudent ────────────────────────────────────────────────────────

  describe('enrollStudent', () => {
    it('should throw NotFoundException when course is not published', async () => {
      mockPrisma.course.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.enrollStudent('course-1', 'student-1', 'tenant-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when student profile is not found', async () => {
      mockPrisma.course.findFirst.mockResolvedValueOnce({
        id: 'course-1',
        tenantId: 'tenant-1',
        isPublished: true,
      });
      mockPrisma.student.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.enrollStudent('course-1', 'student-1', 'tenant-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return existing progress when student is already enrolled (idempotent)', async () => {
      const existingProgress = { studentId: 'student-1', courseId: 'course-1', completedLessons: [] };
      mockPrisma.course.findFirst.mockResolvedValueOnce({
        id: 'course-1',
        tenantId: 'tenant-1',
        isPublished: true,
      });
      mockPrisma.student.findFirst.mockResolvedValueOnce({ id: 'student-1' });
      mockPrisma.courseProgress.findUnique.mockResolvedValueOnce(existingProgress);

      const result = await service.enrollStudent('course-1', 'student-1', 'tenant-1');

      expect(result).toEqual(existingProgress);
      expect(mockPrisma.courseProgress.create).not.toHaveBeenCalled();
    });

    it('should create progress record and increment enrollCount on success', async () => {
      const progressRecord = {
        id: 'progress-new',
        studentId: 'student-1',
        courseId: 'course-1',
        completedLessons: [],
      };
      mockPrisma.course.findFirst.mockResolvedValueOnce({
        id: 'course-1',
        tenantId: 'tenant-1',
        isPublished: true,
      });
      mockPrisma.student.findFirst.mockResolvedValueOnce({ id: 'student-1' });
      mockPrisma.courseProgress.findUnique.mockResolvedValueOnce(null);
      mockPrisma.courseProgress.create.mockResolvedValueOnce(progressRecord);
      mockPrisma.course.update.mockResolvedValueOnce({ id: 'course-1', enrollCount: 1 });

      const result = await service.enrollStudent('course-1', 'student-1', 'tenant-1');

      expect(result.id).toBe('progress-new');
      expect(mockPrisma.courseProgress.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ studentId: 'student-1', courseId: 'course-1' }),
        }),
      );
      expect(mockPrisma.course.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'course-1' },
          data: { enrollCount: { increment: 1 } },
        }),
      );
    });
  });

  // ─── createSection ────────────────────────────────────────────────────────

  describe('createSection', () => {
    it('should throw NotFoundException when course not found', async () => {
      mockPrisma.course.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.createSection('nonexistent', 'tenant-1', { title: 'Intro', position: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create section with correct courseId and invalidate cache', async () => {
      const newSection = { id: 'section-1', courseId: 'course-1', title: 'Intro', position: 1 };
      mockPrisma.course.findFirst.mockResolvedValueOnce({ id: 'course-1', tenantId: 'tenant-1' });
      mockPrisma.courseSection.create.mockResolvedValueOnce(newSection);

      const result = await service.createSection('course-1', 'tenant-1', { title: 'Intro', position: 1 });

      expect(result.id).toBe('section-1');
      expect(mockPrisma.courseSection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ courseId: 'course-1', title: 'Intro' }),
        }),
      );
      expect(mockRedis.del).toHaveBeenCalledWith('course:course-1');
    });
  });

  // ─── createLesson ─────────────────────────────────────────────────────────

  describe('createLesson', () => {
    it('should throw NotFoundException when section not found', async () => {
      mockPrisma.courseSection.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.createLesson('nonexistent-section', 'tenant-1', {
          title: 'Lesson 1',
          contentType: 'VIDEO' as any,
          position: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create lesson and update totalLessons count', async () => {
      const newLesson = {
        id: 'lesson-1',
        sectionId: 'section-1',
        title: 'Lesson 1',
        contentType: 'VIDEO',
        position: 1,
      };
      mockPrisma.courseSection.findFirst.mockResolvedValueOnce({
        id: 'section-1',
        courseId: 'course-1',
        course: { id: 'course-1' },
      });
      mockPrisma.lesson.create.mockResolvedValueOnce(newLesson);
      mockPrisma.lesson.count.mockResolvedValueOnce(3);
      mockPrisma.course.update.mockResolvedValueOnce({ id: 'course-1', totalLessons: 3 });

      const result = await service.createLesson('section-1', 'tenant-1', {
        title: 'Lesson 1',
        contentType: 'VIDEO' as any,
        position: 1,
      });

      expect(result.id).toBe('lesson-1');
      expect(mockPrisma.lesson.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { section: { courseId: 'course-1' } },
        }),
      );
      expect(mockPrisma.course.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'course-1' },
          data: { totalLessons: 3 },
        }),
      );
      expect(mockRedis.del).toHaveBeenCalledWith('course:course-1');
    });
  });

  // ─── addReview ────────────────────────────────────────────────────────────

  describe('addReview', () => {
    it('should throw ConflictException when user already reviewed this course', async () => {
      mockPrisma.review.findUnique.mockResolvedValueOnce({
        courseId: 'course-1',
        userId: 'user-1',
        rating: 4,
      });

      await expect(
        service.addReview('course-1', 'user-1', 4, 'Great!'),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for rating below 1', async () => {
      mockPrisma.review.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.addReview('course-1', 'user-1', 0),
      ).rejects.toThrow(new BadRequestException('Rating must be between 1 and 5'));
    });

    it('should throw BadRequestException for rating above 5', async () => {
      mockPrisma.review.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.addReview('course-1', 'user-1', 6),
      ).rejects.toThrow(new BadRequestException('Rating must be between 1 and 5'));
    });

    it('should create review and update course average rating', async () => {
      const newReview = { id: 'review-1', courseId: 'course-1', userId: 'user-1', rating: 5 };
      mockPrisma.review.findUnique.mockResolvedValueOnce(null);
      mockPrisma.review.create.mockResolvedValueOnce(newReview);
      mockPrisma.review.aggregate.mockResolvedValueOnce({ _avg: { rating: 4.5 } });
      mockPrisma.course.update.mockResolvedValueOnce({ id: 'course-1', rating: 4.5 });

      const result = await service.addReview('course-1', 'user-1', 5, 'Excellent!');

      expect(result.id).toBe('review-1');
      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ courseId: 'course-1', userId: 'user-1', rating: 5 }),
        }),
      );
      expect(mockPrisma.course.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'course-1' },
          data: { rating: 4.5 },
        }),
      );
      expect(mockRedis.del).toHaveBeenCalledWith('course:course-1');
    });
  });
});
