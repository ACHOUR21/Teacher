import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

export interface TtsResult {
  audioUrl?: string; // if stored to S3
  ssml: string; // SSML markup for browser TTS
  text: string;
  voiceSettings: { rate: number; pitch: number; volume: number };
}

export interface TtsOptions {
  rate?: number;
  pitch?: number;
  emphasis?: 'strong' | 'moderate' | 'reduced';
  volume?: number;
}

@Injectable()
export class AiTtsService {
  private readonly logger = new Logger(AiTtsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Wrap text in SSML markup using prosody and optional emphasis.
   */
  generateSsml(text: string, options: TtsOptions = {}): string {
    const rate = options.rate ?? 1.0;
    const pitch = options.pitch ?? 0;
    const volume = options.volume ?? 1.0;
    const emphasis = options.emphasis;

    // Format rate as percentage relative to normal
    const ratePercent = rate === 1.0 ? 'medium' : `${Math.round(rate * 100)}%`;
    // Format pitch as semitones (positive = higher)
    const pitchSt = pitch === 0 ? 'medium' : `${pitch > 0 ? '+' : ''}${pitch}st`;
    // Format volume as dB or named level
    const volumeLevel = volume === 1.0 ? 'medium' : `${Math.round((volume - 1) * 6)}dB`;

    let inner = this.escapeXml(text);

    if (emphasis) {
      inner = `<emphasis level="${emphasis}">${inner}</emphasis>`;
    }

    return `<speak><prosody rate="${ratePercent}" pitch="${pitchSt}" volume="${volumeLevel}">${inner}</prosody></speak>`;
  }

  /**
   * Fetch lesson content, strip HTML, and produce a TtsResult with SSML.
   */
  async convertLessonToAudio(lessonId: string, tenantId: string): Promise<TtsResult> {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId },
      select: { title: true, description: true, contentUrl: true },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson ${lessonId} not found`);
    }

    const raw = `${lesson.title}. ${lesson.description ?? ''}`;
    const plainText = this.stripHtml(raw);
    const ssml = this.generateSsml(plainText);

    this.logger.log(`Generated SSML for lesson ${lessonId} (${plainText.length} chars)`);

    return {
      ssml,
      text: plainText,
      voiceSettings: { rate: 1.0, pitch: 0, volume: 1.0 },
    };
  }

  /**
   * Strip HTML tags and decode common HTML entities.
   */
  stripHtml(html: string): string {
    // Replace tags with spaces
    let text = html.replace(/<[^>]*>/g, ' ');
    // Decode common entities
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    // Collapse whitespace
    return text.replace(/\s+/g, ' ').trim();
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
