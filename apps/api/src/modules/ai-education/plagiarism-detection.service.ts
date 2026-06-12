/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

export interface PlagiarismReport {
  submissionId: string;
  originalityScore: number; // 0-1 (1=fully original)
  plagiarismRisk: 'low' | 'medium' | 'high';
  suspiciousSegments: {
    text: string;
    startIndex: number;
    endIndex: number;
    similarity: number;
  }[];
  aiGeneratedProbability: number; // 0-1
  report: string;
}

interface SubmissionMetadata {
  moderation?: Record<string, unknown>;
  plagiarism?: {
    report: PlagiarismReport;
    checkedAt: string;
  };
}

interface AiDetectionResponse {
  probability: number;
  indicators: string[];
}

@Injectable()
export class PlagiarismDetectionService {
  private readonly logger = new Logger(PlagiarismDetectionService.name);
  private readonly client: Anthropic;

  constructor(private readonly prisma: PrismaService) {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder-key' });
  }

  /**
   * Standard dynamic-programming Levenshtein distance.
   * Strings are truncated to 500 chars for performance.
   */
  levenshteinDistance(a: string, b: string): number {
    const s1 = a.substring(0, 500);
    const s2 = b.substring(0, 500);
    const m = s1.length;
    const n = s2.length;

    // dp[i][j] = edit distance between s1[0..i-1] and s2[0..j-1]
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] =
            1 +
            Math.min(
              dp[i - 1][j],     // deletion
              dp[i][j - 1],     // insertion
              dp[i - 1][j - 1], // substitution
            );
        }
      }
    }

    return dp[m][n];
  }

  private levenshteinSimilarity(a: string, b: string): number {
    if (!a && !b) {return 1;}
    if (!a || !b) {return 0;}
    const maxLength = Math.max(
      Math.min(a.length, 500),
      Math.min(b.length, 500),
    );
    if (maxLength === 0) {return 1;}
    const dist = this.levenshteinDistance(a, b);
    return 1 - dist / maxLength;
  }

  private async detectAiGenerated(text: string): Promise<AiDetectionResponse> {
    try {
      const msg = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content:
              `Analyze this text and estimate the probability it was AI-generated (0-1). ` +
              `Return JSON: { "probability": number, "indicators": string[] }\n\nText:\n${text.substring(0, 3000)}`,
          },
        ],
      });

      const raw = (msg.content[0] as { type: 'text'; text: string }).text;
      const jsonText = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(jsonText) as AiDetectionResponse;
    } catch (err) {
      this.logger.error('AI detection failed', err);
      return { probability: 0, indicators: [] };
    }
  }

  async checkPlagiarism(submissionId: string, tenantId: string): Promise<PlagiarismReport> {
    const submission = await this.prisma.submission.findFirst({
      where: { id: submissionId, student: { school: { tenantId } } },
      include: { assignment: true },
    });

    if (!submission) {
      throw new NotFoundException(`Submission ${submissionId} not found`);
    }

    const content = submission.content ?? '';

    // Fetch other submissions for the same assignment (excluding this one)
    const otherSubmissions = await this.prisma.submission.findMany({
      where: {
        assignmentId: submission.assignmentId,
        id: { not: submissionId },
      },
      select: { id: true, content: true },
    });

    // Compare against other submissions
    const suspiciousSegments: PlagiarismReport['suspiciousSegments'] = [];
    let maxSimilarity = 0;

    for (const other of otherSubmissions) {
      const otherContent = other.content ?? '';
      if (!otherContent) {continue;}

      const similarity = this.levenshteinSimilarity(content, otherContent);
      if (similarity > maxSimilarity) {maxSimilarity = similarity;}

      if (similarity > 0.5) {
        // Find the overlapping window (simple: report the first 200 chars)
        const snip = content.substring(0, 200);
        suspiciousSegments.push({
          text: snip,
          startIndex: 0,
          endIndex: Math.min(content.length, 200),
          similarity,
        });
      }
    }

    // Detect AI-generated probability
    const aiDetection = await this.detectAiGenerated(content);
    const aiGeneratedProbability = aiDetection.probability;

    // Determine risk
    let plagiarismRisk: 'low' | 'medium' | 'high' = 'low';
    if (maxSimilarity > 0.7 || aiGeneratedProbability > 0.8) {
      plagiarismRisk = 'high';
    } else if (maxSimilarity > 0.5 || aiGeneratedProbability > 0.5) {
      plagiarismRisk = 'medium';
    }

    const originalityScore = Math.max(0, 1 - maxSimilarity);

    const reportLines: string[] = [
      `Plagiarism check for submission ${submissionId}`,
      `Originality score: ${(originalityScore * 100).toFixed(1)}%`,
      `Risk level: ${plagiarismRisk}`,
      `AI-generated probability: ${(aiGeneratedProbability * 100).toFixed(1)}%`,
    ];

    if (aiDetection.indicators.length > 0) {
      reportLines.push(`AI indicators: ${aiDetection.indicators.join(', ')}`);
    }

    if (suspiciousSegments.length > 0) {
      reportLines.push(`${suspiciousSegments.length} suspicious segment(s) found with similarity > 50%.`);
    }

    const report: PlagiarismReport = {
      submissionId,
      originalityScore,
      plagiarismRisk,
      suspiciousSegments,
      aiGeneratedProbability,
      report: reportLines.join('\n'),
    };

    // Persist to submission metadata
    const existingMeta = (submission.metadata ?? {}) as SubmissionMetadata;
    const updatedMeta: SubmissionMetadata = {
      ...existingMeta,
      plagiarism: {
        report,
        checkedAt: new Date().toISOString(),
      },
    };

    await this.prisma.submission.update({
      where: { id: submissionId },
      data: { metadata: updatedMeta as Prisma.InputJsonValue },
    });

    if (plagiarismRisk === 'high') {
      this.logger.warn(
        `High plagiarism risk detected for submission ${submissionId}: maxSimilarity=${maxSimilarity.toFixed(2)}, aiProb=${aiGeneratedProbability.toFixed(2)}`,
      );
    }

    return report;
  }

  async getBatchReport(tenantId: string, assignmentId: string): Promise<PlagiarismReport[]> {
    const submissions = await this.prisma.submission.findMany({
      where: {
        assignmentId,
        student: { school: { tenantId } },
      },
      select: { id: true },
    });

    if (submissions.length === 0) {
      return [];
    }

    const reports: PlagiarismReport[] = [];

    for (const sub of submissions) {
      try {
        const report = await this.checkPlagiarism(sub.id, tenantId);
        reports.push(report);
      } catch (err) {
        this.logger.error(`Failed to check plagiarism for submission ${sub.id}`, err);
      }
    }

    return reports;
  }
}
