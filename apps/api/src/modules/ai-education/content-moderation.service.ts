/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

export interface ModerationResult {
  safe: boolean;
  flagged: boolean;
  categories: {
    hate: boolean;
    harassment: boolean;
    selfHarm: boolean;
    sexual: boolean;
    violence: boolean;
    spam: boolean;
  };
  confidence: number; // 0-1
  reason?: string;
  action: 'allow' | 'flag' | 'block';
}

interface SubmissionMetadata {
  moderation?: {
    result: ModerationResult;
    moderatedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    approved?: boolean;
    reviewNote?: string;
  };
  plagiarism?: Record<string, unknown>;
}

@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name);
  private readonly client: Anthropic;

  private readonly SYSTEM_PROMPT =
    'You are a content safety classifier for an educational platform. Classify the following text. ' +
    'Return ONLY valid JSON: { "safe": boolean, "flagged": boolean, "categories": { "hate": boolean, "harassment": boolean, "selfHarm": boolean, "sexual": boolean, "violence": boolean, "spam": boolean }, "confidence": number, "reason": string, "action": "allow"|"flag"|"block" }';

  constructor(private readonly prisma: PrismaService) {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder-key' });
  }

  async moderateContent(
    text: string,
    context?: 'submission' | 'message' | 'comment' | 'course',
  ): Promise<ModerationResult> {
    const contextHint = context ? ` Context: ${context}.` : '';
    const userMessage = `${contextHint}\n\nText to classify:\n${text.substring(0, 4000)}`;

    try {
      const msg = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: this.SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      });

      const raw = (msg.content[0] as { type: 'text'; text: string }).text;

      // Strip markdown code fences if present
      const jsonText = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

      const result = JSON.parse(jsonText) as ModerationResult;
      return result;
    } catch (err) {
      this.logger.error('Content moderation failed', err);
      // Safe fallback — don't block content on AI error
      return {
        safe: true,
        flagged: false,
        categories: {
          hate: false,
          harassment: false,
          selfHarm: false,
          sexual: false,
          violence: false,
          spam: false,
        },
        confidence: 0,
        reason: 'Moderation service temporarily unavailable',
        action: 'allow',
      };
    }
  }

  async moderateSubmission(submissionId: string, tenantId: string): Promise<ModerationResult> {
    const submission = await this.prisma.submission.findFirst({
      where: { id: submissionId, student: { school: { tenantId } } },
    });

    if (!submission) {
      throw new NotFoundException(`Submission ${submissionId} not found`);
    }

    const text = submission.content ?? (submission.attachments ?? []).join(' ');
    const result = await this.moderateContent(text, 'submission');

    const existingMeta = (submission.metadata ?? {}) as SubmissionMetadata;
    const updatedMeta: SubmissionMetadata = {
      ...existingMeta,
      moderation: {
        result,
        moderatedAt: new Date().toISOString(),
      },
    };

    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { metadata: updatedMeta as Prisma.InputJsonValue },
    });

    if (result.flagged || result.action !== 'allow') {
      this.logger.warn(
        `Submission ${submissionId} flagged by moderation: action=${result.action}, reason=${result.reason ?? 'N/A'}`,
      );
      // Emit event placeholder — in production wire to EventEmitter2/BullMQ
      // this.eventEmitter.emit('moderation.flagged', { submissionId, tenantId, result });
    }

    return result;
  }

  async getModerationQueue(
    tenantId: string,
    status?: 'pending' | 'reviewed',
  ): Promise<Array<{ submissionId: string; result: ModerationResult; moderatedAt: string; reviewed: boolean }>> {
    const submissions = await this.prisma.submission.findMany({
      where: { student: { school: { tenantId } } },
      select: { id: true, metadata: true },
    });

    const queue: Array<{ submissionId: string; result: ModerationResult; moderatedAt: string; reviewed: boolean }> = [];

    for (const sub of submissions) {
      const meta = (sub.metadata ?? {}) as SubmissionMetadata;
      if (!meta.moderation) {continue;}

      const { result, moderatedAt, reviewedAt } = meta.moderation;
      if (!result.flagged && result.action === 'allow') {continue;}

      const reviewed = Boolean(reviewedAt);

      if (status === 'pending' && reviewed) {continue;}
      if (status === 'reviewed' && !reviewed) {continue;}

      queue.push({ submissionId: sub.id, result, moderatedAt, reviewed });
    }

    return queue;
  }

  async reviewModeration(
    tenantId: string,
    submissionId: string,
    adminUserId: string,
    approved: boolean,
    note?: string,
  ): Promise<{ success: boolean }> {
    const submission = await this.prisma.submission.findFirst({
      where: { id: submissionId, student: { school: { tenantId } } },
    });

    if (!submission) {
      throw new NotFoundException(`Submission ${submissionId} not found`);
    }

    const meta = (submission.metadata ?? {}) as SubmissionMetadata;

    if (!meta.moderation) {
      throw new NotFoundException(`No moderation record found for submission ${submissionId}`);
    }

    const updatedMeta: SubmissionMetadata = {
      ...meta,
      moderation: {
        ...meta.moderation,
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminUserId,
        approved,
        reviewNote: note,
      },
    };

    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { metadata: updatedMeta as Prisma.InputJsonValue },
    });

    this.logger.log(
      `Submission ${submissionId} moderation reviewed by ${adminUserId}: ${approved ? 'approved' : 'rejected'}`,
    );

    return { success: true };
  }
}
