"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SubmitGradeDto = exports.GradeBookService = void 0;
var _common = require("@nestjs/common");
var _prisma = require("../database/prisma.service");
var _redis = require("../cache/redis.service");
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
class SubmitGradeDto {
  studentId;
  classId;
  subject;
  term;
  score;
  maxScore;
  remarks;
}
exports.SubmitGradeDto = SubmitGradeDto;
function letterGrade(percentage) {
  if (percentage >= 90) {
    return 'A+';
  }
  if (percentage >= 80) {
    return 'A';
  }
  if (percentage >= 70) {
    return 'B';
  }
  if (percentage >= 60) {
    return 'C';
  }
  if (percentage >= 50) {
    return 'D';
  }
  return 'F';
}
function getRemarks(average) {
  if (average >= 90) {
    return 'Excellent';
  }
  if (average >= 80) {
    return 'Very Good';
  }
  if (average >= 70) {
    return 'Good';
  }
  if (average >= 60) {
    return 'Average';
  }
  if (average >= 50) {
    return 'Below Average';
  }
  return 'Needs Improvement';
}
function median(values) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
/**
 * Grades are stored in ExamAttempt with a special "GRADEBOOK" exam per
 * (classId, subject, term) keyed in the exam's topic field as JSON metadata.
 * The exam title is "GRADEBOOK:{classId}:{subject}:{term}".
 * Each student's score/maxScore is stored in ExamAttempt.score / ExamAttempt.maxScore.
 */
