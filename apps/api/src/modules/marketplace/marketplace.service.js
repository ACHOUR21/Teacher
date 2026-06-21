"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MarketplaceService = void 0;
var _common = require("@nestjs/common");
var _billing = require("../billing/billing.service");
var _prisma = require("../database/prisma.service");
var _notifications = require("../notifications/notifications.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = void 0 && (void 0).__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = void 0 && (void 0).__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
let MarketplaceService = exports.MarketplaceService = class MarketplaceService {
  constructor(prisma, notifications, billing) {
    this.prisma = prisma;
    this.notifications = notifications;
    this.billing = billing;
  }
  async browseCourses(query) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = {
      isPublished: true
    };
    if (query.category) {
      where.category = query.category;
    }
    if (query.level) {
      where.level = query.level;
    }
    if (query.maxPrice !== undefined) {
      where.price = {
        lte: query.maxPrice
      };
    }
    if (query.minRating !== undefined) {
      where.rating = {
        gte: query.minRating
      };
    }
    if (query.search) {
      where.OR = [{
        title: {
          contains: query.search,
          mode: 'insensitive'
        }
      }, {
        description: {
          contains: query.search,
          mode: 'insensitive'
        }
      }, {
        tags: {
          has: query.search.toLowerCase()
        }
      }];
    }
    const orderBy = {};
    switch (query.sortBy) {
      case 'popular':
        orderBy.enrollCount = 'desc';
        break;
      case 'rating':
        orderBy.rating = 'desc';
        break;
      case 'newest':
        orderBy.createdAt = 'desc';
        break;
      case 'price-low':
        orderBy.price = 'asc';
        break;
      case 'price-high':
        orderBy.price = 'desc';
        break;
      default:
        orderBy.enrollCount = 'desc';
    }
    const [courses, total] = await Promise.all([this.prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            }
          }
        },
        _count: {
          select: {
            reviews: true
          }
        }
      }
    }), this.prisma.course.count({
      where
    })]);
    return {
      data: courses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  async purchaseCourse(userId, courseId, successUrl, cancelUrl) {
    const course = await this.prisma.course.findUnique({
      where: {
        id: courseId
      }
    });
    if (!course) {
      throw new _common.NotFoundException('Course not found');
    }
    // Paid course → Stripe Checkout Session
    if (course.price && Number(course.price) > 0) {
      const origin = successUrl ? new URL(successUrl).origin : 'http://localhost:3000';
      const sUrl = successUrl ?? `${origin}/marketplace/success`;
      const cUrl = cancelUrl ?? `${origin}/marketplace`;
      return this.billing.createCourseCheckoutSession(userId, courseId, sUrl, cUrl).then(result => ({
        ...result,
        requiresPayment: true
      }));
    }
    // Free course → direct enrollment
    const student = await this.prisma.student.findFirst({
      where: {
        userId
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student profile required to enroll');
    }
    const alreadyEnrolled = await this.prisma.courseProgress.findUnique({
      where: {
        studentId_courseId: {
          studentId: student.id,
          courseId
        }
      }
    });
    if (alreadyEnrolled) {
      throw new _common.ConflictException('Already enrolled in this course');
    }
    const [progress] = await this.prisma.$transaction([this.prisma.courseProgress.create({
      data: {
        studentId: student.id,
        courseId
      }
    }), this.prisma.course.update({
      where: {
        id: courseId
      },
      data: {
        enrollCount: {
          increment: 1
        }
      }
    })]);
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        email: true,
        firstName: true
      }
    });
    if (user) {
      this.notifications.sendCourseEnrollmentEmail(user.email, user.firstName, course.title, courseId).catch(() => {});
    }
    return {
      requiresPayment: false,
      progress
    };
  }
  async addReview(userId, courseId, rating, comment) {
    const existing = await this.prisma.review.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId
        }
      }
    });
    if (existing) {
      throw new _common.ConflictException('Already reviewed this course');
    }
    const review = await this.prisma.review.create({
      data: {
        courseId,
        userId,
        rating,
        comment
      }
    });
    const avg = await this.prisma.review.aggregate({
      where: {
        courseId
      },
      _avg: {
        rating: true
      }
    });
    await this.prisma.course.update({
      where: {
        id: courseId
      },
      data: {
        rating: avg._avg.rating ?? 0
      }
    });
    return review;
  }
  async getCourseReviews(courseId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([this.prisma.review.findMany({
      where: {
        courseId
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      }
    }), this.prisma.review.count({
      where: {
        courseId
      }
    })]);
    return {
      data: reviews,
      total,
      page,
      limit
    };
  }
  async getCategories() {
    const cats = await this.prisma.course.groupBy({
      by: ['category'],
      where: {
        isPublished: true,
        category: {
          not: null
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });
    return cats.filter(c => c.category).map(c => ({
      name: c.category,
      count: c._count.id
    }));
  }
};
exports.MarketplaceService = MarketplaceService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_notifications.NotificationsService)), __param(2, (0, _common.Inject)(_billing.BillingService)), __metadata("design:paramtypes", [Object, Object, Object])], MarketplaceService);