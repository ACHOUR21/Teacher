import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[] | null;
  answer: string;
  points: number;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
}

export interface QuizAnswer {
  questionId: number;
  answer: string;
}

export class CreateQuizDto {
  lessonId?: string;
  title: string;
  questions: QuizQuestion[];
  timeLimit?: number;
}

export class UpdateQuizDto {
  title?: string;
  questions?: QuizQuestion[];
  timeLimit?: number;
}

export class SubmitAttemptDto {
  answers: QuizAnswer[];
}

@Injectable()
export class QuizzesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getByLesson(lessonId: string) {
    return this.prisma.quiz.findFirst({
      where: { lessonId },
    });
  }

  async getById(id: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        _count: { select: { attempts: true } },
      },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async create(dto: CreateQuizDto) {
    return this.prisma.quiz.create({
      data: {
        lessonId: dto.lessonId,
        title: dto.title,
        questions: dto.questions as object[],
        timeLimit: dto.timeLimit,
      },
    });
  }

  async update(id: string, dto: UpdateQuizDto) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    return this.prisma.quiz.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.questions !== undefined && { questions: dto.questions as object[] }),
        ...(dto.timeLimit !== undefined && { timeLimit: dto.timeLimit }),
      },
    });
  }

  async deleteQuiz(id: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id } });
    if (!quiz) throw new NotFoundException('Quiz not found');
    await this.prisma.quiz.delete({ where: { id } });
  }

  async submitAttempt(quizId: string, userId: string, answers: QuizAnswer[]) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const questions = quiz.questions as unknown as QuizQuestion[];
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new BadRequestException('Quiz has no questions');
    }

    let totalPoints = 0;
    let correctPoints = 0;

    const breakdown = questions.map((q) => {
      totalPoints += q.points;
      const submitted = answers.find((a) => a.questionId === q.id);
      const submittedAnswer = submitted?.answer ?? '';
      const isCorrect =
        submittedAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
      if (isCorrect) correctPoints += q.points;
      return {
        questionId: q.id,
        question: q.question,
        submittedAnswer,
        correctAnswer: q.answer,
        isCorrect,
        points: q.points,
        earnedPoints: isCorrect ? q.points : 0,
      };
    });

    const score = totalPoints > 0 ? (correctPoints / totalPoints) * 100 : 0;
    const passed = score >= 70;
    const correct = breakdown.filter((b) => b.isCorrect).length;

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        answers: answers as object[],
        score,
        passed,
      },
    });

    if (passed) {
      await this.notifications.notifyUser(
        userId,
        'Quiz Passed!',
        `You scored ${Math.round(score)}% on "${quiz.title}" — great work!`,
        { type: 'GENERAL', quizId }
      ).catch(() => {});
    }

    return {
      attemptId: attempt.id,
      score,
      passed,
      total: questions.length,
      correct,
      breakdown,
    };
  }

  async getMyAttempts(quizId: string, userId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    return this.prisma.quizAttempt.findMany({
      where: { quizId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getResults(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    return this.prisma.quizAttempt.findMany({
      where: { quizId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
