import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CertificatesService } from '../certificates/certificates.service';
import { SearchService } from '../search/search.service';

export interface GeneratedQuestion {
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points?: number;
}

export interface SaveExamDto {
  title: string;
  subject: string;
  topic?: string;
  difficulty?: string;
  timeLimit?: number;
  questions: GeneratedQuestion[];
}

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly certificates: CertificatesService,
    private readonly search: SearchService,
  ) {}

  async saveExam(tenantId: string, userId: string, dto: SaveExamDto) {
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
            points: q.points ?? 1,
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
    this.search.indexExam({ id: exam.id, title: exam.title, subject: exam.subject, topic: exam.topic, difficulty: exam.difficulty, tenantId });
    return exam;
  }

  async listExams(tenantId: string, options: { published?: boolean; createdBy?: string } = {}) {
    return this.prisma.exam.findMany({
      where: {
        tenantId,
        ...(options.published !== undefined ? { isPublished: options.published } : {}),
        ...(options.createdBy ? { createdBy: options.createdBy } : {}),
      },
      include: {
        _count: { select: { questions: true, attempts: true } },
        creator: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getExam(examId: string, includeAnswers = false) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true, order: true, type: true, question: true,
            options: true, points: true,
            // Only include answers if teacher is viewing
            ...(includeAnswers ? { correctAnswer: true, explanation: true } : {}),
          },
        },
        creator: { select: { firstName: true, lastName: true } },
      },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  async publishExam(examId: string, userId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found');
    if (exam.createdBy !== userId) throw new ForbiddenException('Only the creator can publish this exam');
    const updated = await this.prisma.exam.update({ where: { id: examId }, data: { isPublished: true } });
    this.search.indexExam({ id: updated.id, title: updated.title, subject: updated.subject, topic: updated.topic, difficulty: updated.difficulty, tenantId: updated.tenantId, isPublished: true });
    return updated;
  }

  async deleteExam(examId: string, userId: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found');
    if (exam.createdBy !== userId) throw new ForbiddenException('Only the creator can delete this exam');
    await this.prisma.exam.delete({ where: { id: examId } });
    this.search.deleteDocument('exams', examId);
  }

  // ------------------------------------------------------------------ attempts

  async startAttempt(examId: string, userId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { orderBy: { order: 'asc' }, select: { id: true, order: true, type: true, question: true, options: true, points: true } } },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    if (!exam.isPublished) throw new ForbiddenException('This exam is not published yet');

    // Check for in-progress attempt
    const existing = await this.prisma.examAttempt.findFirst({
      where: { examId, userId, submittedAt: null },
    });
    if (existing) return { attempt: existing, questions: exam.questions };

    const attempt = await this.prisma.examAttempt.create({
      data: { examId, userId, answers: {} },
    });
    return { attempt, questions: exam.questions };
  }

  async submitAttempt(attemptId: string, userId: string, answers: Record<string, string>) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: { include: { questions: true } } },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenException('Not your attempt');
    if (attempt.submittedAt) throw new BadRequestException('Attempt already submitted');

    // Auto-score objective questions
    let score = 0;
    const maxScore = attempt.exam.questions.reduce((s, q) => s + q.points, 0);

    for (const question of attempt.exam.questions) {
      const given = (answers[question.id] ?? '').trim().toLowerCase();
      const correct = question.correctAnswer.trim().toLowerCase();
      if (
        (question.type === 'multiple_choice' || question.type === 'true_false') &&
        given === correct
      ) {
        score += question.points;
      }
    }

    const result = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: { answers, score, maxScore, submittedAt: new Date() },
    });

    // Auto-issue certificate if score >= 70% and a template exists for this exam's subject
    if (maxScore > 0 && score / maxScore >= 0.7) {
      const template = await this.prisma.certificateTemplate.findFirst({
        where: { course: { title: attempt.exam.subject } },
      });
      if (template) {
        this.certificates.issueToUser(userId, template.id, {
          source: 'exam',
          examId: attempt.examId,
          score,
          maxScore,
        }).catch(() => { /* non-blocking */ });
      }
    }

    return result;
  }

  async getAttemptResult(attemptId: string, userId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: { orderBy: { order: 'asc' } },
          },
        },
      },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenException('Not your attempt');
    return attempt;
  }

  async listAttempts(examId: string) {
    return this.prisma.examAttempt.findMany({
      where: { examId, submittedAt: { not: null } },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
