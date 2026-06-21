"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PerformancePredictionService = void 0;
var _common = require("@nestjs/common");
var _prisma = require("../database/prisma.service");
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
var PerformancePredictionService_1;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

let PerformancePredictionService = exports.PerformancePredictionService = PerformancePredictionService_1 = class PerformancePredictionService {
  logger = new _common.Logger(PerformancePredictionService_1.name);
  constructor(prisma) {
    this.prisma = prisma;
  }
  async predictPerformance(studentId, tenantId) {
    // Fetch student data
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId
      },
      include: {
        attendance: {
          orderBy: {
            date: 'desc'
          },
          take: 60
        },
        submissions: {
          orderBy: {
            submittedAt: 'desc'
          },
          take: 30
        },
        courseProgress: true
      }
    });
    if (!student) {
      this.logger.warn(`Student ${studentId} not found`);
      return this.buildFallbackPrediction(studentId);
    }
    // Attendance rate
    const attendanceRecords = student.attendance;
    const presentCount = attendanceRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendanceRate = attendanceRecords.length > 0 ? presentCount / attendanceRecords.length : 0.7; // default if no data
    // Submission rate (non-late / total)
    const submissions = student.submissions;
    const onTimeSubmissions = submissions.filter(s => s.status !== 'LATE' && s.status !== 'MISSING').length;
    const submissionRate = submissions.length > 0 ? onTimeSubmissions / submissions.length : 0.7;
    // Average quiz/assignment score (normalized to 0-1)
    const scoredSubmissions = submissions.filter(s => s.score != null);
    const avgScore = scoredSubmissions.length > 0 ? scoredSubmissions.reduce((sum, s) => sum + s.score, 0) / scoredSubmissions.length / 100 : 0.5;
    // Streak from UserPoints (via user relation)
    let streak = 0;
    try {
      const userPoints = await this.prisma.userPoints.findFirst({
        where: {
          userId: student.userId
        },
        select: {
          streak: true
        }
      });
      streak = userPoints?.streak ?? 0;
    } catch {
      streak = 0;
    }
    const streakScore = streak > 7 ? 0.10 : streak / 70;
    // Course progress rate (average across all enrolled courses)
    const progressRecords = student.courseProgress;
    const progressRate = progressRecords.length > 0 ? progressRecords.reduce((sum, p) => sum + p.progressPercent / 100, 0) / progressRecords.length : 0.5;
    // Composite score
    const score = attendanceRate * 0.25 + submissionRate * 0.25 + avgScore * 0.30 + streakScore + progressRate * 0.10;
    // Clamp to 0-1
    const clampedScore = Math.min(1, Math.max(0, score));
    // Map score to grade
    let predictedGrade;
    if (clampedScore > 0.8) {
      predictedGrade = 'A';
    } else if (clampedScore > 0.65) {
      predictedGrade = 'B';
    } else if (clampedScore > 0.5) {
      predictedGrade = 'C';
    } else if (clampedScore > 0.35) {
      predictedGrade = 'D';
    } else {
      predictedGrade = 'F';
    }
    const dropoutRisk = Math.min(1, Math.max(0, 1 - clampedScore));
    let riskLevel;
    if (dropoutRisk > 0.6) {
      riskLevel = 'high';
    } else if (dropoutRisk > 0.3) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }
    // Build factors
    const factors = [{
      name: 'Attendance Rate',
      impact: attendanceRate >= 0.7 ? 'positive' : 'negative',
      weight: attendanceRate * 0.25
    }, {
      name: 'Submission Rate',
      impact: submissionRate >= 0.7 ? 'positive' : 'negative',
      weight: submissionRate * 0.25
    }, {
      name: 'Average Score',
      impact: avgScore >= 0.5 ? 'positive' : 'negative',
      weight: avgScore * 0.30
    }, {
      name: 'Learning Streak',
      impact: streak >= 7 ? 'positive' : 'negative',
      weight: streakScore
    }, {
      name: 'Course Progress',
      impact: progressRate >= 0.5 ? 'positive' : 'negative',
      weight: progressRate * 0.10
    }];
    // Recommendations based on weakest factor
    const recommendations = [];
    const weakestFactor = [...factors].sort((a, b) => a.weight - b.weight)[0];
    if (weakestFactor?.name === 'Attendance Rate' || attendanceRate < 0.7) {
      recommendations.push('Improve class attendance to boost performance significantly.');
    }
    if (weakestFactor?.name === 'Submission Rate' || submissionRate < 0.7) {
      recommendations.push('Submit assignments on time to maintain a good submission rate.');
    }
    if (weakestFactor?.name === 'Average Score' || avgScore < 0.5) {
      recommendations.push('Seek tutoring or additional resources to improve quiz and assignment scores.');
    }
    if (streak < 7) {
      recommendations.push('Build a daily learning habit — aim for a 7-day streak.');
    }
    if (progressRate < 0.5) {
      recommendations.push('Accelerate course completion to stay on track with the curriculum.');
    }
    if (riskLevel === 'high') {
      recommendations.push('Immediate advisor consultation is strongly recommended.');
    }
    // Confidence is based on data availability
    const dataPoints = [attendanceRecords.length > 0, submissions.length > 0, scoredSubmissions.length > 0, streak > 0, progressRecords.length > 0].filter(Boolean).length;
    const confidence = dataPoints / 5;
    return {
      studentId,
      predictedGrade,
      confidence,
      riskLevel,
      dropoutRisk,
      recommendations,
      factors
    };
  }
  async findStudentIdByUserId(userId) {
    const student = await this.prisma.student.findFirst({
      where: {
        userId
      },
      select: {
        id: true
      }
    });
    return student?.id ?? null;
  }
  async batchPredictCohort(tenantId, courseId) {
    let studentIds;
    if (courseId) {
      const progresses = await this.prisma.courseProgress.findMany({
        where: {
          courseId
        },
        select: {
          studentId: true
        }
      });
      studentIds = progresses.map(p => p.studentId);
    } else {
      // All students in tenant via their user relation
      const students = await this.prisma.student.findMany({
        where: {
          user: {
            tenantId
          }
        },
        select: {
          id: true
        }
      });
      studentIds = students.map(s => s.id);
    }
    const predictions = await Promise.all(studentIds.map(id => this.predictPerformance(id, tenantId).catch(err => {
      this.logger.error(`Failed prediction for student ${id}`, err);
      return this.buildFallbackPrediction(id);
    })));
    return predictions;
  }
  buildFallbackPrediction(studentId) {
    return {
      studentId,
      predictedGrade: 'C',
      confidence: 0,
      riskLevel: 'medium',
      dropoutRisk: 0.5,
      recommendations: ['Insufficient data to generate a detailed prediction. Encourage the student to engage more.'],
      factors: []
    };
  }
};
exports.PerformancePredictionService = PerformancePredictionService = PerformancePredictionService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], PerformancePredictionService);