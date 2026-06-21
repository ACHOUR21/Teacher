"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AiTranslatorService = void 0;
var _common = require("@nestjs/common");
var _sdk = _interopRequireDefault(require("@anthropic-ai/sdk"));
var _client = require("@prisma/client");
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
var AiTranslatorService_1;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

let AiTranslatorService = exports.AiTranslatorService = AiTranslatorService_1 = class AiTranslatorService {
  logger = new _common.Logger(AiTranslatorService_1.name);
  anthropic;
  SYSTEM_PROMPT = 'You are a professional translator. Translate the given text accurately. ' + 'Return ONLY valid JSON: { "translatedText": string, "sourceLanguage": string, "confidence": number }';
  constructor(prisma) {
    this.prisma = prisma;
    this.anthropic = new _sdk.default({
      apiKey: process.env.ANTHROPIC_API_KEY ?? 'placeholder-key'
    });
  }
  async translateText(text, targetLanguage, sourceLanguage) {
    const langInstruction = sourceLanguage ? `Translate from ${sourceLanguage} to ${targetLanguage}.` : `Auto-detect the source language and translate to ${targetLanguage}.`;
    const userPrompt = `${langInstruction}\n\nText to translate:\n${text}`;
    let parsed;
    try {
      const msg = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: this.SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: userPrompt
        }]
      });
      const raw = msg.content[0].text;
      // Strip potential markdown code fences
      const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(clean);
    } catch (err) {
      this.logger.error('Translation failed', err);
      parsed = {
        translatedText: text,
        sourceLanguage: sourceLanguage ?? 'Unknown',
        confidence: 0
      };
    }
    // Store conversation
    try {
      await this.prisma.aIConversation.create({
        data: {
          tenantId: 'system',
          userId: 'system',
          module: _client.AIModuleType.TRANSLATOR,
          title: `Translate to ${targetLanguage}`,
          context: {
            text,
            targetLanguage,
            result: parsed
          }
        }
      });
    } catch (err) {
      this.logger.warn('Failed to store translator conversation', err);
    }
    return {
      originalText: text,
      translatedText: parsed.translatedText,
      sourceLanguage: parsed.sourceLanguage,
      targetLanguage,
      confidence: parsed.confidence
    };
  }
  async translateCourseContent(courseId, tenantId, targetLanguage) {
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        tenantId
      },
      select: {
        title: true,
        description: true
      }
    });
    if (!course) {
      throw new _common.NotFoundException(`Course ${courseId} not found`);
    }
    const [titleResult, descriptionResult] = await Promise.all([this.translateText(course.title, targetLanguage), this.translateText(course.description ?? '', targetLanguage)]);
    return {
      title: titleResult.translatedText,
      description: descriptionResult.translatedText
    };
  }
  getSupportedLanguages() {
    return ['English', 'Spanish', 'French', 'German', 'Arabic', 'Chinese', 'Japanese', 'Portuguese', 'Hindi', 'Russian', 'Italian', 'Korean', 'Dutch', 'Turkish', 'Polish'];
  }
};
exports.AiTranslatorService = AiTranslatorService = AiTranslatorService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], AiTranslatorService);