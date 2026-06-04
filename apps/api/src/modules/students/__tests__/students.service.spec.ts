import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { StudentsService } from '../students.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  student: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  courseProgress: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
  submission: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
  quizAttempt: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
  userPoints: {
    findFirst: jest.fn(),
  },
};

describe('StudentsService', () => {
  let service: StudentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated students', async () => {
      const mockStudents = [
        {
          id: 's-1',
          user: { firstName: 'Alice', lastName: 'Brown', email: 'alice@school.com', isActive: true },
          grade: '10',
          _count: { courseProgress: 3 },
        },
      ];
      mockPrisma.student.findMany.mockResolvedValueOnce(mockStudents);
      mockPrisma.student.count.mockResolvedValueOnce(1);

      const result = await service.findAll('tenant-1', { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return student with learning progress', async () => {
      const mockStudent = {
        id: 's-1',
        userId: 'u-1',
        grade: '10',
        user: { firstName: 'Alice', lastName: 'Brown' },
        courseProgress: [
          { course: { title: 'Algebra I' }, progressPercent: 75, completedLessons: 15, totalLessons: 20 },
        ],
      };
      mockPrisma.student.findUnique.mockResolvedValueOnce(mockStudent);

      const result = await service.findOne('tenant-1', 's-1');

      expect(result.courseProgress).toHaveLength(1);
      expect(result.courseProgress[0].progressPercent).toBe(75);
    });

    it('should throw NotFoundException for unknown student', async () => {
      mockPrisma.student.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne('tenant-1', 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPerformanceSummary', () => {
    it('should compute average progress and quiz score', async () => {
      mockPrisma.student.findUnique.mockResolvedValueOnce({ id: 's-1', userId: 'u-1' });
      mockPrisma.courseProgress.aggregate.mockResolvedValueOnce({ _avg: { progressPercent: 72 } });
      mockPrisma.submission.count.mockResolvedValueOnce(8);
      mockPrisma.quizAttempt.aggregate.mockResolvedValueOnce({ _avg: { score: 85 } });
      mockPrisma.userPoints.findFirst.mockResolvedValueOnce({ total: 450 });

      const result = await service.getPerformanceSummary('tenant-1', 's-1');

      expect(result).toHaveProperty('averageProgress');
      expect(result).toHaveProperty('averageQuizScore');
      expect(result).toHaveProperty('totalPoints');
      expect(result.totalPoints).toBe(450);
    });
  });
});