const EXAM_TITLE_PREFIX = 'GRADEBOOK';
function gradeExamTitle(classId, subject, term) {
  return `${EXAM_TITLE_PREFIX}:${classId}:${subject}:${term}`;
}
let GradeBookService = exports.GradeBookService = class GradeBookService {
  constructor(prisma, cache) {
    this.prisma = prisma;
    this.cache = cache;
  }
  async getOrCreateGradeExam(classId, subject, term, tenantId, createdBy) {
    const title = gradeExamTitle(classId, subject, term);
    let exam = await this.prisma.exam.findFirst({
      where: {
        tenantId,
        title,
        subject
      }
    });
    if (!exam) {
      exam = await this.prisma.exam.create({
        data: {
          tenantId,
          createdBy,
          title,
          subject,
          topic: JSON.stringify({
            classId,
            term,
            isGradebook: true
          }),
          isPublished: false
        }
      });
    }
    return exam;
  }
  /** Get all students in a class with their grades */
  async getClassGrades(classId, subject, term) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: {
        id: classId
      },
      include: {
        school: {
          select: {
            tenantId: true
          }
        }
      }
    });
    if (!schoolClass) {
      throw new _common.NotFoundException('Class not found');
    }
    const tenantId = schoolClass.school.tenantId;
    // Find all gradebook exams for this class
    const titleFilter = subject && term ? gradeExamTitle(classId, subject, term) : {
      startsWith: `${EXAM_TITLE_PREFIX}:${classId}:`
    };
    const exams = await this.prisma.exam.findMany({
      where: {
        tenantId,
        title: typeof titleFilter === 'string' ? titleFilter : titleFilter
      },
      include: {
        attempts: {
          include: {
            user: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });
    // Get students
    const students = await this.prisma.student.findMany({
      where: {
        classId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    return students.map(student => {
      const grades = exams.filter(exam => {
        const meta = exam.topic ? JSON.parse(exam.topic) : {};
        return meta.classId === classId;
      }).map(exam => {
        // Title format: GRADEBOOK:{classId}:{subject}:{term}
        const parts = exam.title.split(':');
        const examSubject = parts[2] ?? exam.subject;
        const examTerm = parts.slice(3).join(':') ?? '';
        const attempt = exam.attempts.find(a => a.user.id === student.userId);
        if (!attempt || attempt.score === null || attempt.maxScore === null) {
          return null;
        }
        const pct = Math.round(attempt.score / attempt.maxScore * 100);
        return {
          subject: examSubject,
          term: examTerm,
          score: attempt.score,
          maxScore: attempt.maxScore,
          percentage: pct,
          letter: letterGrade(pct)
        };
      }).filter(g => g !== null);
      const avg = grades.length > 0 ? Math.round(grades.reduce((s, g) => s + g.percentage, 0) / grades.length) : null;
      return {
        studentId: student.id,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        studentCode: student.studentId ?? null,
        grades,
        average: avg
      };
    });
  }
  /** Submit or update a grade for a student */
  async submitGrade(dto, tenantId, submittedById) {
    const student = await this.prisma.student.findUnique({
      where: {
        id: dto.studentId
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student not found');
    }
    const exam = await this.getOrCreateGradeExam(dto.classId, dto.subject, dto.term, tenantId, submittedById);
    await this.prisma.examAttempt.upsert({
      where: {
        // There's no unique constraint on (examId, userId) but we'll check manually
        id: (await this.prisma.examAttempt.findFirst({
          where: {
            examId: exam.id,
            userId: student.userId
          }
        }))?.id ?? 'create-new'
      },
      update: {
        score: dto.score,
        maxScore: dto.maxScore,
        submittedAt: new Date(),
        answers: {
          remarks: dto.remarks ?? ''
        }
      },
      create: {
        examId: exam.id,
        userId: student.userId,
        score: dto.score,
        maxScore: dto.maxScore,
        answers: {
          remarks: dto.remarks ?? ''
        },
        submittedAt: new Date()
      }
    });
    await this.cache.del(`gradebook:class:${dto.classId}`);
  }
  /** Bulk import grades from array */
  async bulkImportGrades(classId, grades, tenantId, submittedById) {
    const errors = [];
    let imported = 0;
    for (const g of grades) {
      try {
        await this.submitGrade({
          studentId: g.studentId,
          classId,
          subject: g.subject,
          term: g.term,
          score: g.score,
          maxScore: g.maxScore
        }, tenantId, submittedById);
        imported++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Student ${g.studentId}: ${message}`);
      }
    }
    return {
      imported,
      errors
    };
  }
  /** Calculate class statistics */
  async getClassStats(classId, subject) {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: {
        id: classId
      },
      include: {
        school: {
          select: {
            tenantId: true
          }
        }
      }
    });
    if (!schoolClass) {
      throw new _common.NotFoundException('Class not found');
    }
    const tenantId = schoolClass.school.tenantId;
    const titlePrefix = subject ? gradeExamTitle(classId, subject, '') : `${EXAM_TITLE_PREFIX}:${classId}:`;
    const exams = await this.prisma.exam.findMany({
      where: {
        tenantId,
        title: {
          startsWith: subject ? `${EXAM_TITLE_PREFIX}:${classId}:${subject}:` : `${EXAM_TITLE_PREFIX}:${classId}:`
        }
      },
      include: {
        attempts: true
      }
    });
    const percentages = [];
    for (const exam of exams) {
      for (const attempt of exam.attempts) {
        if (attempt.score !== null && attempt.maxScore !== null && attempt.maxScore > 0) {
          percentages.push(attempt.score / attempt.maxScore * 100);
        }
      }
    }
    const count = percentages.length;
    const mean = count > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / count) : 0;
    const medianVal = Math.round(median(percentages));
    const passRate = count > 0 ? Math.round(percentages.filter(p => p >= 50).length / count * 100) : 0;
    const ranges = ['0-49', '50-59', '60-69', '70-79', '80-89', '90-100'];
    const distribution = ranges.map(range => {
      const [min, max] = range.split('-').map(Number);
      return {
        range,
        count: percentages.filter(p => p >= min && p <= max).length
      };
    });
    void titlePrefix; // suppress unused warning
    return {
      classId,
      subject: subject ?? null,
      count,
      mean,
      median: medianVal,
      passRate,
      distribution
    };
  }
  /** Generate report card data for a student */
  async getReportCard(studentId, term) {
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
        },
        class: {
          select: {
            id: true
          }
        }
      }
    });
    if (!student) {
      throw new _common.NotFoundException('Student not found');
    }
    if (!student.class) {
      throw new _common.NotFoundException('Student is not assigned to a class');
    }
    const classId = student.class.id;
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: {
        id: classId
      },
      include: {
        school: {
          select: {
            tenantId: true
          }
        }
      }
    });
    const tenantId = schoolClass?.school.tenantId ?? '';
    // Find all gradebook exams for this class+term
    const exams = await this.prisma.exam.findMany({
      where: {
        tenantId,
        title: {
          startsWith: `${EXAM_TITLE_PREFIX}:${classId}:`
        },
        topic: {
          contains: term
        }
      },
      include: {
        attempts: {
          where: {
            userId: student.userId
          }
        }
      }
    });
    const subjects = exams.map(exam => {
      const parts = exam.title.split(':');
      const subject = parts[2] ?? exam.subject;
      const attempt = exam.attempts[0];
      if (!attempt || attempt.score === null || attempt.maxScore === null) {
        return null;
      }
      const pct = Math.round(attempt.score / attempt.maxScore * 100);
      return {
        subject,
        score: attempt.score,
        maxScore: attempt.maxScore,
        percentage: pct,
        letter: letterGrade(pct)
      };
    }).filter(s => s !== null);
    const average = subjects.length > 0 ? Math.round(subjects.reduce((s, sub) => s + sub.percentage, 0) / subjects.length) : 0;
    // Calculate rank among classmates
    const classGrades = await this.getClassGrades(classId, undefined, term);
    const sortedByAvg = classGrades.filter(r => r.average !== null).sort((a, b) => (b.average ?? 0) - (a.average ?? 0));
    const rank = sortedByAvg.findIndex(r => r.studentId === studentId) + 1;
    return {
      studentId,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      term,
      subjects,
      average,
      rank: rank > 0 ? rank : undefined,
      totalStudents: sortedByAvg.length,
      remarks: getRemarks(average)
    };
  }
};
exports.GradeBookService = GradeBookService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_redis.RedisService)), __metadata("design:paramtypes", [Object, Object])], GradeBookService);