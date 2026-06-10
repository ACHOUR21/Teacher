import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { StudentsService } from '../students.service';

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
    count: jest.fn(),
  },
  submission: {
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  quizAttempt: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
  userPoints: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('StudentsService', () => {
  let service: StudentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: NotificationsService,
          useValue: {
            createNotification: jest.fn().mockResolvedValue({}),
            sendToUser: jest.fn().mockResolvedValue({}),
          },
        },
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
          { course: { title: 'Algebra I' }, progressPercent: 75 },
        ],
        certificates: [],
        _count: { courseProgress: 1, certificates: 0, submissions: 0 },
      };
      mockPrisma.student.findUnique.mockResolvedValueOnce(mockStudent);

      const result = await service.findOne('s-1');

      expect(result.courseProgress).toHaveLength(1);
      expect(result.courseProgress[0].progressPercent).toBe(75);
    });

    it('should throw NotFoundException for unknown student', async () => {
      mockPrisma.student.findUnique.mockResolvedValueOnce(null);

      await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPerformanceSummary', () => {
    it('should compute course progress and submission stats', async () => {
      // courseProgress.count x2, submission.count x2, userPoints.findUnique, submission.aggregate
      mockPrisma.courseProgress.count.mockResolvedValueOnce(5); // totalCourses
      mockPrisma.courseProgress.count.mockResolvedValueOnce(3); // completedCourses
      mockPrisma.submission.count.mockResolvedValueOnce(2); // pendingAssignments
      mockPrisma.submission.count.mockResolvedValueOnce(6); // gradedAssignments
      mockPrisma.userPoints.findUnique.mockResolvedValueOnce({ total: 450, level: 3 });
      mockPrisma.submission.aggregate.mockResolvedValueOnce({ _avg: { score: 85 } });

      const result = await service.getPerformanceSummary('s-1');

      expect(result).toHaveProperty('totalCourses');
      expect(result).toHaveProperty('completedCourses');
      expect(result).toHaveProperty('points');
      expect(result.points).toBe(450);
    });
  });
});
