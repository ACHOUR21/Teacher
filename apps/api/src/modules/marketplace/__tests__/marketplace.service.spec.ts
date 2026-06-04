import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MarketplaceService } from '../marketplace.service';
import { PrismaService } from '../../database/prisma.service';

const mockPrisma = {
  course: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  enrollment: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  review: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
  courseProgress: {
    create: jest.fn(),
    upsert: jest.fn(),
  },
  $transaction: jest.fn((cb: any) => cb(mockPrisma)),
};

describe('MarketplaceService', () => {
  let service: MarketplaceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketplaceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<MarketplaceService>(MarketplaceService);
    jest.clearAllMocks();
  });

  describe('browseCourses', () => {
    it('should return paginated published courses', async () => {
      const mockCourses = [
        { id: 'c-1', title: 'React Basics', price: 0, rating: 4.8, level: 'BEGINNER', isPublished: true },
        { id: 'c-2', title: 'Advanced TypeScript', price: 29.99, rating: 4.5, level: 'ADVANCED', isPublished: true },
      ];
      mockPrisma.course.findMany.mockResolvedValueOnce(mockCourses);
      mockPrisma.course.count.mockResolvedValueOnce(2);

      const result = await service.browseCourses('tenant-1', 'user-1', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isPublished: true }),
        }),
      );
    });

    it('should filter courses by category', async () => {
      mockPrisma.course.findMany.mockResolvedValueOnce([]);
      mockPrisma.course.count.mockResolvedValueOnce(0);

      await service.browseCourses('tenant-1', 'user-1', {
        category: 'Mathematics',
        page: 1,
        limit: 10,
      });

      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'Mathematics' }),
        }),
      );
    });
  });

  describe('enrollInCourse', () => {
    it('should create enrollment for free course', async () => {
      const freeCourse = { id: 'c-free', title: 'Free Course', price: 0, isPublished: true, tenantId: 'tenant-1' };
      mockPrisma.course.findUnique.mockResolvedValueOnce(freeCourse);
      mockPrisma.enrollment.findFirst.mockResolvedValueOnce(null);
      mockPrisma.enrollment.create.mockResolvedValueOnce({
        id: 'enroll-1',
        userId: 'user-1',
        courseId: 'c-free',
        status: 'ACTIVE',
      });
      mockPrisma.courseProgress.upsert.mockResolvedValueOnce({ id: 'progress-1' });

      const result = await service.enrollInCourse('tenant-1', 'user-1', 'c-free');

      expect(result.status).toBe('ACTIVE');
      expect(mockPrisma.enrollment.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent course', async () => {
      mockPrisma.course.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.enrollInCourse('tenant-1', 'user-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already enrolled', async () => {
      mockPrisma.course.findUnique.mockResolvedValueOnce({
        id: 'c-1', price: 0, isPublished: true, tenantId: 'tenant-1',
      });
      mockPrisma.enrollment.findFirst.mockResolvedValueOnce({
        id: 'existing-enrollment',
        status: 'ACTIVE',
      });

      await expect(
        service.enrollInCourse('tenant-1', 'user-1', 'c-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitReview', () => {
    it('should create a review for an enrolled user', async () => {
      mockPrisma.enrollment.findFirst.mockResolvedValueOnce({ id: 'enroll-1', status: 'ACTIVE' });
      mockPrisma.review.findFirst.mockResolvedValueOnce(null);
      mockPrisma.review.create.mockResolvedValueOnce({
        id: 'review-1',
        rating: 5,
        comment: 'Excellent course!',
        userId: 'user-1',
        courseId: 'c-1',
      });
      mockPrisma.review.aggregate.mockResolvedValueOnce({ _avg: { rating: 4.8 } });

      const result = await service.submitReview('tenant-1', 'user-1', 'c-1', {
        rating: 5,
        comment: 'Excellent course!',
      });

      expect(result.rating).toBe(5);
    });

    it('should reject review from non-enrolled user', async () => {
      mockPrisma.enrollment.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.submitReview('tenant-1', 'user-1', 'c-1', { rating: 5 }),
      ).rejects.toThrow();
    });
  });
});
