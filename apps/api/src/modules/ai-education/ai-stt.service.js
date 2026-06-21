"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AiSttService = void 0;
var _common = require("@nestjs/common");
var _sdk = _interopRequireDefault(require("@anthropic-ai/sdk"));
var _prisma = require("../database/prisma.service");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
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
var AiSttService_1;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

let AiSttService = exports.AiSttService = AiSttService_1 = class AiSttService {
  logger = new _common.Logger(AiSttService_1.name);
  anthropic;
  constructor(prisma) {
    this.prisma = prisma;
    this.anthropic = new _sdk.default({
      apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder-key'
    });
  }
  /**
   * Attempt to transcribe audio via Claude.
   * Claude does not natively process audio files, so we inform the caller to
   * integrate OpenAI Whisper for production use.
   */
  async transcribeAudio(audioBase64, mimeType, language) {
    const langHint = language ? ` The audio is in ${language}.` : '';
    const prompt = `Please transcribe the following audio content accurately.${langHint} ` + `If you cannot process audio, return valid JSON: ` + `{ "text": "Audio transcription requires OpenAI Whisper integration", "confidence": 0 }`;
    let result;
    try {
      const msg = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [{
            type: 'text',
            text: prompt
          },
          // Claude does not support audio documents natively — include
          // the base64 data only as metadata so the model is aware of
          // the request context while returning the fallback JSON.
          {
            type: 'text',
            text: `[Audio data provided: ${mimeType}, ${Math.round(audioBase64.length * 0.75 / 1024)} KB]`
          }]
        }]
      });
      const raw = msg.content[0].text;
      const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      // Try to parse as JSON; if it fails treat the whole response as transcription text
      try {
        const parsed = JSON.parse(clean);
        result = {
          text: parsed.text,
          confidence: parsed.confidence,
          words: parsed.words,
          language: parsed.language ?? language
        };
      } catch {
        // Claude returned plain text — treat as transcription
        result = {
          text: raw.trim(),
          confidence: 0.5,
          language
        };
      }
    } catch (err) {
      this.logger.error('STT transcription failed', err);
      result = {
        text: 'Audio transcription requires OpenAI Whisper integration',
        confidence: 0,
        language
      };
    }
    return result;
  }
  /**
   * Fetch a submission's file URL and return a placeholder transcription
   * result with instructions to integrate Whisper.
   */
  async transcribeSubmission(submissionId) {
    const submission = await this.prisma.submission.findFirst({
      where: {
        id: submissionId
      },
      select: {
        attachments: true
      }
    });
    if (!submission) {
      throw new _common.NotFoundException(`Submission ${submissionId} not found`);
    }
    const fileUrl = submission.attachments?.[0] ?? null;
    this.logger.log(`Transcription requested for submission ${submissionId}, fileUrl: ${fileUrl ?? 'none'}`);
    return {
      text: `Transcription for submission ${submissionId} requires OpenAI Whisper integration. File: ${fileUrl ?? 'no attachment'}`,
      confidence: 0
    };
  }
  /**
   * Generate a WebVTT subtitle file from plain text.
   * Splits the text into ~7-second chunks and estimates timestamps.
   */
  generateTranscriptVtt(text, estimatedDurationSeconds) {
    const CHUNK_DURATION = 7; // seconds per cue
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return 'WEBVTT\n\n';
    }
    const totalWords = words.length;
    const numChunks = Math.max(1, Math.ceil(estimatedDurationSeconds / CHUNK_DURATION));
    const wordsPerChunk = Math.ceil(totalWords / numChunks);
    const lines = ['WEBVTT', ''];
    let cueIndex = 1;
    let wordIndex = 0;
    let startSeconds = 0;
    while (wordIndex < totalWords) {
      const chunkWords = words.slice(wordIndex, wordIndex + wordsPerChunk);
      const endSeconds = Math.min(startSeconds + CHUNK_DURATION, estimatedDurationSeconds);
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
  formatVttTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor(totalSeconds % 3600 / 60);
    const s = Math.floor(totalSeconds % 60);
    const ms = Math.round(totalSeconds % 1 * 1000);
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    const mmm = String(ms).padStart(3, '0');
    return `${hh}:${mm}:${ss}.${mmm}`;
  }
};
exports.AiSttService = AiSttService = AiSttService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], AiSttService);