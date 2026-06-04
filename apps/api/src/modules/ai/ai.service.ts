import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { PrismaService } from '../database/prisma.service';
import { AIModuleType } from '@prisma/client';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly anthropic: Anthropic;
  private readonly openai: OpenAI;

  constructor(private readonly prisma: PrismaService) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  private async trackUsage(tenantId: string, userId: string, module: AIModuleType, tokens: number) {
    const cost = tokens * 0.000003;
    await this.prisma.aIUsage.create({ data: { tenantId, userId, module, tokens, cost } });
  }

  private async saveMessage(conversationId: string, role: 'user' | 'assistant', content: string, tokens = 0) {
    return this.prisma.aIMessage.create({ data: { conversationId, role, content, tokens } });
  }

  async getOrCreateConversation(userId: string, module: AIModuleType, conversationId?: string) {
    if (conversationId) {
      return this.prisma.aIConversation.findUnique({ where: { id: conversationId }, include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } } });
    }
    return this.prisma.aIConversation.create({ data: { userId, module, title: `${module} Session` }, include: { messages: true } });
  }

  async tutorChat(userId: string, tenantId: string, message: string, subject: string, conversationId?: string) {
    const conversation = await this.getOrCreateConversation(userId, AIModuleType.TUTOR, conversationId);
    await this.saveMessage(conversation!.id, 'user', message);

    const history = (conversation!.messages ?? []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const response = await this.anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are an expert AI tutor specializing in ${subject}. Explain concepts clearly using examples. Break down complex topics step by step. Be encouraging and adapt to the student's level.`,
      messages: [...history, { role: 'user', content: message }],
    });

    const answer = (response.content[0] as Anthropic.TextBlock).text;
    const tokens = response.usage.input_tokens + response.usage.output_tokens;
    await this.saveMessage(conversation!.id, 'assistant', answer, tokens);
    await this.trackUsage(tenantId, userId, AIModuleType.TUTOR, tokens);

    return { conversationId: conversation!.id, answer, tokens };
  }

  async solveHomework(userId: string, tenantId: string, problem: string, subject: string) {
    const response = await this.anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `You are a homework assistant for ${subject}. Provide step-by-step solutions. Show all working. Explain why each step is taken. Do not just give the answer — teach the method.`,
      messages: [{ role: 'user', content: problem }],
    });

    const solution = (response.content[0] as Anthropic.TextBlock).text;
    const tokens = response.usage.input_tokens + response.usage.output_tokens;
    await this.trackUsage(tenantId, userId, AIModuleType.HOMEWORK_ASSISTANT, tokens);
    return { solution, tokens };
  }

  async generateExam(userId: string, tenantId: string, topic: string, numQuestions: number, difficulty: string, questionTypes: string[]) {
    const prompt = `Generate a ${difficulty} level exam on "${topic}" with exactly ${numQuestions} questions.
Include question types: ${questionTypes.join(', ')}.
Return valid JSON: { "title": string, "questions": [{ "id": number, "type": "multiple_choice"|"short_answer"|"essay"|"true_false", "question": string, "options": string[]|null, "answer": string, "explanation": string, "points": number }] }`;

    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 4096,
    });

    const tokens = response.usage?.total_tokens ?? 0;
    await this.trackUsage(tenantId, userId, AIModuleType.EXAM_GENERATOR, tokens);
    return { exam: JSON.parse(response.choices[0].message.content ?? '{}'), tokens };
  }

  async generateLesson(userId: string, tenantId: string, topic: string, gradeLevel: string, duration: number) {
    const prompt = `Create a complete lesson plan for "${topic}" for grade level "${gradeLevel}" with a ${duration}-minute duration.
Return JSON: { "title": string, "objectives": string[], "materials": string[], "introduction": string, "mainContent": { "sections": [{ "title": string, "content": string, "activity": string, "duration": number }] }, "assessment": string, "homework": string, "differentiation": { "advanced": string, "support": string } }`;

    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 3000,
    });

    const tokens = response.usage?.total_tokens ?? 0;
    await this.trackUsage(tenantId, userId, AIModuleType.LESSON_GENERATOR, tokens);
    return { lesson: JSON.parse(response.choices[0].message.content ?? '{}'), tokens };
  }

  async generateFlashcards(userId: string, tenantId: string, topic: string, numCards: number) {
    const prompt = `Create ${numCards} flashcards for studying "${topic}".
Return JSON: { "cards": [{ "front": string, "back": string, "hint": string|null, "difficulty": "easy"|"medium"|"hard" }] }`;

    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    const tokens = response.usage?.total_tokens ?? 0;
    await this.trackUsage(tenantId, userId, AIModuleType.FLASHCARDS, tokens);
    return { flashcards: JSON.parse(response.choices[0].message.content ?? '{}'), tokens };
  }

  async generateMindMap(userId: string, tenantId: string, topic: string) {
    const prompt = `Create a comprehensive mind map for "${topic}".
Return JSON: { "central": string, "branches": [{ "label": string, "color": string, "children": [{ "label": string, "children": [{ "label": string }]|null }] }] }`;

    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    const tokens = response.usage?.total_tokens ?? 0;
    await this.trackUsage(tenantId, userId, AIModuleType.MIND_MAP, tokens);
    return { mindMap: JSON.parse(response.choices[0].message.content ?? '{}'), tokens };
  }

  async translate(userId: string, tenantId: string, text: string, targetLanguage: string, sourceLanguage = 'auto') {
    const response = await this.anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: 'You are a professional translator. Provide accurate, natural-sounding translations that preserve meaning and context.',
      messages: [{ role: 'user', content: `Translate the following from ${sourceLanguage} to ${targetLanguage}:\n\n${text}` }],
    });

    const translation = (response.content[0] as Anthropic.TextBlock).text;
    const tokens = response.usage.input_tokens + response.usage.output_tokens;
    await this.trackUsage(tenantId, userId, AIModuleType.TRANSLATOR, tokens);
    return { translation, tokens };
  }

  async checkPlagiarism(userId: string, tenantId: string, content: string) {
    const response = await this.anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: 'You are an academic integrity checker. Analyze text for signs of plagiarism, AI generation, and unusual writing patterns. Return a JSON analysis.',
      messages: [{
        role: 'user',
        content: `Analyze this text for plagiarism indicators: "${content.substring(0, 3000)}"\nReturn JSON: { "overallScore": number (0-100, 100=likely plagiarized), "aiGenerated": boolean, "flags": string[], "summary": string }`,
      }],
    });

    const result = (response.content[0] as Anthropic.TextBlock).text;
    const tokens = response.usage.input_tokens + response.usage.output_tokens;
    await this.trackUsage(tenantId, userId, AIModuleType.PLAGIARISM_DETECTION, tokens);
    try {
      return { result: JSON.parse(result), tokens };
    } catch {
      return { result: { overallScore: 0, summary: result }, tokens };
    }
  }

  async moderateContent(tenantId: string, content: string) {
    const response = await this.openai.moderations.create({ input: content });
    const result = response.results[0];
    return {
      flagged: result.flagged,
      categories: result.categories,
      scores: result.category_scores,
    };
  }

  async getRecommendations(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: { include: { courseProgress: { include: { course: true }, take: 5, orderBy: { lastAccessedAt: 'desc' } } } },
      },
    });

    const recentCourses = user?.studentProfile?.courseProgress.map(p => p.course.title) ?? [];
    const prompt = `Based on these recently studied courses: ${recentCourses.join(', ')}, recommend 5 courses for continued learning. Return JSON: { "recommendations": [{ "title": string, "reason": string, "estimatedLevel": string }] }`;

    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const tokens = response.usage?.total_tokens ?? 0;
    await this.trackUsage(tenantId, userId, AIModuleType.RECOMMENDATION, tokens);
    return { recommendations: JSON.parse(response.choices[0].message.content ?? '{}'), tokens };
  }

  async getUsageStats(tenantId: string, period: 'day' | 'week' | 'month' = 'month') {
    const from = new Date();
    if (period === 'day') from.setDate(from.getDate() - 1);
    else if (period === 'week') from.setDate(from.getDate() - 7);
    else from.setMonth(from.getMonth() - 1);

    const usage = await this.prisma.aIUsage.groupBy({
      by: ['module'],
      where: { tenantId, createdAt: { gte: from } },
      _sum: { tokens: true, cost: true },
      _count: { id: true },
    });

    return usage;
  }
}
