"use strict";

var _common = require("@nestjs/common");
var _testing = require("@nestjs/testing");
var _billing = require("../../billing/billing.service");
var _prisma = require("../../database/prisma.service");
var _notifications = require("../../notifications/notifications.service");
var _search = require("../../search/search.service");
var _marketplace = require("../marketplace.service");
const mockPrisma = {
  course: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    update: jest.fn()
  },
  enrollment: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn()
  },
  review: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    aggregate: jest.fn(),
    count: jest.fn()
  },
  courseProgress: {
    create: jest.fn(),
    upsert: jest.fn(),
    findUnique: jest.fn()
  },
  student: {
    findFirst: jest.fn()
  },
  user: {
    findUnique: jest.fn()
  },
  $transaction: jest.fn(cb => cb(mockPrisma))
};
const mockSearch = {
  searchCourses: jest.fn().mockResolvedValue({
    hits: [],
    total: 0
  })
};
const mockBilling = {};
const mockNotifications = {
  sendCourseEnrollmentEmail: jest.fn().mockResolvedValue(undefined)
};
describe('MarketplaceService', () => {
  let service;
  beforeEach(async () => {
    const module = await _testing.Test.createTestingModule({
      providers: [_marketplace.MarketplaceService, {
        provide: _prisma.PrismaService,
        useValue: mockPrisma
      }, {
        provide: _search.SearchService,
        useValue: mockSearch
      }, {
        provide: _billing.BillingService,
        useValue: mockBilling
      }, {
        provide: _notifications.NotificationsService,
        useValue: mockNotifications
      }]
    }).compile();
    service = module.get(_marketplace.MarketplaceService);
    jest.clearAllMocks();
  });
  describe('browseCourses', () => {
    it('should return paginated published courses', async () => {
      const mockCourses = [{
        id: 'c-1',
        title: 'React Basics',
        price: 0,
        rating: 4.8,
        level: 'BEGINNER',
        isPublished: true
      }, {
        id: 'c-2',
        title: 'Advanced TypeScript',
        price: 29.99,
        rating: 4.5,
        level: 'ADVANCED',
        isPublished: true
      }];
      mockPrisma.course.findMany.mockResolvedValueOnce(mockCourses);
      mockPrisma.course.count.mockResolvedValueOnce(2);
      const result = await service.browseCourses({
        page: 1,
        limit: 10
      });
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
    it('should filter courses by category', async () => {
      mockPrisma.course.findMany.mockResolvedValueOnce([]);
      mockPrisma.course.count.mockResolvedValueOnce(0);
      await service.browseCourses({
        category: 'Mathematics',
        page: 1,
        limit: 10
      });
      expect(mockPrisma.course.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          category: 'Mathematics'
        })
      }));
    });
  });
  describe('purchaseCourse', () => {
    it('should create enrollment for free course', async () => {
      const freeCourse = {
        id: 'c-free',
        title: 'Free Course',
        price: 0,
        isPublished: true,
        tenantId: 'tenant-1'
      };
      mockPrisma.courseProgress.findUnique.mockResolvedValueOnce(null);
      mockPrisma.course.findUnique.mockResolvedValueOnce(freeCourse);
      mockPrisma.student.findFirst.mockResolvedValueOnce({
        id: 'student-1',
        userId: 'user-1'
      });
      mockPrisma.$transaction.mockImplementationOnce(arr => Promise.all(arr));
      mockPrisma.courseProgress.create.mockResolvedValueOnce({
        id: 'progress-1',
        studentId: 'student-1',
        courseId: 'c-free'
      });
      mockPrisma.course.update.mockResolvedValueOnce({
        id: 'c-free'
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        email: 'user@test.com',
        firstName: 'Jane'
      });
      await service.purchaseCourse('user-1', 'c-free');
      expect(mockPrisma.courseProgress.create).toHaveBeenCalled();
    });
    it('should throw NotFoundException for non-existent course', async () => {
      mockPrisma.course.findUnique.mockResolvedValueOnce(null);
      await expect(service.purchaseCourse('user-1', 'nonexistent')).rejects.toThrow(_common.NotFoundException);
    });
  });
  describe('addReview', () => {
    it('should create a review', async () => {
      mockPrisma.enrollment.findFirst.mockResolvedValueOnce({
        id: 'enroll-1',
        status: 'ACTIVE'
      });
      mockPrisma.review.findUnique.mockResolvedValueOnce(null);
      mockPrisma.review.create.mockResolvedValueOnce({
        id: 'review-1',
        rating: 5,
        comment: 'Excellent!',
        userId: 'user-1',
        courseId: 'c-1'
      });
      mockPrisma.review.aggregate.mockResolvedValueOnce({
        _avg: {
          rating: 4.8
        }
      });
      const result = await service.addReview('user-1', 'c-1', 5, 'Excellent!');
      expect(result.rating).toBe(5);
    });
  });
});