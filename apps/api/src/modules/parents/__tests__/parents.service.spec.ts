import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ParentsService } from '../parents.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  parent: {
    findUnique: jest.fn(),
  },
  student: {
    findUnique: jest.fn(),
  },
  parentStudent: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  courseProgress: {
    findMany: jest.fn(),
  },
  submission: {
    findMany: jest.fn(),
  },
  liveParticipant: {
    findMany: jest.fn(),
  },
};

describe('ParentsService', () => {
  let service: ParentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ParentsService>(ParentsService);
    jest.clearAllMocks();
  });

  describe('getChildren', () => {
    it('should return children for a parent', async () => {
      const parent = {
        id: 'p-1',
        children: [
          {
            student: {
              id: 's-1',
              user: { firstName: 'Tom', lastName: 'Jones', email: 'tom@school.com', avatarUrl: null },
              school: { name: 'Main School' },
              class: { name: 'Class A', grade: '10' },
              _count: { courseProgress: 5 },
            },
          },
        ],
      };
      mockPrisma.parent.findUnique.mockResolvedValueOnce(parent);

      const result = await service.getChildren('parent-user-1');

      expect(result).toHaveLength(1);
      expect(result[0].user.firstName).toBe('Tom');
    });

    it('should throw NotFoundException when parent profile not found', async () => {
      mockPrisma.parent.findUnique.mockResolvedValueOnce(null);

      await expect(service.getChildren('bad-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getChildProgress', () => {
    it('should return progress for a linked child', async () => {
      mockPrisma.parent.findUnique.mockResolvedValueOnce({ id: 'p-1' });
      mockPrisma.parentStudent.findUnique.mockResolvedValueOnce({ parentId: 'p-1', studentId: 's-1' });
      mockPrisma.courseProgress.findMany.mockResolvedValueOnce([
        { progressPercent: 60, course: { title: 'Algebra', thumbnailUrl: null, totalLessons: 20 } },
      ]);

      const result = await service.getChildProgress('parent-user-1', 's-1');

      expect(result).toHaveLength(1);
      expect(result[0].progressPercent).toBe(60);
    });

    it('should throw ForbiddenException when not linked to student', async () => {
      mockPrisma.parent.findUnique.mockResolvedValueOnce({ id: 'p-1' });
      mockPrisma.parentStudent.findUnique.mockResolvedValueOnce(null);

      await expect(service.getChildProgress('parent-user-1', 'unrelated-student')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('linkChild', () => {
    it('should link a student to a parent', async () => {
      mockPrisma.parent.findUnique.mockResolvedValueOnce({ id: 'p-1' });
      mockPrisma.student.findUnique.mockResolvedValueOnce({ id: 's-1' });
      const link = { parentId: 'p-1', studentId: 's-1', relationship: 'parent' };
      mockPrisma.parentStudent.upsert.mockResolvedValueOnce(link);

      const result = await service.linkChild('parent-user-1', 's-1');

      expect(result.relationship).toBe('parent');
    });

    it('should throw NotFoundException when parent profile does not exist', async () => {
      mockPrisma.parent.findUnique.mockResolvedValueOnce(null);

      await expect(service.linkChild('bad-parent', 's-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when student does not exist', async () => {
      mockPrisma.parent.findUnique.mockResolvedValueOnce({ id: 'p-1' });
      mockPrisma.student.findUnique.mockResolvedValueOnce(null);

      await expect(service.linkChild('parent-user-1', 'bad-student')).rejects.toThrow(NotFoundException);
    });
  });
});
