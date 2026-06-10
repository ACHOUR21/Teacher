import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { QuizzesService } from '../quizzes.service';

const mockPrisma = {
  quiz: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  quizAttempt: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockNotifications = {
  notifyUser: jest.fn().mockResolvedValue(undefined),
};

const SAMPLE_QUESTIONS = [
  { id: 1, question: 'What is 2+2?', options: ['3', '4', '5', '6'], answer: '4', points: 10, type: 'multiple_choice' },
  { id: 2, question: 'Is the sky blue?', options: ['True', 'False'], answer: 'True', points: 10, type: 'true_false' },
  { id: 3, question: 'Name the capital of France.', options: null, answer: 'Paris', points: 10, type: 'short_answer' },
];

describe('QuizzesService', () => {
  let service: QuizzesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizzesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<QuizzesService>(QuizzesService);
    jest.clearAllMocks();
  });

  describe('getByLesson', () => {
    it('should return quiz for a lesson', async () => {
      const mockQuiz = { id: 'quiz-1', lessonId: 'lesson-1', title: 'Algebra Quiz' };
      mockPrisma.quiz.findFirst.mockResolvedValueOnce(mockQuiz);

      const result = await service.getByLesson('lesson-1');

      expect(result).toEqual(mockQuiz);
      expect(mockPrisma.quiz.findFirst).toHaveBeenCalledWith({ where: { lessonId: 'lesson-1' } });
    });

    it('should return null when no quiz exists for the lesson', async () => {
      mockPrisma.quiz.findFirst.mockResolvedValueOnce(null);

      const result = await service.getByLesson('lesson-no-quiz');

      expect(result).toBeNull();
    });
  });

  describe('getById', () => {
    it('should return quiz with attempt count', async () => {
      const mockQuiz = { id: 'quiz-1', title: 'Algebra Quiz', _count: { attempts: 5 } };
      mockPrisma.quiz.findUnique.mockResolvedValueOnce(mockQuiz);

      const result = await service.getById('quiz-1');

      expect(result.id).toBe('quiz-1');
      expect(result._count.attempts).toBe(5);
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValueOnce(null);

      await expect(service.getById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a quiz with questions and time limit', async () => {
      const created = { id: 'quiz-new', title: 'New Quiz', questions: SAMPLE_QUESTIONS, timeLimit: 30 };
      mockPrisma.quiz.create.mockResolvedValueOnce(created);

      const result = await service.create({
        title: 'New Quiz',
        questions: SAMPLE_QUESTIONS,
        timeLimit: 30,
      });

      expect(result.id).toBe('quiz-new');
      expect(mockPrisma.quiz.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: 'New Quiz', timeLimit: 30 }),
        }),
      );
    });

    it('should create a quiz linked to a lesson', async () => {
      const created = { id: 'quiz-linked', lessonId: 'lesson-1', title: 'Lesson Quiz' };
      mockPrisma.quiz.create.mockResolvedValueOnce(created);

      await service.create({ lessonId: 'lesson-1', title: 'Lesson Quiz', questions: SAMPLE_QUESTIONS });

      expect(mockPrisma.quiz.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ lessonId: 'lesson-1' }) }),
      );
    });
  });

  describe('update', () => {
    it('should update quiz title and questions', async () => {
      const existing = { id: 'quiz-1', title: 'Old Title' };
      const updated = { id: 'quiz-1', title: 'New Title' };
      mockPrisma.quiz.findUnique.mockResolvedValueOnce(existing);
      mockPrisma.quiz.update.mockResolvedValueOnce(updated);

      const result = await service.update('quiz-1', { title: 'New Title' });

      expect(result.title).toBe('New Title');
    });

    it('should throw NotFoundException when quiz to update does not exist', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValueOnce(null);

      await expect(service.update('nonexistent', { title: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteQuiz', () => {
    it('should delete an existing quiz', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValueOnce({ id: 'quiz-1' });
      mockPrisma.quiz.delete.mockResolvedValueOnce({ id: 'quiz-1' });

      await service.deleteQuiz('quiz-1');

      expect(mockPrisma.quiz.delete).toHaveBeenCalledWith({ where: { id: 'quiz-1' } });
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValueOnce(null);

      await expect(service.deleteQuiz('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('submitAttempt', () => {
    const mockQuiz = { id: 'quiz-1', title: 'Test Quiz', questions: SAMPLE_QUESTIONS };

    it('should grade all correct answers and return 100% score', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValueOnce(mockQuiz);
      mockPrisma.quizAttempt.create.mockResolvedValueOnce({ id: 'attempt-1', score: 100, passed: true });

      const result = await service.submitAttempt('quiz-1', 'user-1', [
        { questionId: 1, answer: '4' },
        { questionId: 2, answer: 'True' },
        { questionId: 3, answer: 'Paris' },
      ]);

      expect(result.score).toBe(100);
      expect(result.passed).toBe(true);
      expect(result.correct).toBe(3);
      expect(result.total).toBe(3);
    });

    it('should grade case-insensitively and trim whitespace', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValueOnce(mockQuiz);
      mockPrisma.quizAttempt.create.mockResolvedValueOnce({ id: 'attempt-2', score: 100, passed: true });

      const result = await service.submitAttempt('quiz-1', 'user-1', [
        { questionId: 1, answer: '4' },
        { questionId: 2, answer: 'true' },
        { questionId: 3, answer: '  paris  ' },
      ]);

      expect(result.correct).toBe(3);
    });

    it('should calculate partial score correctly', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValueOnce(mockQuiz);
      mockPrisma.quizAttempt.create.mockResolvedValueOnce({ id: 'attempt-3', score: 33.33, passed: false });

      const result = await service.submitAttempt('quiz-1', 'user-1', [
        { questionId: 1, answer: '4' },
        { questionId: 2, answer: 'False' },
        { questionId: 3, answer: 'London' },
      ]);

      expect(result.correct).toBe(1);
      expect(result.passed).toBe(false);
    });

    it('should mark as failed when score is below 70%', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValueOnce(mockQuiz);
      mockPrisma.quizAttempt.create.mockResolvedValueOnce({ id: 'attempt-4', score: 66.67, passed: false });

      const result = await service.submitAttempt('quiz-1', 'user-1', [
        { questionId: 1, answer: '4' },
        { questionId: 2, answer: 'True' },
        { questionId: 3, answer: 'Wrong' },
      ]);

      expect(result.passed).toBe(false);
    });

    it('should notify user on passing score', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValueOnce(mockQuiz);
      mockPrisma.quizAttempt.create.mockResolvedValueOnce({ id: 'attempt-5', score: 100, passed: true });

      await service.submitAttempt('quiz-1', 'user-1', [
        { questionId: 1, answer: '4' },
        { questionId: 2, answer: 'True' },
        { questionId: 3, answer: 'Paris' },
      ]);

      await Promise.resolve();
      expect(mockNotifications.notifyUser).toHaveBeenCalledWith(
        'user-1',
        'Quiz Passed!',
        expect.stringContaining('Test Quiz'),
        expect.any(Object),
      );
    });

    it('should not notify user on failing score', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValueOnce(mockQuiz);
      mockPrisma.quizAttempt.create.mockResolvedValueOnce({ id: 'attempt-6', score: 0, passed: false });

      await service.submitAttempt('quiz-1', 'user-1', [
        { questionId: 1, answer: 'Wrong' },
        { questionId: 2, answer: 'Wrong' },
        { questionId: 3, answer: 'Wrong' },
      ]);

      await Promise.resolve();
      expect(mockNotifications.notifyUser).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValueOnce(null);

      await expect(service.submitAttempt('nonexistent', 'user-1', [])).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when quiz has no questions', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValueOnce({ id: 'quiz-empty', questions: [] });

      await expect(service.submitAttempt('quiz-empty', 'user-1', [])).rejects.toThrow(BadRequestException);
    });

    it('should include per-question breakdown in result', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValueOnce(mockQuiz);
      mockPrisma.quizAttempt.create.mockResolvedValueOnce({ id: 'attempt-7', score: 100, passed: true });

      const result = await service.submitAttempt('quiz-1', 'user-1', [
        { questionId: 1, answer: '4' },
        { questionId: 2, answer: 'True' },
        { questionId: 3, answer: 'Paris' },
      ]);

      expect(result.breakdown).toHaveLength(3);
      expect(result.breakdown[0]).toMatchObject({
        questionId: 1,
        isCorrect: true,
        earnedPoints: 10,
      });
    });
  });

  describe('getMyAttempts', () => {
    it('should return attempts for a user on a quiz', async () => {
      const mockAttempts = [
        { id: 'attempt-1', score: 100, passed: true, createdAt: new Date() },
        { id: 'attempt-2', score: 60, passed: false, createdAt: new Date() },
      ];
      mockPrisma.quiz.findUnique.mockResolvedValueOnce({ id: 'quiz-1' });
      mockPrisma.quizAttempt.findMany.mockResolvedValueOnce(mockAttempts);

      const result = await service.getMyAttempts('quiz-1', 'user-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.quizAttempt.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { quizId: 'quiz-1', userId: 'user-1' } }),
      );
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValueOnce(null);

      await expect(service.getMyAttempts('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getResults', () => {
    it('should return all attempts for a quiz', async () => {
      const mockAttempts = [
        { id: 'attempt-1', userId: 'user-1', score: 100 },
        { id: 'attempt-2', userId: 'user-2', score: 80 },
      ];
      mockPrisma.quiz.findUnique.mockResolvedValueOnce({ id: 'quiz-1' });
      mockPrisma.quizAttempt.findMany.mockResolvedValueOnce(mockAttempts);

      const result = await service.getResults('quiz-1');

      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when quiz does not exist', async () => {
      mockPrisma.quiz.findUnique.mockResolvedValueOnce(null);

      await expect(service.getResults('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
