"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RecommendationEngineService = void 0;
var _common = require("@nestjs/common");
var _sdk = _interopRequireDefault(require("@anthropic-ai/sdk"));
var _prisma = require("../database/prisma.service");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
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
var RecommendationEngineService_1;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

let RecommendationEngineService = exports.RecommendationEngineService = RecommendationEngineService_1 = class RecommendationEngineService {
  logger = new _common.Logger(RecommendationEngineService_1.name);
  anthropic;
  constructor(prisma) {
    this.prisma = prisma;
    this.anthropic = new _sdk.default({
      apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder-key'
    });
  }
  async getRecommendations(userId, tenantId, limit = 10) {
    // 1. Find the student record for this user
    const student = await this.prisma.student.findFirst({
      where: {
        userId
      }
    });
    // 2. Get enrolled course IDs
    const enrolledProgress = student ? await this.prisma.courseProgress.findMany({
      where: {
        studentId: student.id
      },
      select: {
        courseId: true
      }
    }) : [];
    const enrolledCourseIds = new Set(enrolledProgress.map(p => p.courseId));
    // 3. Get all published courses in tenant with enrollment count and teacher info
    const allCourses = await this.prisma.course.findMany({
      where: {
        tenantId,
        isPublished: true
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });
    // 4. Extract categories from enrolled courses
    const enrolledCourses = allCourses.filter(c => enrolledCourseIds.has(c.id));
    const userCategories = [...new Set(enrolledCourses.map(c => c.category).filter(Boolean))];
    // 5. Candidate courses: not yet enrolled
    const candidateCourses = allCourses.filter(c => !enrolledCourseIds.has(c.id));
    // 6. Score candidates
    const scored = candidateCourses.map(course => {
      const categoryMatch = userCategories.includes(course.category ?? '') ? 1 : 0;
      const maxEnroll = Math.max(...candidateCourses.map(c => c.enrollCount), 1);
      const normalizedEnroll = course.enrollCount / maxEnroll;
      const normalizedRating = course.rating / 5;
      const score = normalizedEnroll * 0.3 + normalizedRating * 0.4 + categoryMatch * 0.3;
      const instructorName = course.teacher ? `${course.teacher.user.firstName} ${course.teacher.user.lastName}`.trim() : undefined;
      return {
        courseId: course.id,
        title: course.title,
        description: course.description ?? '',
        score,
        reason: 'Recommended based on your learning history',
        category: course.category ?? undefined,
        instructorName,
        rating: course.rating,
        enrollmentCount: course.enrollCount
      };
    });
    // 7. Sort by score desc
    scored.sort((a, b) => b.score - a.score);
    let recommendations = scored.slice(0, limit);
    let strategy = userCategories.length > 0 ? 'hybrid' : 'popular';
    // 8. If fewer than limit, fill with popular courses
    if (recommendations.length < limit) {
      const popular = await this.getPopularCourses(tenantId, limit - recommendations.length);
      const existingIds = new Set(recommendations.map(r => r.courseId));
      const fill = popular.filter(p => !existingIds.has(p.courseId));
      recommendations = [...recommendations, ...fill];
      if (userCategories.length === 0) {
        strategy = 'popular';
      }
    }
    // 9. Generate AI reasons for top 3
    const top3 = recommendations.slice(0, 3);
    const withReasons = await Promise.all(top3.map(async rec => ({
      ...rec,
      reason: await this.generateReason(userCategories, {
        title: rec.title,
        category: rec.category
      })
    })));
    const finalRecs = [...withReasons, ...recommendations.slice(3)];
    return {
      userId,
      recommendations: finalRecs,
      strategy,
      generatedAt: new Date()
    };
  }
  async getPopularCourses(tenantId, limit = 10, excludeCourseIds = []) {
    const courses = await this.prisma.course.findMany({
      where: {
        tenantId,
        isPublished: true,
        ...(excludeCourseIds.length > 0 ? {
          id: {
            notIn: excludeCourseIds
          }
        } : {})
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        enrollCount: 'desc'
      },
      take: limit
    });
    return courses.map(course => ({
      courseId: course.id,
      title: course.title,
      description: course.description ?? '',
      score: Math.min(course.enrollCount / 1000, 1),
      reason: 'Trending with many learners',
      category: course.category ?? undefined,
      instructorName: course.teacher ? `${course.teacher.user.firstName} ${course.teacher.user.lastName}`.trim() : undefined,
      rating: course.rating,
      enrollmentCount: course.enrollCount
    }));
  }
  async getSimilarCourses(courseId, tenantId, limit = 5) {
    const sourceCourse = await this.prisma.course.findUnique({
      where: {
        id: courseId
      },
      select: {
        category: true
      }
    });
    if (!sourceCourse?.category) {
      return this.getPopularCourses(tenantId, limit, [courseId]);
    }
    const courses = await this.prisma.course.findMany({
      where: {
        tenantId,
        isPublished: true,
        category: sourceCourse.category,
        id: {
          not: courseId
        }
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        enrollCount: 'desc'
      },
      take: limit
    });
    return courses.map(course => ({
      courseId: course.id,
      title: course.title,
      description: course.description ?? '',
      score: Math.min(course.enrollCount / 1000, 1),
      reason: `Similar to what you're viewing in ${sourceCourse.category}`,
      category: course.category ?? undefined,
      instructorName: course.teacher ? `${course.teacher.user.firstName} ${course.teacher.user.lastName}`.trim() : undefined,
      rating: course.rating,
      enrollmentCount: course.enrollCount
    }));
  }
  async getPersonalizedFeed(userId, tenantId) {
    const [recSet, trending, newCoursesRaw] = await Promise.all([this.getRecommendations(userId, tenantId, 10), this.getPopularCourses(tenantId, 10), this.prisma.course.findMany({
      where: {
        tenantId,
        isPublished: true
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })]);
    const newCourses = newCoursesRaw.map(course => ({
      courseId: course.id,
      title: course.title,
      description: course.description ?? '',
      score: 0.5,
      reason: 'Just added to the platform',
      category: course.category ?? undefined,
      instructorName: course.teacher ? `${course.teacher.user.firstName} ${course.teacher.user.lastName}`.trim() : undefined,
      rating: course.rating,
      enrollmentCount: course.enrollCount
    }));
    return {
      recommendations: recSet.recommendations,
      trending,
      newCourses
    };
  }
  async updateUserInterests(userId, courseId) {
    const course = await this.prisma.course.findUnique({
      where: {
        id: courseId
      },
      select: {
        category: true
      }
    });
    if (!course?.category) {
      return;
    }
    const profile = await this.prisma.userProfile.findUnique({
      where: {
        userId
      },
      select: {
        preferences: true
      }
    });
    const preferences = profile?.preferences ?? {};
    const interests = Array.isArray(preferences['interests']) ? preferences['interests'] : [];
    if (!interests.includes(course.category)) {
      interests.push(course.category);
    }
    await this.prisma.userProfile.upsert({
      where: {
        userId
      },
      update: {
        preferences: {
          ...preferences,
          interests
        }
      },
      create: {
        userId,
        preferences: {
          interests
        }
      }
    });
  }
  async generateReason(userCategories, course) {
    try {
      const categoriesText = userCategories.length > 0 ? userCategories.join(', ') : 'various topics';
      const msg = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Given a student interested in ${categoriesText}, generate a 1-sentence reason ` + `why they should take '${course.title}'. Return only the sentence, no quotes.`
        }]
      });
      const text = msg.content[0].text;
      return text.trim();
    } catch (err) {
      this.logger.warn('Failed to generate AI reason for recommendation', err);
      return 'Recommended based on your learning history';
    }
  }
};
exports.RecommendationEngineService = RecommendationEngineService = RecommendationEngineService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], RecommendationEngineService);