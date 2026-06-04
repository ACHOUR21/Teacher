import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TeachersService } from '../teachers.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  teacher: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  course: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  liveSession: {
    findMany: jest.fn(),
  },
  quizAttempt: {
    aggregate: jest.fn(),
  },
  review: {
    aggregate: jest.fn(),
  },
};

describe('TeachersService', () => {
  let service: TeachersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TeachersService>(TeachersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated teachers for a tenant', async () => {
      const mockTeachers = [
        {
          id: 't-1',
          userId: 'u-1',
          subjects: ['Mathematics', 'Physics'],
          user: { firstName: 'Jane', lastName: 'Smith', email: 'jane@school.com' },
          _count: { courses: 5 },
        },
      ];
      mockPrisma.teacher.findMany.mockResolvedValueOnce(mockTeachers);
      mockPrisma.teacher.count.mockResolvedValueOnce(1);

      const result = await service.findAll('tenant-1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].subjects).toContain('Mathematics');
    });

    it('should search teachers by name', async () => {
      mockPrisma.teacher.findMany.mockResolvedValueOnce([]);
      mockPrisma.teacher.count.mockResolvedValueOnce(0);

      await service.findAll('tenant-1', { search: 'Jane', page: 1, limit: 10 });

      expect(mockPrisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: expect.objectContaining({
              OR: expect.arrayContaining([
                expect.objectContaining({ firstName: expect.objectContaining({ contains: 'Jane' }) }),
              ]),
            }),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a teacher with their courses', async () => {
      const mockTeacher = {
        id: 't-1',
        userId: 'u-1',
        subjects: ['Mathematics'],
        user: { firstName: 'Jane', lastName: 'Smith' },
        courses: [{ id: 'c-1', title: 'Algebra I', _count: { enrollments: 25 } }],
      };
      mockPrisma.teacher.findUnique.mockResolvedValueOnce(mockTeacher);

      const result = await service.findOne('tenant-1', 't-1');

      expect(result.id).toBe('t-1');
      expect(result.courses).toHaveLength(1);
    });

    it('should throw NotFoundException for unknown teacher', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.findOne('tenant-1', 'unknown-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPerformanceStats', () => {
    it('should return aggregated performance statistics', async () => {
      mockPrisma.teacher.findUnique.mockResolvedValueOnce({ id: 't-1', userId: 'u-1' });
      mockPrisma.course.count.mockResolvedValueOnce(5);
      mockPrisma.course.findMany.mockResolvedValueOnce([
        { id: 'c-1', _count: { enrollments: 50 } },
        { id: 'c-2', _count: { enrollments: 30 } },
      ]);
      mockPrisma.review.aggregate.mockResolvedValueOnce({ _avg: { rating: 4.7 } });
      mockPrisma.liveSession.findMany.mockResolvedValueOnce([
        { id: 's-1', _count: { participants: 20 } },
      ]);

      const result = await service.getPerformanceStats('tenant-1', 't-1');

      expect(result).toHaveProperty('courseCount');
      expect(result).toHaveProperty('totalEnrollments');
      expect(result).toHaveProperty('averageRating');
    });
  });
});
