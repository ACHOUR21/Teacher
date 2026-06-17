import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';

export interface StudentGradeRow {
  studentId: string;
  studentName: string;
  studentCode: string | null;
  grades: Array<{
    subject: string;
    term: string;
    score: number;
    maxScore: number;
    percentage: number;
    letter: string;
  }>;
  average: number | null;
}

export interface GradeStats {
  classId: string;
  subject: string | null;
  count: number;
  mean: number;
  median: number;
  passRate: number; // percentage scoring >= 50%
  distribution: { range: string; count: number }[];
}

export interface ReportCard {
  studentId: string;
  studentName: string;
  term: string;
  subjects: Array<{
    subject: string;
    score: number;
    maxScore: number;
    percentage: number;
    letter: string;
  }>;
  average: number;
  rank?: number;
  totalStudents?: number;
  remarks: string;
}

export class SubmitGradeDto {
  studentId: string;
  classId: string;
  subject: string;
  term: string;
  score: number;
  maxScore: number;
  remarks?: string;
}

function letterGrade(percentage: number): string {
  if (percentage >= 90) {return 'A+';}
  if (percentage >= 80) {return 'A';}
  if (percentage >= 70) {return 'B';}
  if (percentage >= 60) {return 'C';}
  if (percentage >= 50) {return 'D';}
  return 'F';
}

function getRemarks(average: number): string {
  if (average >= 90) {return 'Excellent';}
  if (average >= 80) {return 'Very Good';}
  if (average >= 70) {return 'Good';}
  if (average >= 60) {return 'Average';}
  if (average >= 50) {return 'Below Average';}
  return 'Needs Improvement';
}

