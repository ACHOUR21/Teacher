"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AiTtsService = void 0;
var _common = require("@nestjs/common");
var _prisma = require("../database/prisma.service");
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
var AiTtsService_1;
let AiTtsService = exports.AiTtsService = AiTtsService_1 = class AiTtsService {
  logger = new _common.Logger(AiTtsService_1.name);
  constructor(prisma) {
    this.prisma = prisma;
  }
  /**
   * Wrap text in SSML markup using prosody and optional emphasis.
   */
  generateSsml(text, options = {}) {
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
  async convertLessonToAudio(lessonId, tenantId) {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId
      },
      select: {
        title: true,
        description: true,
        contentUrl: true
      }
    });
    if (!lesson) {
      throw new _common.NotFoundException(`Lesson ${lessonId} not found`);
    }
    const raw = `${lesson.title}. ${lesson.description ?? ''}`;
    const plainText = this.stripHtml(raw);
    const ssml = this.generateSsml(plainText);
    this.logger.log(`Generated SSML for lesson ${lessonId} (${plainText.length} chars)`);
    return {
      ssml,
      text: plainText,
      voiceSettings: {
        rate: 1.0,
        pitch: 0,
        volume: 1.0
      }
    };
  }
  /**
   * Strip HTML tags and decode common HTML entities.
   */
  stripHtml(html) {
    // Replace tags with spaces
    let text = html.replace(/<[^>]*>/g, ' ');
    // Decode common entities
    text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    // Collapse whitespace
    return text.replace(/\s+/g, ' ').trim();
  }
  // ─── Private helpers ─────────────────────────────────────────────────────────
  escapeXml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }
};
exports.AiTtsService = AiTtsService = AiTtsService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], AiTtsService);