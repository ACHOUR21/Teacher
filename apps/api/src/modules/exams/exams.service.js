"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ExamsService = void 0;
var _common = require("@nestjs/common");
var _certificates = require("../certificates/certificates.service");
var _prisma = require("../database/prisma.service");
var _search = require("../search/search.service");
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
let ExamsService = exports.ExamsService = class ExamsService {
  constructor(prisma, certificates, search) {
    this.prisma = prisma;
    this.certificates = certificates;
    this.search = search;
  }
  async saveExam(tenantId, userId, dto) {
    const exam = await this.prisma.exam.create({
      data: {
        tenantId,
        createdBy: userId,
        title: dto.title,
        subject: dto.subject,
        topic: dto.topic,
        difficulty: dto.difficulty ?? 'medium',
        timeLimit: dto.timeLimit,
        questions: {
          create: dto.questions.map((q, i) => ({
            order: i + 1,
            type: q.type,
            question: q.question,
            options: q.options ?? undefined,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            points: q.points ?? 1
          }))
        }
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc'
          }
        }
      }
    });
    void this.search.indexExam({
      id: exam.id,
      title: exam.title,
      subject: exam.subject,
      topic: exam.topic,
      difficulty: exam.difficulty,
      tenantId
    });
    return exam;
  }
  async listExams(tenantId, options = {}) {
    return this.prisma.exam.findMany({
      where: {
        tenantId,
        ...(options.published !== undefined ? {
          isPublished: options.published
        } : {}),
        ...(options.createdBy ? {
          createdBy: options.createdBy
        } : {})
      },
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        },
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
  async getExam(examId, includeAnswers = false) {
    const exam = await this.prisma.exam.findUnique({
      where: {
        id: examId
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc'
          },
          select: {
            id: true,
            order: true,
            type: true,
            question: true,
            options: true,
            points: true,
            // Only include answers if teacher is viewing
            ...(includeAnswers ? {
              correctAnswer: true,
              explanation: true
            } : {})
          }
        },
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    if (!exam) {
      throw new _common.NotFoundException('Exam not found');
    }
    return exam;
  }
  async publishExam(examId, userId) {
    const exam = await this.prisma.exam.findUnique({
      where: {
        id: examId
      }
    });
    if (!exam) {
      throw new _common.NotFoundException('Exam not found');
    }
    if (exam.createdBy !== userId) {
      throw new _common.ForbiddenException('Only the creator can publish this exam');
    }
    const updated = await this.prisma.exam.update({
      where: {
        id: examId
      },
      data: {
        isPublished: true
      }
    });
    void this.search.indexExam({
      id: updated.id,
      title: updated.title,
      subject: updated.subject,
      topic: updated.topic,
      difficulty: updated.difficulty,
      tenantId: updated.tenantId,
      isPublished: true
    });
    return updated;
  }
  async deleteExam(examId, userId) {
    const exam = await this.prisma.exam.findUnique({
      where: {
        id: examId
      }
    });
    if (!exam) {
      throw new _common.NotFoundException('Exam not found');
    }
    if (exam.createdBy !== userId) {
      throw new _common.ForbiddenException('Only the creator can delete this exam');
    }
    await this.prisma.exam.delete({
      where: {
        id: examId
      }
    });
    void this.search.deleteDocument('exams', examId);
  }
  // ------------------------------------------------------------------ attempts
  async startAttempt(examId, userId) {
    const exam = await this.prisma.exam.findUnique({
      where: {
        id: examId
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc'
          },
          select: {
            id: true,
            order: true,
            type: true,
            question: true,
            options: true,
            points: true
          }
        }
      }
    });
    if (!exam) {
      throw new _common.NotFoundException('Exam not found');
    }
    if (!exam.isPublished) {
      throw new _common.ForbiddenException('This exam is not published yet');
    }
    // Check for in-progress attempt
    const existing = await this.prisma.examAttempt.findFirst({
      where: {
        examId,
        userId,
        submittedAt: null
      }
    });
    if (existing) {
      return {
        attempt: existing,
        questions: exam.questions
      };
    }
    const attempt = await this.prisma.examAttempt.create({
      data: {
        examId,
        userId,
        answers: {}
      }
    });
    return {
      attempt,
      questions: exam.questions
    };
  }
  async submitAttempt(attemptId, userId, answers) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: {
        id: attemptId
      },
      include: {
        exam: {
          include: {
            questions: true
          }
        }
      }
    });
    if (!attempt) {
      throw new _common.NotFoundException('Attempt not found');
    }
    if (attempt.userId !== userId) {
      throw new _common.ForbiddenException('Not your attempt');
    }
    if (attempt.submittedAt) {
      throw new _common.BadRequestException('Attempt already submitted');
    }
    // Auto-score objective questions
    let score = 0;
    const maxScore = attempt.exam.questions.reduce((s, q) => s + q.points, 0);
    for (const question of attempt.exam.questions) {
      const given = (answers[question.id] ?? '').trim().toLowerCase();
      const correct = question.correctAnswer.trim().toLowerCase();
      if ((question.type === 'multiple_choice' || question.type === 'true_false') && given === correct) {
        score += question.points;
      }
    }
    const result = await this.prisma.examAttempt.update({
      where: {
        id: attemptId
      },
      data: {
        answers,
        score,
        maxScore,
        submittedAt: new Date()
      }
    });
    // Auto-issue certificate if score >= 70% and a template exists for this exam's subject
    if (maxScore > 0 && score / maxScore >= 0.7) {
      const template = await this.prisma.certificateTemplate.findFirst({
        where: {
          course: {
            title: attempt.exam.subject
          }
        }
      });
      if (template) {
        this.certificates.issueToUser(userId, template.id, {
          source: 'exam',
          examId: attempt.examId,
          score,
          maxScore
        }).catch(() => {});
      }
    }
    return result;
  }
  async getAttemptResult(attemptId, userId) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: {
        id: attemptId
      },
      include: {
        exam: {
          include: {
            questions: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });
    if (!attempt) {
      throw new _common.NotFoundException('Attempt not found');
    }
    if (attempt.userId !== userId) {
      throw new _common.ForbiddenException('Not your attempt');
    }
    return attempt;
  }
  async listAttempts(examId) {
    return this.prisma.examAttempt.findMany({
      where: {
        examId,
        submittedAt: {
          not: null
        }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });
  }
};
exports.ExamsService = ExamsService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_certificates.CertificatesService)), __param(2, (0, _common.Inject)(_search.SearchService)), __metadata("design:paramtypes", [Object, Object, Object])], ExamsService);