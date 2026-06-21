"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UpdateQuizDto = exports.SubmitAttemptDto = exports.QuizzesService = exports.CreateQuizDto = void 0;
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
class CreateQuizDto {
  lessonId;
  title;
  questions;
  timeLimit;
}
exports.CreateQuizDto = CreateQuizDto;
class UpdateQuizDto {
  title;
  questions;
  timeLimit;
}
exports.UpdateQuizDto = UpdateQuizDto;
class SubmitAttemptDto {
  answers;
}
exports.SubmitAttemptDto = SubmitAttemptDto;
let QuizzesService = exports.QuizzesService = class QuizzesService {
  constructor(prisma, notifications) {
    this.prisma = prisma;
    this.notifications = notifications;
  }
  async getByLesson(lessonId) {
    return this.prisma.quiz.findFirst({
      where: {
        lessonId
      }
    });
  }
  async getById(id) {
    const quiz = await this.prisma.quiz.findUnique({
      where: {
        id
      },
      include: {
        _count: {
          select: {
            attempts: true
          }
        }
      }
    });
    if (!quiz) {
      throw new _common.NotFoundException('Quiz not found');
    }
    return quiz;
  }
  async create(dto) {
    return this.prisma.quiz.create({
      data: {
        lessonId: dto.lessonId,
        title: dto.title,
        questions: dto.questions,
        timeLimit: dto.timeLimit
      }
    });
  }
  async update(id, dto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: {
        id
      }
    });
    if (!quiz) {
      throw new _common.NotFoundException('Quiz not found');
    }
    return this.prisma.quiz.update({
      where: {
        id
      },
      data: {
        ...(dto.title !== undefined && {
          title: dto.title
        }),
        ...(dto.questions !== undefined && {
          questions: dto.questions
        }),
        ...(dto.timeLimit !== undefined && {
          timeLimit: dto.timeLimit
        })
      }
    });
  }
  async deleteQuiz(id) {
    const quiz = await this.prisma.quiz.findUnique({
      where: {
        id
      }
    });
    if (!quiz) {
      throw new _common.NotFoundException('Quiz not found');
    }
    await this.prisma.quiz.delete({
      where: {
        id
      }
    });
  }
  async submitAttempt(quizId, userId, answers) {
    const quiz = await this.prisma.quiz.findUnique({
      where: {
        id: quizId
      }
    });
    if (!quiz) {
      throw new _common.NotFoundException('Quiz not found');
    }
    const questions = quiz.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new _common.BadRequestException('Quiz has no questions');
    }
    let totalPoints = 0;
    let correctPoints = 0;
    const breakdown = questions.map(q => {
      totalPoints += q.points;
      const submitted = answers.find(a => a.questionId === q.id);
      const submittedAnswer = submitted?.answer ?? '';
      const isCorrect = submittedAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
      if (isCorrect) {
        correctPoints += q.points;
      }
      return {
        questionId: q.id,
        question: q.question,
        submittedAnswer,
        correctAnswer: q.answer,
        isCorrect,
        points: q.points,
        earnedPoints: isCorrect ? q.points : 0
      };
    });
    const score = totalPoints > 0 ? correctPoints / totalPoints * 100 : 0;
    const passed = score >= 70;
    const correct = breakdown.filter(b => b.isCorrect).length;
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        answers: answers,
        score,
        passed
      }
    });
    if (passed) {
      await this.notifications.notifyUser(userId, 'Quiz Passed!', `You scored ${Math.round(score)}% on "${quiz.title}" — great work!`, {
        type: 'GENERAL',
        quizId
      }).catch(() => {});
    }
    return {
      attemptId: attempt.id,
      score,
      passed,
      total: questions.length,
      correct,
      breakdown
    };
  }
  async getMyAttempts(quizId, userId) {
    const quiz = await this.prisma.quiz.findUnique({
      where: {
        id: quizId
      }
    });
    if (!quiz) {
      throw new _common.NotFoundException('Quiz not found');
    }
    return this.prisma.quizAttempt.findMany({
      where: {
        quizId,
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
  async getResults(quizId) {
    const quiz = await this.prisma.quiz.findUnique({
      where: {
        id: quizId
      }
    });
    if (!quiz) {
      throw new _common.NotFoundException('Quiz not found');
    }
    return this.prisma.quizAttempt.findMany({
      where: {
        quizId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
};
exports.QuizzesService = QuizzesService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_notifications.NotificationsService)), __metadata("design:paramtypes", [Object, Object])], QuizzesService);