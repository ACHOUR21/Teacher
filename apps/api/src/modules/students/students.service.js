"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StudentsService = void 0;
var _common = require("@nestjs/common");
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
let StudentsService = exports.StudentsService = class StudentsService {
  constructor(prisma, notifications) {
    this.prisma = prisma;
    this.notifications = notifications;
  }
  async findAll(tenantId, query) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const userWhere = {
      tenantId,
      isActive: true
    };
    if (query.search) {
      userWhere.OR = [{
        firstName: {
          contains: query.search,
          mode: 'insensitive'
        }
      }, {
        lastName: {
          contains: query.search,
          mode: 'insensitive'
        }
      }, {
        email: {
          contains: query.search,
          mode: 'insensitive'
        }
      }];
    }
    const where = {
      user: userWhere
    };
    if (query.schoolId) {
      where.schoolId = query.schoolId;
    }
    if (query.classId) {
      where.classId = query.classId;
    }
    if (query.grade) {
      where.grade = query.grade;
    }
    const [students, total] = await Promise.all([this.prisma.student.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
            isActive: true
          }
        },
        school: {
          select: {
            name: true
          }
        },
        class: {
          select: {
            name: true,
            grade: true
          }
        },
        _count: {
          select: {
            courseProgress: true,
            certificates: true
          }
        }
      },
      orderBy: {
        user: {
          firstName: 'asc'
        }
      }
    }), this.prisma.student.count({
      where
    })]);
    return {
      data: students,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
  async findOne(id) {
    const student = await this.prisma.student.findUnique({
      where: {
        id
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            phone: true
          }
        },
        school: {
          select: {
            name: true
          }
        },
        class: {
          select: {
            name: true,
            grade: true
          }
        },
        courseProgress: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                totalLessons: true
              }
            }
          },
          orderBy: {
            lastAccessedAt: 'desc'
          },
          take: 10
        },
        certificates: {
          include: {
            template: {
              include: {
                course: {
                  select: {
                    title: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            courseProgress: true,
            certificates: true,
            submissions: true
          }
        }
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student not found');
    }
    return student;
  }
  async getLearningProgress(id) {
    const progress = await this.prisma.courseProgress.findMany({
      where: {
        studentId: id
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            totalLessons: true,
            thumbnailUrl: true
          }
        }
      },
      orderBy: {
        lastAccessedAt: 'desc'
      }
    });
    return progress;
  }
  async getSubmissions(studentId) {
    return this.prisma.submission.findMany({
      where: {
        studentId
      },
      include: {
        assignment: {
          select: {
            title: true,
            maxScore: true,
            dueDate: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      take: 20
    });
  }
  async getPerformanceSummary(id) {
    const [totalCourses, completedCourses, pendingAssignments, gradedAssignments, points] = await Promise.all([this.prisma.courseProgress.count({
      where: {
        studentId: id
      }
    }), this.prisma.courseProgress.count({
      where: {
        studentId: id,
        completedAt: {
          not: null
        }
      }
    }), this.prisma.submission.count({
      where: {
        studentId: id,
        status: 'PENDING'
      }
    }), this.prisma.submission.count({
      where: {
        studentId: id,
        status: 'GRADED'
      }
    }), this.prisma.userPoints.findUnique({
      where: {
        userId: id
      },
      select: {
        total: true,
        level: true
      }
    })]);
    const avgScore = await this.prisma.submission.aggregate({
      where: {
        studentId: id,
        status: 'GRADED',
        score: {
          not: null
        }
      },
      _avg: {
        score: true
      }
    });
    return {
      totalCourses,
      completedCourses,
      completionRate: totalCourses > 0 ? Math.round(completedCourses / totalCourses * 100) : 0,
      pendingAssignments,
      gradedAssignments,
      avgScore: avgScore._avg.score ?? 0,
      points: points?.total ?? 0,
      level: points?.level ?? 1
    };
  }
  async getReportCard(studentId) {
    // Step 1: fetch student first so we have userId for subsequent queries
    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true
          }
        },
        school: {
          select: {
            name: true
          }
        },
        class: {
          select: {
            name: true,
            grade: true
          }
        }
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student not found');
    }
    const userId = student.userId;
    // Step 2: fetch all related data in parallel
    const [submissions, quizAttempts, certificates, points, courseProgress, attendance] = await Promise.all([this.prisma.submission.findMany({
      where: {
        studentId,
        status: 'GRADED'
      },
      include: {
        assignment: {
          select: {
            title: true,
            maxScore: true,
            dueDate: true
          }
        }
      },
      orderBy: {
        gradedAt: 'desc'
      }
    }), this.prisma.quizAttempt.findMany({
      where: {
        userId
      },
      include: {
        quiz: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }), this.prisma.issuedCertificate.findMany({
      where: {
        studentId
      },
      include: {
        template: {
          select: {
            name: true,
            course: {
              select: {
                title: true
              }
            }
          }
        }
      }
    }), this.prisma.userPoints.findUnique({
      where: {
        userId
      }
    }), this.prisma.courseProgress.findMany({
      where: {
        studentId
      },
      include: {
        course: {
          select: {
            title: true,
            category: true
          }
        }
      }
    }), this.prisma.attendance.findMany({
      where: {
        studentId
      },
      orderBy: {
        date: 'desc'
      },
      take: 90
    })]);
    const totalGraded = submissions.length;
    const avgScore = totalGraded > 0 ? Math.round(submissions.reduce((sum, s) => sum + s.score / s.assignment.maxScore * 100, 0) / totalGraded) : null;
    const attendanceTotal = attendance.length;
    const attendancePresent = attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendanceRate = attendanceTotal > 0 ? Math.round(attendancePresent / attendanceTotal * 100) : null;
    const completedCourses = courseProgress.filter(p => p.completedAt).length;
    const inProgressCourses = courseProgress.filter(p => !p.completedAt).length;
    return {
      student: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        avatarUrl: student.user.avatarUrl,
        grade: student.grade ?? student.class?.grade,
        class: student.class?.name,
        school: student.school?.name,
        gpa: student.gpa
      },
      summary: {
        avgScore,
        attendanceRate,
        completedCourses,
        inProgressCourses,
        certificatesEarned: certificates.length,
        totalPoints: points?.total ?? 0,
        quizzesTaken: quizAttempts.length,
        quizPassRate: quizAttempts.length > 0 ? Math.round(quizAttempts.filter(a => a.passed).length / quizAttempts.length * 100) : null
      },
      assignments: submissions.map(s => ({
        title: s.assignment.title,
        score: s.score,
        maxScore: s.assignment.maxScore,
        percentage: Math.round(s.score / s.assignment.maxScore * 100),
        gradedAt: s.gradedAt,
        feedback: s.feedback
      })),
      courses: courseProgress.map(p => ({
        title: p.course.title,
        category: p.course.category,
        progress: p.progressPercent,
        completed: !!p.completedAt,
        completedAt: p.completedAt
      })),
      certificates: certificates.map(c => ({
        name: c.template?.name,
        course: c.template?.course?.title,
        issuedAt: c.issuedAt,
        verifyCode: c.verifyCode
      })),
      quizAttempts: quizAttempts.slice(0, 20).map(a => ({
        quiz: a.quiz.title,
        score: Math.round(a.score),
        passed: a.passed,
        date: a.createdAt
      })),
      attendance: {
        rate: attendanceRate,
        present: attendance.filter(a => a.status === 'PRESENT').length,
        absent: attendance.filter(a => a.status === 'ABSENT').length,
        late: attendance.filter(a => a.status === 'LATE').length,
        excused: attendance.filter(a => a.status === 'EXCUSED').length,
        total: attendanceTotal
      }
    };
  }
  async inviteStudent(tenantId, dto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: {
        id: tenantId
      },
      select: {
        name: true,
        slug: true
      }
    });
    const inviteLink = `${process.env['APP_URL'] ?? 'http://localhost:3000'}/join/${tenant?.slug ?? ''}`;
    await this.notifications.sendEmail(dto.email, `You're invited to join ${tenant?.name ?? 'EduAI'}`, `<p>Hi ${dto.firstName ?? 'there'},</p>
       <p>You've been invited to join <strong>${tenant?.name ?? 'EduAI'}</strong> as a student.</p>
       <a href="${inviteLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Accept Invitation →</a>`);
    return {
      message: 'Invitation sent',
      email: dto.email,
      inviteLink
    };
  }
};
exports.StudentsService = StudentsService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_notifications.NotificationsService)), __metadata("design:paramtypes", [Object, Object])], StudentsService);