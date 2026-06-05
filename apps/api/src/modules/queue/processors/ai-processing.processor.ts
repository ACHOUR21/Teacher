import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QUEUE_AI_PROCESSING } from '../queue.module';
import { AiService } from '../../ai/ai.service';

export interface TutorJobData {
  userId: string;
  tenantId: string;
  message: string;
  subject: string;
  conversationId?: string;
}

export interface HomeworkJobData {
  userId: string;
  tenantId: string;
  problem: string;
  subject: string;
}

export interface ExamGenerationJobData {
  userId: string;
  tenantId: string;
  topic: string;
  numQuestions: number;
  difficulty: string;
  questionTypes: string[];
}

export interface LessonGenerationJobData {
  userId: string;
  tenantId: string;
  topic: string;
  gradeLevel: string;
  duration: number;
}

@Processor(QUEUE_AI_PROCESSING)
export class AiProcessingProcessor {
  private readonly logger = new Logger(AiProcessingProcessor.name);

  constructor(private readonly aiService: AiService) {}

  @Process('tutor-chat')
  async handleTutorChat(job: Job<TutorJobData>) {
    const { userId, tenantId, message, subject, conversationId } = job.data;
    this.logger.log(`Processing tutor chat for user ${userId}`);
    return this.aiService.tutorChat(userId, tenantId, message, subject, conversationId);
  }

  @Process('solve-homework')
  async handleHomework(job: Job<HomeworkJobData>) {
    const { userId, tenantId, problem, subject } = job.data;
    this.logger.log(`Processing homework for user ${userId}`);
    return this.aiService.solveHomework(userId, tenantId, problem, subject);
  }

  @Process('generate-exam')
  async handleExamGeneration(job: Job<ExamGenerationJobData>) {
    const { userId, tenantId, topic, numQuestions, difficulty, questionTypes } = job.data;
    this.logger.log(`Generating exam on "${topic}" for user ${userId}`);
    return this.aiService.generateExam(userId, tenantId, topic, numQuestions, difficulty, questionTypes);
  }

  @Process('generate-lesson')
  async handleLessonGeneration(job: Job<LessonGenerationJobData>) {
    const { userId, tenantId, topic, gradeLevel, duration } = job.data;
    this.logger.log(`Generating lesson plan on "${topic}" for user ${userId}`);
    return this.aiService.generateLesson(userId, tenantId, topic, gradeLevel, duration);
  }
}
