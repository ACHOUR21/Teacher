"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UpdateCourseDto = exports.CreateSectionDto = exports.CreateLessonDto = exports.CreateCourseDto = exports.CoursesService = void 0;
var _common = require("@nestjs/common");
var _client = require("@prisma/client");
var _library = require("@prisma/client/runtime/library");
var _classValidator = require("class-validator");
var _slugify = _interopRequireDefault(require("slugify"));
var _apiEcosystem = require("../api-ecosystem/api-ecosystem.service");
var _redis = require("../cache/redis.service");
var _pagination = require("../core/pagination/pagination.dto");
var _prisma = require("../database/prisma.service");
var _email = require("../notifications/email/email.service");
var _search = require("../search/search.service");
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
var CoursesService_1;
var _a, _b, _c;
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */

class CreateCourseDto {
  title;
  description;
  category;
  tags;
  level;
  language;
  price;
  thumbnailUrl;
}
exports.CreateCourseDto = CreateCourseDto;
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], CreateCourseDto.prototype, "title", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateCourseDto.prototype, "description", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateCourseDto.prototype, "category", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsArray)(), (0, _classValidator.IsString)({
  each: true
}), __metadata("design:type", Array)], CreateCourseDto.prototype, "tags", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsEnum)(_client.CourseLevel), __metadata("design:type", typeof (_a = typeof _client.CourseLevel !== "undefined" && _client.CourseLevel) === "function" ? _a : Object)], CreateCourseDto.prototype, "level", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateCourseDto.prototype, "language", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsNumber)(), __metadata("design:type", Number)], CreateCourseDto.prototype, "price", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateCourseDto.prototype, "thumbnailUrl", void 0);
class UpdateCourseDto {
  title;
  description;
  category;
  tags;
  level;
  language;
  price;
  thumbnailUrl;
  isFeatured;
}
exports.UpdateCourseDto = UpdateCourseDto;
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], UpdateCourseDto.prototype, "title", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], UpdateCourseDto.prototype, "description", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], UpdateCourseDto.prototype, "category", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsArray)(), (0, _classValidator.IsString)({
  each: true
}), __metadata("design:type", Array)], UpdateCourseDto.prototype, "tags", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsEnum)(_client.CourseLevel), __metadata("design:type", typeof (_b = typeof _client.CourseLevel !== "undefined" && _client.CourseLevel) === "function" ? _b : Object)], UpdateCourseDto.prototype, "level", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], UpdateCourseDto.prototype, "language", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsNumber)(), __metadata("design:type", Number)], UpdateCourseDto.prototype, "price", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], UpdateCourseDto.prototype, "thumbnailUrl", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsBoolean)(), __metadata("design:type", Boolean)], UpdateCourseDto.prototype, "isFeatured", void 0);
class CreateSectionDto {
  title;
  position;
}
exports.CreateSectionDto = CreateSectionDto;
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], CreateSectionDto.prototype, "title", void 0);
__decorate([(0, _classValidator.IsInt)(), (0, _classValidator.Min)(0), __metadata("design:type", Number)], CreateSectionDto.prototype, "position", void 0);
class CreateLessonDto {
  title;
  description;
  contentType;
  contentUrl;
  duration;
  position;
  isPreview;
}
exports.CreateLessonDto = CreateLessonDto;
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], CreateLessonDto.prototype, "title", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateLessonDto.prototype, "description", void 0);
__decorate([(0, _classValidator.IsEnum)(_client.ContentType), __metadata("design:type", typeof (_c = typeof _client.ContentType !== "undefined" && _client.ContentType) === "function" ? _c : Object)], CreateLessonDto.prototype, "contentType", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateLessonDto.prototype, "contentUrl", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsNumber)(), __metadata("design:type", Number)], CreateLessonDto.prototype, "duration", void 0);
__decorate([(0, _classValidator.IsInt)(), (0, _classValidator.Min)(0), __metadata("design:type", Number)], CreateLessonDto.prototype, "position", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsBoolean)(), __metadata("design:type", Boolean)], CreateLessonDto.prototype, "isPreview", void 0);
let CoursesService = exports.CoursesService = CoursesService_1 = class CoursesService {
  logger = new _common.Logger(CoursesService_1.name);
  constructor(prisma, redis, searchService, apiEcosystem, emailService) {
    this.prisma = prisma;
    this.redis = redis;
    this.searchService = searchService;
    this.apiEcosystem = apiEcosystem;
    this.emailService = emailService;
  }
  async findAll(tenantId, pagination, filters) {
    const {
      skip,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;
    const where = {
      tenantId,
      ...(filters?.category && {
        category: filters.category
      }),
      ...(filters?.level && {
        level: filters.level
      }),
      ...(filters?.teacherId && {
        teacherId: filters.teacherId
      }),
      ...(filters?.published !== undefined && {
        isPublished: filters.published
      }),
      ...(pagination.search && {
        OR: [{
          title: {
            contains: pagination.search,
            mode: 'insensitive'
          }
        }, {
          description: {
            contains: pagination.search,
            mode: 'insensitive'
          }
        }]
      })
    };
    const [items, total] = await Promise.all([this.prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
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
            sections: true,
            reviews: true
          }
        }
      }
    }), this.prisma.course.count({
      where
    })]);
    return (0, _pagination.paginate)(items, total, pagination.page, limit);
  }
  async search(tenantId, query, filters) {
    return this.searchService.searchCourses(query, tenantId, filters);
  }
  async findById(id, tenantId) {
    const cacheKey = `course:${id}`;
    const cached = await this.redis.getObject(cacheKey);
    if (cached) {
      return cached;
    }
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        tenantId
      },
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
        sections: {
          include: {
            lessons: {
              orderBy: {
                position: 'asc'
              }
            }
          },
          orderBy: {
            position: 'asc'
          }
        },
        reviews: {
          include: {
            course: {
              select: {
                title: true
              }
            }
          },
          take: 10,
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            progress: true
          }
        }
      }
    });
    if (!course) {
      throw new _common.NotFoundException('Course not found');
    }
    await this.redis.setObject(cacheKey, course, 300);
    return course;
  }
  async create(tenantId, userId, dto) {
    const baseSlug = (0, _slugify.default)(dto.title, {
      lower: true,
      strict: true
    });
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.course.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug
        }
      }
    })) {
      slug = `${baseSlug}-${counter++}`;
    }
    // Resolve Teacher record from userId (Course.teacherId → Teacher.id, not User.id)
    const teacher = await this.prisma.teacher.findUnique({
      where: {
        userId
      }
    });
    const course = await this.prisma.course.create({
      data: {
        tenantId,
        teacherId: teacher?.id ?? null,
        title: dto.title,
        slug,
        description: dto.description,
        category: dto.category,
        tags: dto.tags || [],
        level: dto.level || _client.CourseLevel.BEGINNER,
        language: dto.language || 'en',
        price: dto.price ? new _library.Decimal(dto.price) : new _library.Decimal(0),
        thumbnailUrl: dto.thumbnailUrl
      }
    });
    this.logger.log(`Course created: ${course.slug} in tenant ${tenantId}`);
    // Auto-index new course (fire-and-forget; gracefully degrades if ES is down)
    this.searchService.indexCourse({
      ...course,
      teacherName: ''
    }).catch(() => {});
    return course;
  }
  async update(id, tenantId, dto, userId) {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        tenantId
      }
    });
    if (!course) {
      throw new _common.NotFoundException('Course not found');
    }
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        userId
      }
    });
    if (teacher && course.teacherId !== teacher.id) {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId
        }
      });
      if (user?.role !== _client.UserRole.ADMIN && user?.role !== _client.UserRole.SUPER_ADMIN) {
        throw new _common.ForbiddenException('You can only edit your own courses');
      }
    }
    const updated = await this.prisma.course.update({
      where: {
        id
      },
      data: {
        ...(dto.title && {
          title: dto.title
        }),
        ...(dto.description !== undefined && {
          description: dto.description
        }),
        ...(dto.category !== undefined && {
          category: dto.category
        }),
        ...(dto.tags && {
          tags: dto.tags
        }),
        ...(dto.level && {
          level: dto.level
        }),
        ...(dto.language && {
          language: dto.language
        }),
        ...(dto.price !== undefined && {
          price: new _library.Decimal(dto.price)
        }),
        ...(dto.thumbnailUrl !== undefined && {
          thumbnailUrl: dto.thumbnailUrl
        }),
        ...(dto.isFeatured !== undefined && {
          isFeatured: dto.isFeatured
        })
      }
    });
    await this.redis.del(`course:${id}`);
    if (updated.isPublished) {
      await this.searchService.indexCourse({
        ...updated,
        teacherName: ''
      });
    }
    return updated;
  }
  async publish(id, tenantId) {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        sections: {
          include: {
            lessons: true
          }
        }
      }
    });
    if (!course) {
      throw new _common.NotFoundException('Course not found');
    }
    if (course.isPublished) {
      return course;
    }
    const published = await this.prisma.course.update({
      where: {
        id
      },
      data: {
        isPublished: true
      }
    });
    await this.redis.del(`course:${id}`);
    await this.searchService.indexCourse({
      ...published,
      teacherName: ''
    });
    return published;
  }
  async unpublish(id, tenantId) {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        tenantId
      }
    });
    if (!course) {
      throw new _common.NotFoundException('Course not found');
    }
    const unpublished = await this.prisma.course.update({
      where: {
        id
      },
      data: {
        isPublished: false
      }
    });
    await this.redis.del(`course:${id}`);
    await this.searchService.deleteDocument('courses', id);
    return unpublished;
  }
  async delete(id, tenantId) {
    const course = await this.prisma.course.findFirst({
      where: {
        id,
        tenantId
      }
    });
    if (!course) {
      throw new _common.NotFoundException('Course not found');
    }
    await this.prisma.course.delete({
      where: {
        id
      }
    });
    await this.redis.del(`course:${id}`);
    await this.searchService.deleteDocument('courses', id);
  }
  async updateSection(sectionId, tenantId, dto) {
    const section = await this.prisma.courseSection.findFirst({
      where: {
        id: sectionId,
        course: {
          tenantId
        }
      }
    });
    if (!section) {
      throw new _common.NotFoundException('Section not found');
    }
    const updated = await this.prisma.courseSection.update({
      where: {
        id: sectionId
      },
      data: dto
    });
    await this.redis.del(`course:${section.courseId}`);
    return updated;
  }
  async deleteSection(sectionId, tenantId) {
    const section = await this.prisma.courseSection.findFirst({
      where: {
        id: sectionId,
        course: {
          tenantId
        }
      }
    });
    if (!section) {
      throw new _common.NotFoundException('Section not found');
    }
    await this.prisma.courseSection.delete({
      where: {
        id: sectionId
      }
    });
    // Recalculate lesson count
    const lessonCount = await this.prisma.lesson.count({
      where: {
        section: {
          courseId: section.courseId
        }
      }
    });
    await this.prisma.course.update({
      where: {
        id: section.courseId
      },
      data: {
        totalLessons: lessonCount
      }
    });
    await this.redis.del(`course:${section.courseId}`);
  }
  async updateLesson(lessonId, tenantId, dto) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        section: {
          course: {
            tenantId
          }
        }
      },
      include: {
        section: true
      }
    });
    if (!lesson) {
      throw new _common.NotFoundException('Lesson not found');
    }
    const updated = await this.prisma.lesson.update({
      where: {
        id: lessonId
      },
      data: dto
    });
    await this.redis.del(`course:${lesson.section.courseId}`);
    return updated;
  }
  async deleteLesson(lessonId, tenantId) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        section: {
          course: {
            tenantId
          }
        }
      },
      include: {
        section: true
      }
    });
    if (!lesson) {
      throw new _common.NotFoundException('Lesson not found');
    }
    await this.prisma.lesson.delete({
      where: {
        id: lessonId
      }
    });
    const lessonCount = await this.prisma.lesson.count({
      where: {
        section: {
          courseId: lesson.section.courseId
        }
      }
    });
    await this.prisma.course.update({
      where: {
        id: lesson.section.courseId
      },
      data: {
        totalLessons: lessonCount
      }
    });
    await this.redis.del(`course:${lesson.section.courseId}`);
  }
  async createSection(courseId, tenantId, dto) {
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        tenantId
      }
    });
    if (!course) {
      throw new _common.NotFoundException('Course not found');
    }
    const section = await this.prisma.courseSection.create({
      data: {
        courseId,
        title: dto.title,
        position: dto.position
      }
    });
    await this.redis.del(`course:${courseId}`);
    return section;
  }
  async createLesson(sectionId, tenantId, dto) {
    const section = await this.prisma.courseSection.findFirst({
      where: {
        id: sectionId,
        course: {
          tenantId
        }
      },
      include: {
        course: true
      }
    });
    if (!section) {
      throw new _common.NotFoundException('Section not found');
    }
    const lesson = await this.prisma.lesson.create({
      data: {
        sectionId,
        title: dto.title,
        description: dto.description,
        contentType: dto.contentType,
        contentUrl: dto.contentUrl,
        duration: dto.duration || 0,
        position: dto.position,
        isPreview: dto.isPreview || false
      }
    });
    // Update total lessons count
    const lessonCount = await this.prisma.lesson.count({
      where: {
        section: {
          courseId: section.courseId
        }
      }
    });
    await this.prisma.course.update({
      where: {
        id: section.courseId
      },
      data: {
        totalLessons: lessonCount
      }
    });
    await this.redis.del(`course:${section.courseId}`);
    return lesson;
  }
  async enrollStudent(courseId, studentId, tenantId) {
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        tenantId
      }
    });
    if (!course) {
      throw new _common.NotFoundException('Course not found');
    }
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student profile not found');
    }
    const existing = await this.prisma.courseProgress.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId
        }
      }
    });
    if (existing) {
      return existing;
    }
    const progress = await this.prisma.courseProgress.create({
      data: {
        studentId,
        courseId,
        completedLessons: []
      }
    });
    await this.prisma.course.update({
      where: {
        id: courseId
      },
      data: {
        enrollCount: {
          increment: 1
        }
      }
    });
    // Fire-and-forget enrollment email
    this.prisma.student.findUnique({
      where: {
        id: studentId
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    }).then(async s => {
      if (!s?.user?.email) {
        return;
      }
      const instructor = await this.prisma.teacher.findFirst({
        where: {
          courses: {
            some: {
              id: courseId
            }
          }
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });
      const instructorName = instructor?.user ? `${instructor.user.firstName} ${instructor.user.lastName}` : 'EduAI';
      const courseUrl = `${process.env['APP_URL'] ?? 'http://localhost:3000'}/courses/${courseId}`;
      await this.emailService.sendCourseEnrollment(s.user.email, {
        name: s.user.firstName,
        courseName: course.title,
        courseUrl,
        instructorName
      }).catch(() => null);
    }).catch(() => null);
    // Fire-and-forget webhook
    this.apiEcosystem.deliverWebhook(tenantId, 'course.enrolled', {
      courseId,
      studentId
    }).catch(() => {});
    return progress;
  }
  async updateProgress(courseId, studentId, lessonId, tenantId) {
    const progress = await this.prisma.courseProgress.findFirst({
      where: {
        courseId,
        student: {
          id: studentId
        }
      }
    });
    if (!progress) {
      throw new _common.NotFoundException('Enrollment not found');
    }
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        tenantId
      },
      select: {
        totalLessons: true
      }
    });
    if (!course) {
      throw new _common.NotFoundException('Course not found');
    }
    const completedLessons = Array.from(new Set([...progress.completedLessons, lessonId]));
    const progressPercent = course.totalLessons > 0 ? completedLessons.length / course.totalLessons * 100 : 0;
    const updated = await this.prisma.courseProgress.update({
      where: {
        id: progress.id
      },
      data: {
        completedLessons,
        progressPercent,
        lastAccessedAt: new Date(),
        completedAt: progressPercent >= 100 ? new Date() : null
      }
    });
    if (progressPercent >= 100) {
      // fire-and-forget: issue certificate if a template exists for this course
      this.issueCertificateIfTemplate(courseId, studentId).catch(() => {});
    }
    return updated;
  }
  async issueCertificateIfTemplate(courseId, studentId) {
    const template = await this.prisma.certificateTemplate.findFirst({
      where: {
        courseId
      }
    });
    if (!template) {
      return;
    }
    const alreadyIssued = await this.prisma.issuedCertificate.findFirst({
      where: {
        templateId: template.id,
        studentId
      }
    });
    if (alreadyIssued) {
      return;
    }
    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    const course = await this.prisma.course.findUnique({
      where: {
        id: courseId
      },
      select: {
        title: true
      }
    });
    if (!student || !course) {
      return;
    }
    await this.prisma.issuedCertificate.create({
      data: {
        templateId: template.id,
        studentId,
        issuedAt: new Date(),
        verifyCode: Math.random().toString(36).substring(2, 12).toUpperCase(),
        metadata: {
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          courseName: course.title,
          issuedDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        }
      }
    });
  }
  async addReview(courseId, userId, rating, comment) {
    const existing = await this.prisma.review.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId
        }
      }
    });
    if (existing) {
      throw new _common.ConflictException('You have already reviewed this course');
    }
    if (rating < 1 || rating > 5) {
      throw new _common.BadRequestException('Rating must be between 1 and 5');
    }
    const review = await this.prisma.review.create({
      data: {
        courseId,
        userId,
        rating,
        comment
      }
    });
    // Update course average rating
    const avgResult = await this.prisma.review.aggregate({
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
        rating: avgResult._avg.rating || 0
      }
    });
    await this.redis.del(`course:${courseId}`);
    return review;
  }
};
exports.CoursesService = CoursesService = CoursesService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_redis.RedisService)), __param(2, (0, _common.Inject)(_search.SearchService)), __param(3, (0, _common.Inject)(_apiEcosystem.ApiEcosystemService)), __param(4, (0, _common.Inject)(_email.EmailService)), __metadata("design:paramtypes", [Object, Object, Object, Object, Object])], CoursesService);