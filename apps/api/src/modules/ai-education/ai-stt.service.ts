/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

import { PrismaService } from '../database/prisma.service';

export interface TranscriptionResult {
  text: string;
  confidence: number;
  words?: { word: string; start: number; end: number }[];
  language?: string;
}

@Injectable()
export class AiSttService {
  private readonly logger = new Logger(AiSttService.name);
  private readonly anthropic: Anthropic;

  constructor(private readonly prisma: PrismaService) {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder-key',
    });
  }

  /**
   * Attempt to transcribe audio via Claude.
   * Claude does not natively process audio files, so we inform the caller to
   * integrate OpenAI Whisper for production use.
   */
  async transcribeAudio(
    audioBase64: string,
    mimeType: string,
    language?: string,
  ): Promise<TranscriptionResult> {
    const langHint = language ? ` The audio is in ${language}.` : '';
    const prompt =
      `Please transcribe the following audio content accurately.${langHint} ` +
      `If you cannot process audio, return valid JSON: ` +
      `{ "text": "Audio transcription requires OpenAI Whisper integration", "confidence": 0 }`;

    let result: TranscriptionResult;
    try {
      const msg = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              // Claude does not support audio documents natively — include
              // the base64 data only as metadata so the model is aware of
              // the request context while returning the fallback JSON.
              {
                type: 'text',
                text: `[Audio data provided: ${mimeType}, ${Math.round(audioBase64.length * 0.75 / 1024)} KB]`,
              },
            ],
          },
        ],
      });

      const raw = (msg.content[0] as { type: 'text'; text: string }).text;
      const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

      // Try to parse as JSON; if it fails treat the whole response as transcription text
      try {
        const parsed = JSON.parse(clean) as { text: string; confidence: number; words?: { word: string; start: number; end: number }[]; language?: string };
        result = {
          text: parsed.text,
          confidence: parsed.confidence,
          words: parsed.words,
          language: parsed.language ?? language,
        };
      } catch {
        // Claude returned plain text — treat as transcription
        result = {
          text: raw.trim(),
          confidence: 0.5,
          language,
        };
      }
    } catch (err) {
      this.logger.error('STT transcription failed', err);
      result = {
        text: 'Audio transcription requires OpenAI Whisper integration',
        confidence: 0,
        language,
      };
    }

    return result;
  }

  /**
   * Fetch a submission's file URL and return a placeholder transcription
   * result with instructions to integrate Whisper.
   */
  async transcribeSubmission(submissionId: string): Promise<TranscriptionResult> {
    const submission = await this.prisma.submission.findFirst({
      where: { id: submissionId },
      select: { attachments: true },
    });

    if (!submission) {
      throw new NotFoundException(`Submission ${submissionId} not found`);
    }

    const fileUrl = submission.attachments?.[0] ?? null;

    this.logger.log(
      `Transcription requested for submission ${submissionId}, fileUrl: ${fileUrl ?? 'none'}`,
    );

    return {
      text: `Transcription for submission ${submissionId} requires OpenAI Whisper integration. File: ${fileUrl ?? 'no attachment'}`,
      confidence: 0,
    };
  }

  /**
   * Generate a WebVTT subtitle file from plain text.
   * Splits the text into ~7-second chunks and estimates timestamps.
   */
  generateTranscriptVtt(text: string, estimatedDurationSeconds: number): string {
    const CHUNK_DURATION = 7; // seconds per cue
    const words = text.split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      return 'WEBVTT\n\n';
    }

    const totalWords = words.length;
    const numChunks = Math.max(1, Math.ceil(estimatedDurationSeconds / CHUNK_DURATION));
    const wordsPerChunk = Math.ceil(totalWords / numChunks);

    const lines: string[] = ['WEBVTT', ''];

    let cueIndex = 1;
    let wordIndex = 0;
    let startSeconds = 0;

    while (wordIndex < totalWords) {
      const chunkWords = words.slice(wordIndex, wordIndex + wordsPerChunk);
      const endSeconds = Math.min(
        startSeconds + CHUNK_DURATION,
        estimatedDurationSeconds,
      );

      lines.push(String(cueIndex));
      lines.push(`${this.formatVttTime(startSeconds)} --> ${this.formatVttTime(endSeconds)}`);
      lines.push(chunkWords.join(' '));
      lines.push('');

      wordIndex += wordsPerChunk;
      startSeconds = endSeconds;
      cueIndex++;
    }

    return lines.join('\n');
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private formatVttTime(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    const ms = Math.round((totalSeconds % 1) * 1000);
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    const mmm = String(ms).padStart(3, '0');
    return `${hh}:${mm}:${ss}.${mmm}`;
  }
}
