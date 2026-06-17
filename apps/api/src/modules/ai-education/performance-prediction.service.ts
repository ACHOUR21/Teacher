/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

export interface PerformancePrediction {
  studentId: string;
  predictedGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  confidence: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high';
  dropoutRisk: number; // 0-1
  recommendations: string[];
  factors: { name: string; impact: 'positive' | 'negative'; weight: number }[];
}

@Injectable()
export class PerformancePredictionService {
  private readonly logger = new Logger(PerformancePredictionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async predictPerformance(studentId: string, tenantId: string): Promise<PerformancePrediction> {
    // Fetch student data
    const student = await this.prisma.student.findFirst({
      where: { id: studentId },
      include: {
        attendance: { orderBy: { date: 'desc' }, take: 60 },
        submissions: { orderBy: { submittedAt: 'desc' }, take: 30 },
        courseProgress: true,
      },
    });

    if (!student) {
      this.logger.warn(`Student ${studentId} not found`);
      return this.buildFallbackPrediction(studentId);
    }

    // Attendance rate
    const attendanceRecords = student.attendance as any[];
    const presentCount = attendanceRecords.filter(
      (a: any) => a.status === 'PRESENT' || a.status === 'LATE',
    ).length;
    const attendanceRate = attendanceRecords.length > 0
      ? presentCount / attendanceRecords.length
      : 0.7; // default if no data

    // Submission rate (non-late / total)
    const submissions = student.submissions as any[];
    const onTimeSubmissions = submissions.filter(
      (s: any) => s.status !== 'LATE' && s.status !== 'MISSING',
    ).length;
    const submissionRate = submissions.length > 0
      ? onTimeSubmissions / submissions.length
      : 0.7;

    // Average quiz/assignment score (normalized to 0-1)
    const scoredSubmissions = submissions.filter((s: any) => s.score != null);
    const avgScore = scoredSubmissions.length > 0
      ? scoredSubmissions.reduce((sum: number, s: any) => sum + (s.score as number), 0) /
        scoredSubmissions.length / 100
      : 0.5;

    // Streak from UserPoints (via user relation)
    let streak = 0;
    try {
      const userPoints = await this.prisma.userPoints.findFirst({
        where: { userId: student.userId },
        select: { streak: true },
      });
      streak = userPoints?.streak ?? 0;
    } catch {
      streak = 0;
    }
    const streakScore = streak > 7 ? 0.10 : streak / 70;

    // Course progress rate (average across all enrolled courses)
    const progressRecords = student.courseProgress as any[];
    const progressRate = progressRecords.length > 0
      ? progressRecords.reduce((sum: number, p: any) => sum + (p.progressPercent as number) / 100, 0) /
        progressRecords.length
      : 0.5;

    // Composite score
    const score =
      attendanceRate * 0.25 +
      submissionRate * 0.25 +
      avgScore * 0.30 +
      streakScore +
      progressRate * 0.10;

    // Clamp to 0-1
    const clampedScore = Math.min(1, Math.max(0, score));

    // Map score to grade
    let predictedGrade: 'A' | 'B' | 'C' | 'D' | 'F';
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
    let riskLevel: 'low' | 'medium' | 'high';
    if (dropoutRisk > 0.6) {
      riskLevel = 'high';
    } else if (dropoutRisk > 0.3) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // Build factors
    const factors: { name: string; impact: 'positive' | 'negative'; weight: number }[] = [
      {
        name: 'Attendance Rate',
        impact: attendanceRate >= 0.7 ? 'positive' : 'negative',
        weight: attendanceRate * 0.25,
      },
      {
        name: 'Submission Rate',
        impact: submissionRate >= 0.7 ? 'positive' : 'negative',
        weight: submissionRate * 0.25,
      },
      {
        name: 'Average Score',
        impact: avgScore >= 0.5 ? 'positive' : 'negative',
        weight: avgScore * 0.30,
      },
      {
        name: 'Learning Streak',
        impact: streak >= 7 ? 'positive' : 'negative',
        weight: streakScore,
      },
      {
        name: 'Course Progress',
        impact: progressRate >= 0.5 ? 'positive' : 'negative',
        weight: progressRate * 0.10,
      },
    ];

    // Recommendations based on weakest factor
    const recommendations: string[] = [];
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
    const dataPoints = [
      attendanceRecords.length > 0,
      submissions.length > 0,
      scoredSubmissions.length > 0,
      streak > 0,
      progressRecords.length > 0,
    ].filter(Boolean).length;
    const confidence = dataPoints / 5;

    return {
      studentId,
      predictedGrade,
      confidence,
      riskLevel,
      dropoutRisk,
      recommendations,
      factors,
    };
  }

  async findStudentIdByUserId(userId: string): Promise<string | null> {
    const student = await this.prisma.student.findFirst({
      where: { userId },
      select: { id: true },
    });
    return student?.id ?? null;
  }

  async batchPredictCohort(
    tenantId: string,
    courseId?: string,
  ): Promise<PerformancePrediction[]> {
    let studentIds: string[];

    if (courseId) {
      const progresses = await this.prisma.courseProgress.findMany({
        where: { courseId },
        select: { studentId: true },
      });
      studentIds = progresses.map((p: any) => p.studentId as string);
    } else {
      // All students in tenant via their user relation
      const students = await this.prisma.student.findMany({
        where: { user: { tenantId } },
        select: { id: true },
      });
      studentIds = students.map((s: any) => s.id as string);
    }

    const predictions = await Promise.all(
      studentIds.map((id) =>
        this.predictPerformance(id, tenantId).catch((err) => {
          this.logger.error(`Failed prediction for student ${id}`, err);
          return this.buildFallbackPrediction(id);
        }),
      ),
    );

    return predictions;
  }

  private buildFallbackPrediction(studentId: string): PerformancePrediction {
    return {
      studentId,
      predictedGrade: 'C',
      confidence: 0,
      riskLevel: 'medium',
      dropoutRisk: 0.5,
      recommendations: ['Insufficient data to generate a detailed prediction. Encourage the student to engage more.'],
      factors: [],
    };
  }
}
