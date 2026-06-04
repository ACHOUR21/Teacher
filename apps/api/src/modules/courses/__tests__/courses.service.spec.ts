import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CoursesService } from '../courses.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  course: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  courseSection: {
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
  lesson: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  courseProgress: {
    findFirst: jest.fn(),
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
  enrollment: {
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
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated courses filtered by tenant', async () => {
      const mockCourses = [
        { id: 'course-1', title: 'Algebra 101', tenantId: 'tenant-1', level: 'BEGINNER' },
        { id: 'course-2', title: 'Physics Advanced', tenantId: 'tenant-1', level: 'ADVANCED' },
      ];
      mockPrisma.course.findMany.mockResolvedValueOnce(mockCourses);
      mockPrisma.course.count.mockResolvedValueOnce(2);

      const result = await service.findAll('tenant-1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      );
    });

    it('should filter by level when provided', async () => {
      mockPrisma.course.findMany.mockResolvedValueOnce([]);
      mockPrisma.course.count.mockResolvedValueOnce(0);

      await service.findAll('tenant-1', { level: 'BEGINNER', page: 1, limit: 10 });

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ level: 'BEGINNER' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a course by ID', async () => {
      const mockCourse = {
        id: 'course-1',
        title: 'Algebra 101',
        tenantId: 'tenant-1',
        sections: [],
        teacher: { user: { firstName: 'John', lastName: 'Doe' } },
      };
      mockPrisma.course.findUnique.mockResolvedValueOnce(mockCourse);

      const result = await service.findOne('tenant-1', 'course-1');

      expect(result.id).toBe('course-1');
    });

    it('should throw NotFoundException when course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne('tenant-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new course', async () => {
      const newCourse = {
        id: 'course-new',
        title: 'New Course',
        tenantId: 'tenant-1',
        level: 'BEGINNER',
        price: 0,
      };
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

  describe('updateProgress', () => {
    it('should upsert course progress for enrolled user', async () => {
      mockPrisma.courseProgress.upsert.mockResolvedValueOnce({
        id: 'progress-1',
        userId: 'user-1',
        courseId: 'course-1',
        completedLessons: 3,
        progressPercent: 30,
      });

      const result = await service.updateProgress('tenant-1', 'user-1', 'course-1', {
        lessonId: 'lesson-1',
        completed: true,
      });

      expect(result).toHaveProperty('progressPercent');
    });
  });
});
