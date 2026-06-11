/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { AIModuleType } from '@prisma/client';
import OpenAI from 'openai';

import { ResilienceService } from '../core/services/resilience.service';
import { PrismaService } from '../database/prisma.service';


@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly anthropic: Anthropic;
  private readonly openai: OpenAI;

  private readonly MONTHLY_TOKEN_LIMITS: Record<string, number> = {
    FREE_TRIAL: 50_000,
    STARTER: 200_000,
    PROFESSIONAL: 1_000_000,
    BUSINESS: 5_000_000,
    ENTERPRISE: Infinity,
    LIFETIME: Infinity,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly resilience: ResilienceService,
  ) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder-key' });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? 'placeholder-key' });
  }

  private openAiFallbackCompletion(message: string): OpenAI.Chat.ChatCompletion {
    return {
      id: 'fallback',
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'fallback',
      choices: [{ index: 0, message: { role: 'assistant', content: message, refusal: null }, finish_reason: 'stop', logprobs: null }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }

  private anthropicFallbackMessage(text: string): Anthropic.Message {
    return {
      id: 'fallback',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text }],
      model: 'fallback',
      stop_reason: 'end_turn',
      stop_sequence: null,
      usage: { input_tokens: 0, output_tokens: 0 },
    };
  }

  private async trackUsage(tenantId: string, userId: string, module: AIModuleType, tokens: number) {
    const cost = tokens * 0.000003;
    await this.prisma.aIUsage.create({ data: { tenantId, userId, module, tokens, cost } });
  }

  private async checkUsageLimit(tenantId: string): Promise<void> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId, status: { in: ['ACTIVE', 'TRIALING'] } },
      select: { plan: true },
    });
    const plan = subscription?.plan ?? 'FREE_TRIAL';
    const limit = this.MONTHLY_TOKEN_LIMITS[plan] ?? 50_000;
    if (limit === Infinity) {return;}

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usage = await this.prisma.aIUsage.aggregate({
      where: { tenantId, createdAt: { gte: startOfMonth } },
      _sum: { tokens: true },
    });

    const totalUsed = usage._sum.tokens ?? 0;
    if (totalUsed >= limit) {
      throw new ForbiddenException(
        `Monthly AI token limit of ${limit.toLocaleString()} reached for your ${plan} plan. Upgrade to continue.`
      );
    }
  }

  async getAIUsageByPeriod(tenantId: string, since: Date) {
    const [total, byModule, subscription] = await Promise.all([
      this.prisma.aIUsage.aggregate({
        where: { tenantId, createdAt: { gte: since } },
        _sum: { tokens: true },
        _count: true,
      }),
      this.prisma.aIUsage.groupBy({
        by: ['module'],
        where: { tenantId, createdAt: { gte: since } },
        _sum: { tokens: true },
        _count: true,
      }),
      this.prisma.subscription.findFirst({
        where: { tenantId },
        select: { plan: true },
      }),
    ]);

    const plan = subscription?.plan ?? 'FREE_TRIAL';
    const limit = this.MONTHLY_TOKEN_LIMITS[plan] ?? 50_000;

    return {
      plan,
      tokensUsed: total._sum.tokens ?? 0,
      requestCount: total._count,
      monthlyLimit: limit === Infinity ? null : limit,
      percentUsed: limit === Infinity ? 0 : Math.round(((total._sum.tokens ?? 0) / limit) * 100),
      byModule,
    };
  }

  private async saveMessage(conversationId: string, role: 'user' | 'assistant', content: string, tokens = 0) {
    return this.prisma.aIMessage.create({ data: { conversationId, role, content, tokens } });
  }

  async getOrCreateConversation(userId: string, tenantId: string, module: AIModuleType, conversationId?: string) {
    if (conversationId) {
      return this.prisma.aIConversation.findUnique({ where: { id: conversationId }, include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } } });
    }
    return this.prisma.aIConversation.create({ data: { tenantId, userId, module, title: `${module} Session` }, include: { messages: true } });
  }

  async tutorChat(userId: string, tenantId: string, message: string, subject: string, conversationId?: string) {
    await this.checkUsageLimit(tenantId);
    const conversation = await this.getOrCreateConversation(userId, tenantId, AIModuleType.TUTOR, conversationId);
    await this.saveMessage(conversation!.id, 'user', message);

    const history = (conversation!.messages as any[] ?? []).map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const response = await this.resilience.withResilience(
      'anthropic',
      () => this.anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: `You are an expert AI tutor specializing in ${subject}. Explain concepts clearly using examples. Break down complex topics step by step. Be encouraging and adapt to the student's level.`,
        messages: [...history, { role: 'user', content: message }],
      }),
      () => this.anthropicFallbackMessage('AI tutor is temporarily unavailable. Please try again shortly.'),
      { maxAttempts: 3, baseDelayMs: 1000 },
    );

    const answer = (response.content[0]).text;
    const tokens = response.usage.input_tokens + response.usage.output_tokens;
    await this.saveMessage(conversation!.id, 'assistant', answer, tokens);
    await this.trackUsage(tenantId, userId, AIModuleType.TUTOR, tokens);

    return { conversationId: conversation!.id, answer, tokens };
  }

  async solveHomework(userId: string, tenantId: string, problem: string, subject: string) {
    await this.checkUsageLimit(tenantId);
    const response = await this.resilience.withResilience(
      'anthropic',
      () => this.anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: `You are a homework assistant for ${subject}. Provide step-by-step solutions. Show all working. Explain why each step is taken. Do not just give the answer — teach the method.`,
        messages: [{ role: 'user', content: problem }],
      }),
      () => this.anthropicFallbackMessage('AI homework assistant is temporarily unavailable. Please try again shortly.'),
      { maxAttempts: 3, baseDelayMs: 1000 },
    );

    const solution = (response.content[0]).text;
    const tokens = response.usage.input_tokens + response.usage.output_tokens;
    await this.trackUsage(tenantId, userId, AIModuleType.HOMEWORK_ASSISTANT, tokens);
    return { solution, tokens };
  }

  async generateExam(userId: string, tenantId: string, topic: string, numQuestions: number, difficulty: string, questionTypes: string[]) {
    await this.checkUsageLimit(tenantId);
    const prompt = `Generate a ${difficulty} level exam on "${topic}" with exactly ${numQuestions} questions.
Include question types: ${questionTypes.join(', ')}.
Return valid JSON: { "title": string, "questions": [{ "id": number, "type": "multiple_choice"|"short_answer"|"essay"|"true_false", "question": string, "options": string[]|null, "answer": string, "explanation": string, "points": number }] }`;

    const response = await this.resilience.withResilience(
      'openai',
      () => this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 4096,
      }),
      () => this.openAiFallbackCompletion('{"title":"Unavailable","questions":[]}'),
      { maxAttempts: 3, baseDelayMs: 1000 },
    );

    const tokens = response.usage?.total_tokens ?? 0;
    await this.trackUsage(tenantId, userId, AIModuleType.EXAM_GENERATOR, tokens);
    return { exam: JSON.parse(response.choices[0].message.content ?? '{}'), tokens };
  }

  async generateLesson(userId: string, tenantId: string, topic: string, gradeLevel: string, duration: number) {
    await this.checkUsageLimit(tenantId);
    const prompt = `Create a complete lesson plan for "${topic}" for grade level "${gradeLevel}" with a ${duration}-minute duration.
Return JSON: { "title": string, "objectives": string[], "materials": string[], "introduction": string, "mainContent": { "sections": [{ "title": string, "content": string, "activity": string, "duration": number }] }, "assessment": string, "homework": string, "differentiation": { "advanced": string, "support": string } }`;

    const response = await this.resilience.withResilience(
      'openai',
      () => this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 3000,
      }),
      () => this.openAiFallbackCompletion('{"title":"Unavailable","objectives":[],"mainContent":{"sections":[]}}'),
      { maxAttempts: 3, baseDelayMs: 1000 },
    );

    const tokens = response.usage?.total_tokens ?? 0;
    await this.trackUsage(tenantId, userId, AIModuleType.LESSON_GENERATOR, tokens);
    return { lesson: JSON.parse(response.choices[0].message.content ?? '{}'), tokens };
  }

  async generateFlashcards(userId: string, tenantId: string, topic: string, numCards: number) {
    await this.checkUsageLimit(tenantId);
    const prompt = `Create ${numCards} flashcards for studying "${topic}".
Return JSON: { "cards": [{ "front": string, "back": string, "hint": string|null, "difficulty": "easy"|"medium"|"hard" }] }`;

    const response = await this.resilience.withResilience(
      'openai',
      () => this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      }),
      () => this.openAiFallbackCompletion('{"cards":[]}'),
      { maxAttempts: 3, baseDelayMs: 1000 },
    );

    const tokens = response.usage?.total_tokens ?? 0;
    await this.trackUsage(tenantId, userId, AIModuleType.FLASHCARDS, tokens);
    return { flashcards: JSON.parse(response.choices[0].message.content ?? '{}'), tokens };
  }

  async generateMindMap(userId: string, tenantId: string, topic: string) {
    await this.checkUsageLimit(tenantId);
    const prompt = `Create a comprehensive mind map for "${topic}".
Return JSON: { "central": string, "branches": [{ "label": string, "color": string, "children": [{ "label": string, "children": [{ "label": string }]|null }] }] }`;

    const response = await this.resilience.withResilience(
      'openai',
      () => this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      }),
      () => this.openAiFallbackCompletion('{"central":"Unavailable","branches":[]}'),
      { maxAttempts: 3, baseDelayMs: 1000 },
    );

    const tokens = response.usage?.total_tokens ?? 0;
    await this.trackUsage(tenantId, userId, AIModuleType.MIND_MAP, tokens);
    return { mindMap: JSON.parse(response.choices[0].message.content ?? '{}'), tokens };
  }

  async translate(userId: string, tenantId: string, text: string, targetLanguage: string, sourceLanguage = 'auto') {
    await this.checkUsageLimit(tenantId);
    const response = await this.resilience.withResilience(
      'anthropic',
      () => this.anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: 'You are a professional translator. Provide accurate, natural-sounding translations that preserve meaning and context.',
        messages: [{ role: 'user', content: `Translate the following from ${sourceLanguage} to ${targetLanguage}:\n\n${text}` }],
      }),
      () => this.anthropicFallbackMessage('Translation service is temporarily unavailable. Please try again shortly.'),
      { maxAttempts: 3, baseDelayMs: 1000 },
    );

    const translation = (response.content[0]).text;
    const tokens = response.usage.input_tokens + response.usage.output_tokens;
    await this.trackUsage(tenantId, userId, AIModuleType.TRANSLATOR, tokens);
    return { translation, tokens };
  }

  async checkPlagiarism(userId: string, tenantId: string, content: string) {
    const response = await this.resilience.withResilience(
      'anthropic',
      () => this.anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: 'You are an academic integrity checker. Analyze text for signs of plagiarism, AI generation, and unusual writing patterns. Return a JSON analysis.',
        messages: [{
          role: 'user',
          content: `Analyze this text for plagiarism indicators: "${content.substring(0, 3000)}"\nReturn JSON: { "overallScore": number (0-100, 100=likely plagiarized), "aiGenerated": boolean, "flags": string[], "summary": string }`,
        }],
      }),
      () => this.anthropicFallbackMessage('{"overallScore":0,"aiGenerated":false,"flags":[],"summary":"Plagiarism detection temporarily unavailable. Please try again shortly."}'),
      { maxAttempts: 3, baseDelayMs: 1000 },
    );

    const result = (response.content[0]).text;
    const tokens = response.usage.input_tokens + response.usage.output_tokens;
    await this.trackUsage(tenantId, userId, AIModuleType.PLAGIARISM_DETECTION, tokens);
    try {
      return { result: JSON.parse(result), tokens };
    } catch {
      return { result: { overallScore: 0, summary: result }, tokens };
    }
  }

  async moderateContent(tenantId: string, content: string) {
    const response = await this.resilience.withResilience(
      'openai',
      () => this.openai.moderations.create({ input: content }),
      () => ({ results: [{ flagged: false, categories: {} as any, category_scores: {} as any }], id: 'fallback', model: 'fallback' }),
      { maxAttempts: 3, baseDelayMs: 1000 },
    );
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

    const response = await this.resilience.withResilience(
      'openai',
      () => this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 1000,
      }),
      () => this.openAiFallbackCompletion('{"recommendations":[]}'),
      { maxAttempts: 3, baseDelayMs: 1000 },
    );

    const tokens = response.usage?.total_tokens ?? 0;
    await this.trackUsage(tenantId, userId, AIModuleType.RECOMMENDATION, tokens);
    return { recommendations: JSON.parse(response.choices[0].message.content ?? '{}'), tokens };
  }

  async generateCurriculum(userId: string, tenantId: string, subject: string, gradeLevel: string, weeks: number, objectives: string[]) {
    await this.checkUsageLimit(tenantId);
    const prompt = `Design a ${weeks}-week curriculum for "${subject}" at ${gradeLevel} level.
Learning objectives: ${objectives.join('; ')}.
Return valid JSON: { "title": string, "subject": string, "gradeLevel": string, "totalWeeks": number, "weeks": [{ "week": number, "theme": string, "topics": string[], "activities": string[], "assessment": string, "resources": string[] }] }`;

    const response = await this.resilience.withResilience(
      'openai',
      () => this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 4096,
      }),
      () => this.openAiFallbackCompletion('{"title":"Unavailable","weeks":[]}'),
      { maxAttempts: 3, baseDelayMs: 1000 },
    );

    const curriculum = JSON.parse(response.choices[0].message.content ?? '{}');
    const tokens = response.usage?.total_tokens ?? 0;
    await this.trackUsage(tenantId, userId, AIModuleType.CURRICULUM_GENERATOR, tokens);
    return { curriculum, tokens };
  }

  async researchAssist(userId: string, tenantId: string, topic: string, depth: 'overview' | 'detailed' | 'academic', conversationId?: string) {
    await this.checkUsageLimit(tenantId);
    const conversation = await this.getOrCreateConversation(userId, tenantId, AIModuleType.RESEARCH_ASSISTANT, conversationId);
    await this.saveMessage(conversation!.id, 'user', topic);

    const depthInstructions = {
      overview: 'Provide a concise overview with key points and 3-5 reputable sources.',
      detailed: 'Provide an in-depth analysis with subtopics, statistics, key findings, and 8-10 sources.',
      academic: 'Provide an academic-level analysis with methodology, literature review pointers, critical analysis, and 10-15 peer-reviewed sources.',
    };

    const response = await this.resilience.withResilience(
      'anthropic',
      () => this.anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
        max_tokens: 3000,
        system: `You are an expert research assistant. ${depthInstructions[depth]} Always cite sources and distinguish between fact and inference.`,
        messages: [{ role: 'user', content: `Research topic: ${topic}` }],
      }),
      () => this.anthropicFallbackMessage('Research assistant is temporarily unavailable. Please try again shortly.'),
      { maxAttempts: 3, baseDelayMs: 1000 },
    );

    const result = (response.content[0]).text;
    const tokens = response.usage.input_tokens + response.usage.output_tokens;
    await this.saveMessage(conversation!.id, 'assistant', result, tokens);
    await this.trackUsage(tenantId, userId, AIModuleType.RESEARCH_ASSISTANT, tokens);
    return { conversationId: conversation!.id, result, tokens };
  }

  async speechToText(userId: string, tenantId: string, audioBase64: string, language = 'en') {
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const { Readable } = await import('stream');
    const stream = Readable.from(audioBuffer) as any;
    stream.path = 'audio.webm';

    const transcription = await this.resilience.withResilience(
      'openai',
      () => this.openai.audio.transcriptions.create({
        file: stream,
        model: 'whisper-1',
        language,
      }),
      () => ({ text: 'Speech-to-text service temporarily unavailable. Please try again shortly.' }),
      { maxAttempts: 2, baseDelayMs: 1000 },
    );

    await this.trackUsage(tenantId, userId, AIModuleType.SPEECH_TO_TEXT, Math.ceil(transcription.text.length / 4));
    return { transcript: transcription.text, language };
  }

  async textToSpeech(userId: string, tenantId: string, text: string, voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova') {
    const mp3 = await this.resilience.withResilience(
      'openai',
      () => this.openai.audio.speech.create({
        model: 'tts-1',
        voice,
        input: text,
      }),
      undefined,
      { maxAttempts: 2, baseDelayMs: 1000 },
    );

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const tokens = Math.ceil(text.length / 4);
    await this.trackUsage(tenantId, userId, AIModuleType.TEXT_TO_SPEECH, tokens);
    return { audioBase64: buffer.toString('base64'), mimeType: 'audio/mpeg', tokens };
  }

  async getCareerAdvice(userId: string, tenantId: string, interests: string[], skills: string[], educationLevel: string, targetRole?: string) {
    const prompt = `Career counseling request:
Interests: ${interests.join(', ')}
Current skills: ${skills.join(', ')}
Education level: ${educationLevel}
${targetRole ? `Target role: ${targetRole}` : 'No specific target role'}

Provide: 1) Top 5 career paths with match percentage, 2) Required skills gap analysis, 3) 6-month action plan, 4) Relevant certifications/courses.
Return valid JSON: { "careerPaths": [{ "title": string, "match": number, "description": string, "avgSalary": string, "growth": string }], "skillGaps": string[], "actionPlan": [{ "month": number, "goal": string, "actions": string[] }], "certifications": [{ "name": string, "provider": string, "relevance": string }] }`;

    const response = await this.resilience.withResilience(
      'openai',
      () => this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 2048,
      }),
      () => this.openAiFallbackCompletion('{"careerPaths":[],"skillGaps":[],"actionPlan":[],"certifications":[]}'),
      { maxAttempts: 3, baseDelayMs: 1000 },
    );

    const advice = JSON.parse(response.choices[0].message.content ?? '{}');
    const tokens = response.usage?.total_tokens ?? 0;
    await this.trackUsage(tenantId, userId, AIModuleType.CAREER_ADVISOR, tokens);
    return { advice, tokens };
  }

  async predictPerformance(tenantId: string, studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        submissions: { take: 20, orderBy: { submittedAt: 'desc' }, include: { assignment: true } },
        enrollments: true,
      },
    });

    if (!student) {throw new Error('Student not found');}

    const submissions = (student.submissions as any[]);
    const avgScore = submissions.length
      ? submissions.reduce((s: number, sub: any) => s + (sub.score ?? 0), 0) / submissions.length
      : 0;
    const submissionRate = submissions.length > 0
      ? submissions.filter((s: any) => s.status !== 'LATE').length / submissions.length
      : 0;

    const trend = submissions.slice(0, 5).reduce((s: number, sub: any) => s + (sub.score ?? 0), 0) / Math.max(5, submissions.slice(0, 5).length)
      - submissions.slice(5, 10).reduce((s: number, sub: any) => s + (sub.score ?? 0), 0) / Math.max(5, submissions.slice(5, 10).length);

    const prediction = {
      predictedGrade: Math.min(100, Math.max(0, avgScore + trend * 0.5)),
      performanceLevel: avgScore >= 85 ? 'excellent' : avgScore >= 70 ? 'good' : avgScore >= 55 ? 'average' : 'at-risk',
      submissionRate: Math.round(submissionRate * 100),
      trend: trend > 5 ? 'improving' : trend < -5 ? 'declining' : 'stable',
      recommendations: [] as string[],
    };

    if (prediction.performanceLevel === 'at-risk') {prediction.recommendations.push('Schedule one-on-one tutoring sessions');}
    if (prediction.submissionRate < 80) {prediction.recommendations.push('Improve assignment submission consistency');}
    if (prediction.trend === 'declining') {prediction.recommendations.push('Review recent material — performance dropping');}

    return { studentId, prediction };
  }

  async predictDropout(tenantId: string, studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: true,
        submissions: { take: 30, orderBy: { submittedAt: 'desc' } },
      },
    });

    if (!student) {throw new Error('Student not found');}

    const submissions = (student.submissions as any[]);
    const enrollments = (student.enrollments as any[]);

    const missedAssignments = submissions.filter((s: any) => s.status === 'LATE' || !s.score).length;
    const totalAssignments = submissions.length;
    const missedRate = totalAssignments > 0 ? missedAssignments / totalAssignments : 0;

    const avgScore = totalAssignments > 0
      ? submissions.reduce((s: number, sub: any) => s + (sub.score ?? 0), 0) / totalAssignments
      : 50;

    const riskScore = Math.min(100, (missedRate * 50) + (avgScore < 60 ? 30 : 0) + (enrollments.length === 0 ? 20 : 0));
    const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';

    const factors: string[] = [];
    if (missedRate > 0.3) {factors.push(`High assignment miss rate (${Math.round(missedRate * 100)}%)`);}
    if (avgScore < 60) {factors.push('Low average score');}
    if (enrollments.length === 0) {factors.push('No active course enrollments');}

    const interventions: string[] = [];
    if (riskLevel === 'high') {
      interventions.push('Immediate counselor outreach');
      interventions.push('Parent/guardian notification');
      interventions.push('Personalized learning plan');
    } else if (riskLevel === 'medium') {
      interventions.push('Peer mentoring program');
      interventions.push('Weekly check-in schedule');
    }

    return { studentId, riskScore: Math.round(riskScore), riskLevel, factors, interventions };
  }

  async getUsageStats(tenantId: string, period: 'day' | 'week' | 'month' = 'month') {
    const from = new Date();
    if (period === 'day') {from.setDate(from.getDate() - 1);}
    else if (period === 'week') {from.setDate(from.getDate() - 7);}
    else {from.setMonth(from.getMonth() - 1);}

    const usage = await this.prisma.aIUsage.groupBy({
      by: ['module'],
      where: { tenantId, createdAt: { gte: from } },
      _sum: { tokens: true, cost: true },
      _count: { id: true },
    });

    return usage;
  }
}
