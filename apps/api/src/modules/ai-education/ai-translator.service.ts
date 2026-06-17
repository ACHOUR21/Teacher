/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AIModuleType } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

interface ClaudeTranslationResponse {
  translatedText: string;
  sourceLanguage: string;
  confidence: number;
}

@Injectable()
export class AiTranslatorService {
  private readonly logger = new Logger(AiTranslatorService.name);
  private readonly anthropic: Anthropic;

  private readonly SYSTEM_PROMPT =
    'You are a professional translator. Translate the given text accurately. ' +
    'Return ONLY valid JSON: { "translatedText": string, "sourceLanguage": string, "confidence": number }';

  constructor(private readonly prisma: PrismaService) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder-key',
    });
  }

  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
  ): Promise<TranslationResult> {
    const langInstruction = sourceLanguage
      ? `Translate from ${sourceLanguage} to ${targetLanguage}.`
      : `Auto-detect the source language and translate to ${targetLanguage}.`;

    const userPrompt = `${langInstruction}\n\nText to translate:\n${text}`;

    let parsed: ClaudeTranslationResponse;
    try {
      const msg = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: this.SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const raw = (msg.content[0] as { type: 'text'; text: string }).text;
      // Strip potential markdown code fences
      const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(clean) as ClaudeTranslationResponse;
    } catch (err) {
      this.logger.error('Translation failed', err);
      parsed = {
        translatedText: text,
        sourceLanguage: sourceLanguage ?? 'Unknown',
        confidence: 0,
      };
    }

    // Store conversation
    try {
      await this.prisma.aIConversation.create({
        data: {
          tenantId: 'system',
          userId: 'system',
          module: AIModuleType.TRANSLATOR,
          title: `Translate to ${targetLanguage}`,
          context: { text, targetLanguage, result: parsed } as object,
        },
      });
    } catch (err) {
      this.logger.warn('Failed to store translator conversation', err);
    }

    return {
      originalText: text,
      translatedText: parsed.translatedText,
      sourceLanguage: parsed.sourceLanguage,
      targetLanguage,
      confidence: parsed.confidence,
    };
  }

  async translateCourseContent(
    courseId: string,
    tenantId: string,
    targetLanguage: string,
  ): Promise<{ title: string; description: string }> {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, tenantId },
      select: { title: true, description: true },
    });

    if (!course) {
      throw new NotFoundException(`Course ${courseId} not found`);
    }

    const [titleResult, descriptionResult] = await Promise.all([
      this.translateText(course.title, targetLanguage),
      this.translateText(course.description ?? '', targetLanguage),
    ]);

    return {
      title: titleResult.translatedText,
      description: descriptionResult.translatedText,
    };
  }

  getSupportedLanguages(): string[] {
    return [
      'English',
      'Spanish',
      'French',
      'German',
      'Arabic',
      'Chinese',
      'Japanese',
      'Portuguese',
      'Hindi',
      'Russian',
      'Italian',
      'Korean',
      'Dutch',
      'Turkish',
      'Polish',
    ];
  }
}
