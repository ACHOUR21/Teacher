import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CoursesService } from '../courses.service';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../cache/redis.service';
import { SearchService } from '../../search/search.service';

const mockRedis = { get: jest.fn().mockResolvedValue(null), getObject: jest.fn().mockResolvedValue(null), set: jest.fn(), setObject: jest.fn(), del: jest.fn(), delPattern: jest.fn() };
const mockSearch = { indexCourse: jest.fn(), deleteDocument: jest.fn() };

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
  },
  lesson: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  courseProgress: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  },
  enrollment: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  teacher: {
    findFirst: jest.fn(),
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

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      );
    });

    it('should filter by level when provided', async () => {
      mockPrisma.course.findMany.mockResolvedValueOnce([]);
      mockPrisma.course.count.mockResolvedValueOnce(0);

      await service.findAll('tenant-1', { page: 1, limit: 10 }, { level: 'BEGINNER' as any });

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ level: 'BEGINNER' }),
        }),
      );
    });
  });

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
});