function median(values: number[]): number {
  if (values.length === 0) {return 0;}
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Grades are stored in ExamAttempt with a special "GRADEBOOK" exam per
 * (classId, subject, term) keyed in the exam's topic field as JSON metadata.
 * The exam title is "GRADEBOOK:{classId}:{subject}:{term}".
 * Each student's score/maxScore is stored in ExamAttempt.score / ExamAttempt.maxScore.
 */

const EXAM_TITLE_PREFIX = 'GRADEBOOK';

function gradeExamTitle(classId: string, subject: string, term: string): string {
  return `${EXAM_TITLE_PREFIX}:${classId}:${subject}:${term}`;
}

@Injectable()
export class GradeBookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisService,
  ) {}

  private async getOrCreateGradeExam(
    classId: string,
    subject: string,
    term: string,
    tenantId: string,
    createdBy: string,
  ) {
    const title = gradeExamTitle(classId, subject, term);
    let exam = await this.prisma.exam.findFirst({
      where: { tenantId, title, subject },
    });
    if (!exam) {
      exam = await this.prisma.exam.create({
        data: {
          tenantId,
          createdBy,
          title,
          subject,
          topic: JSON.stringify({ classId, term, isGradebook: true }),
          isPublished: false,
        },
      });
    }
    return exam;
  }

  /** Get all students in a class with their grades */
  async getClassGrades(
    classId: string,
    subject?: string,
    term?: string,
  ): Promise<StudentGradeRow[]> {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
      include: { school: { select: { tenantId: true } } },
    });
    if (!schoolClass) {throw new NotFoundException('Class not found');}
    const tenantId = schoolClass.school.tenantId;

    // Find all gradebook exams for this class
    const titleFilter = subject && term
      ? gradeExamTitle(classId, subject, term)
      : { startsWith: `${EXAM_TITLE_PREFIX}:${classId}:` };

    const exams = await this.prisma.exam.findMany({
      where: {
        tenantId,
        title: typeof titleFilter === 'string' ? titleFilter : titleFilter,
      },
      include: { attempts: { include: { user: { select: { id: true } } } } },
    });

    // Get students
    const students = await this.prisma.student.findMany({
      where: { classId },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    return students.map((student) => {
      const grades = exams
        .filter((exam) => {
          const meta = exam.topic ? (JSON.parse(exam.topic) as { classId?: string }) : {};
          return meta.classId === classId;
        })
        .map((exam) => {
          // Title format: GRADEBOOK:{classId}:{subject}:{term}
          const parts = exam.title.split(':');
          const examSubject = parts[2] ?? exam.subject;
          const examTerm = parts.slice(3).join(':') ?? '';

          const attempt = exam.attempts.find((a) => a.user.id === student.userId);
          if (!attempt || attempt.score === null || attempt.maxScore === null) {
            return null;
          }
          const pct = Math.round((attempt.score / attempt.maxScore) * 100);
          return {
            subject: examSubject,
            term: examTerm,
            score: attempt.score,
            maxScore: attempt.maxScore,
            percentage: pct,
            letter: letterGrade(pct),
          };
        })
        .filter((g): g is NonNullable<typeof g> => g !== null);

      const avg =
        grades.length > 0
          ? Math.round(grades.reduce((s, g) => s + g.percentage, 0) / grades.length)
          : null;

      return {
        studentId: student.id,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        studentCode: student.studentId ?? null,
        grades,
        average: avg,
      };
    });
  }

  /** Submit or update a grade for a student */
  async submitGrade(dto: SubmitGradeDto, tenantId: string, submittedById: string): Promise<void> {
    const student = await this.prisma.student.findUnique({ where: { id: dto.studentId } });
    if (!student) {throw new NotFoundException('Student not found');}

    const exam = await this.getOrCreateGradeExam(
      dto.classId,
      dto.subject,
      dto.term,
      tenantId,
      submittedById,
    );

    await this.prisma.examAttempt.upsert({
      where: {
        // There's no unique constraint on (examId, userId) but we'll check manually
        id: (
          await this.prisma.examAttempt.findFirst({
            where: { examId: exam.id, userId: student.userId },
          })
        )?.id ?? 'create-new',
      },
      update: {
        score: dto.score,
        maxScore: dto.maxScore,
        submittedAt: new Date(),
        answers: { remarks: dto.remarks ?? '' } as object,
      },
      create: {
        examId: exam.id,
        userId: student.userId,
        score: dto.score,
        maxScore: dto.maxScore,
        answers: { remarks: dto.remarks ?? '' } as object,
        submittedAt: new Date(),
      },
    });

    await this.cache.del(`gradebook:class:${dto.classId}`);
  }

  /** Bulk import grades from array */
  async bulkImportGrades(
    classId: string,
    grades: Array<{ studentId: string; subject: string; score: number; maxScore: number; term: string }>,
    tenantId: string,
    submittedById: string,
  ): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;

    for (const g of grades) {
      try {
        await this.submitGrade(
          { studentId: g.studentId, classId, subject: g.subject, term: g.term, score: g.score, maxScore: g.maxScore },
          tenantId,
          submittedById,
        );
        imported++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push(`Student ${g.studentId}: ${message}`);
      }
    }

    return { imported, errors };
  }

  /** Calculate class statistics */
  async getClassStats(classId: string, subject?: string): Promise<GradeStats> {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
      include: { school: { select: { tenantId: true } } },
    });
    if (!schoolClass) {throw new NotFoundException('Class not found');}
    const tenantId = schoolClass.school.tenantId;

    const titlePrefix = subject
      ? gradeExamTitle(classId, subject, '')
      : `${EXAM_TITLE_PREFIX}:${classId}:`;

    const exams = await this.prisma.exam.findMany({
      where: {
        tenantId,
        title: { startsWith: subject
          ? `${EXAM_TITLE_PREFIX}:${classId}:${subject}:`
          : `${EXAM_TITLE_PREFIX}:${classId}:` },
      },
      include: { attempts: true },
    });

    const percentages: number[] = [];
    for (const exam of exams) {
      for (const attempt of exam.attempts) {
        if (attempt.score !== null && attempt.maxScore !== null && attempt.maxScore > 0) {
          percentages.push((attempt.score / attempt.maxScore) * 100);
        }
      }
    }

    const count = percentages.length;
    const mean = count > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / count) : 0;
    const medianVal = Math.round(median(percentages));
    const passRate = count > 0 ? Math.round((percentages.filter((p) => p >= 50).length / count) * 100) : 0;

    const ranges = ['0-49', '50-59', '60-69', '70-79', '80-89', '90-100'];
    const distribution = ranges.map((range) => {
      const [min, max] = range.split('-').map(Number);
      return {
        range,
        count: percentages.filter((p) => p >= min && p <= max).length,
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
      distribution,
    };
  }

  /** Generate report card data for a student */
  async getReportCard(studentId: string, term: string): Promise<ReportCard> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { firstName: true, lastName: true } },
        class: { select: { id: true } },
      },
    });
    if (!student) {throw new NotFoundException('Student not found');}
    if (!student.class) {throw new NotFoundException('Student is not assigned to a class');}

    const classId = student.class.id;
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
      include: { school: { select: { tenantId: true } } },
    });
    const tenantId = schoolClass?.school.tenantId ?? '';

    // Find all gradebook exams for this class+term
    const exams = await this.prisma.exam.findMany({
      where: {
        tenantId,
        title: { startsWith: `${EXAM_TITLE_PREFIX}:${classId}:` },
        topic: { contains: term },
      },
      include: {
        attempts: {
          where: { userId: student.userId },
        },
      },
    });

    const subjects = exams
      .map((exam) => {
        const parts = exam.title.split(':');
        const subject = parts[2] ?? exam.subject;
        const attempt = exam.attempts[0];
        if (!attempt || attempt.score === null || attempt.maxScore === null) {return null;}
        const pct = Math.round((attempt.score / attempt.maxScore) * 100);
        return {
          subject,
          score: attempt.score,
          maxScore: attempt.maxScore,
          percentage: pct,
          letter: letterGrade(pct),
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    const average =
      subjects.length > 0
        ? Math.round(subjects.reduce((s, sub) => s + sub.percentage, 0) / subjects.length)
        : 0;

    // Calculate rank among classmates
    const classGrades = await this.getClassGrades(classId, undefined, term);
    const sortedByAvg = classGrades
      .filter((r) => r.average !== null)
      .sort((a, b) => (b.average ?? 0) - (a.average ?? 0));
    const rank = sortedByAvg.findIndex((r) => r.studentId === studentId) + 1;

    return {
      studentId,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      term,
      subjects,
      average,
      rank: rank > 0 ? rank : undefined,
      totalStudents: sortedByAvg.length,
      remarks: getRemarks(average),
    };
  }
}
