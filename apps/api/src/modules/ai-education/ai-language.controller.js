"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AiLanguageController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _classValidator = require("class-validator");
var _classTransformer = require("class-transformer");
var _jwtAuth = require("../core/guards/jwt-auth.guard");
var _currentUser = require("../core/decorators/current-user.decorator");
var _aiTranslator = require("./ai-translator.service");
var _aiTts = require("./ai-tts.service");
var _aiStt = require("./ai-stt.service");
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
var _a, _b;
// ─── DTOs ────────────────────────────────────────────────────────────────────
class TranslateTextDto {
  text;
  targetLanguage;
  sourceLanguage;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], TranslateTextDto.prototype, "text", void 0);
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], TranslateTextDto.prototype, "targetLanguage", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], TranslateTextDto.prototype, "sourceLanguage", void 0);
class TranslateCourseDto {
  targetLanguage;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], TranslateCourseDto.prototype, "targetLanguage", void 0);
class GenerateSsmlDto {
  text;
  rate;
  pitch;
  emphasis;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], GenerateSsmlDto.prototype, "text", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsNumber)(), (0, _classTransformer.Type)(() => Number), __metadata("design:type", Number)], GenerateSsmlDto.prototype, "rate", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsNumber)(), (0, _classTransformer.Type)(() => Number), __metadata("design:type", Number)], GenerateSsmlDto.prototype, "pitch", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsEnum)(['strong', 'moderate', 'reduced']), __metadata("design:type", String)], GenerateSsmlDto.prototype, "emphasis", void 0);
class TranscribeAudioDto {
  audioBase64;
  mimeType;
  language;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], TranscribeAudioDto.prototype, "audioBase64", void 0);
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], TranscribeAudioDto.prototype, "mimeType", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], TranscribeAudioDto.prototype, "language", void 0);
// ─── Controller ──────────────────────────────────────────────────────────────
let AiLanguageController = exports.AiLanguageController = class AiLanguageController {
  constructor(translatorService, ttsService, sttService) {
    this.translatorService = translatorService;
    this.ttsService = ttsService;
    this.sttService = sttService;
  }
  /**
   * POST /ai/language/translate
   * Translate arbitrary text to a target language.
   */
  translateText(dto) {
    return this.translatorService.translateText(dto.text, dto.targetLanguage, dto.sourceLanguage);
  }
  /**
   * POST /ai/language/translate-course/:courseId
   * Translate a course title and description.
   */
  translateCourse(courseId, dto, user) {
    return this.translatorService.translateCourseContent(courseId, user.tenantId, dto.targetLanguage);
  }
  /**
   * GET /ai/language/supported-languages
   * Return the list of languages supported by the translator.
   */
  getSupportedLanguages() {
    return {
      languages: this.translatorService.getSupportedLanguages()
    };
  }
  /**
   * POST /ai/language/tts/ssml
   * Generate SSML markup for browser TTS.
   */
  generateSsml(dto) {
    const ssml = this.ttsService.generateSsml(dto.text, {
      rate: dto.rate,
      pitch: dto.pitch,
      emphasis: dto.emphasis
    });
    return {
      ssml,
      text: dto.text
    };
  }
  /**
   * POST /ai/language/tts/lesson/:lessonId
   * Convert a lesson's text content to SSML / audio-ready output.
   */
  convertLesson(lessonId, user) {
    return this.ttsService.convertLessonToAudio(lessonId, user.tenantId);
  }
  /**
   * POST /ai/language/stt/transcribe
   * Transcribe base64-encoded audio.
   */
  transcribeAudio(dto) {
    return this.sttService.transcribeAudio(dto.audioBase64, dto.mimeType, dto.language);
  }
  /**
   * GET /ai/language/stt/vtt
   * Generate a WebVTT subtitle file from plain text.
   * Query params: text, durationSeconds
   */
  generateVtt(text, durationSeconds) {
    const duration = parseFloat(durationSeconds ?? '60');
    const vtt = this.sttService.generateTranscriptVtt(text ?? '', duration);
    return {
      vtt
    };
  }
};
__decorate([(0, _common.Post)('translate'), (0, _swagger.ApiOperation)({
  summary: 'Translate text to a target language'
}), __param(0, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [TranslateTextDto]), __metadata("design:returntype", void 0)], AiLanguageController.prototype, "translateText", null);
__decorate([(0, _common.Post)('translate-course/:courseId'), (0, _swagger.ApiOperation)({
  summary: 'Translate course title and description'
}), __param(0, (0, _common.Param)('courseId')), __param(1, (0, _common.Body)()), __param(2, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, TranslateCourseDto, typeof (_a = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _a : Object]), __metadata("design:returntype", void 0)], AiLanguageController.prototype, "translateCourse", null);
__decorate([(0, _common.Get)('supported-languages'), (0, _swagger.ApiOperation)({
  summary: 'List supported translation languages'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], AiLanguageController.prototype, "getSupportedLanguages", null);
__decorate([(0, _common.Post)('tts/ssml'), (0, _swagger.ApiOperation)({
  summary: 'Generate SSML markup for browser TTS'
}), __param(0, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [GenerateSsmlDto]), __metadata("design:returntype", void 0)], AiLanguageController.prototype, "generateSsml", null);
__decorate([(0, _common.Post)('tts/lesson/:lessonId'), (0, _swagger.ApiOperation)({
  summary: 'Convert lesson content to TTS output'
}), __param(0, (0, _common.Param)('lessonId')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_b = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _b : Object]), __metadata("design:returntype", void 0)], AiLanguageController.prototype, "convertLesson", null);
__decorate([(0, _common.Post)('stt/transcribe'), (0, _swagger.ApiOperation)({
  summary: 'Transcribe audio from base64 input'
}), __param(0, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [TranscribeAudioDto]), __metadata("design:returntype", void 0)], AiLanguageController.prototype, "transcribeAudio", null);
__decorate([(0, _common.Get)('stt/vtt'), (0, _swagger.ApiOperation)({
  summary: 'Generate WebVTT from plain text'
}), __param(0, (0, _common.Query)('text')), __param(1, (0, _common.Query)('durationSeconds')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], AiLanguageController.prototype, "generateVtt", null);
exports.AiLanguageController = AiLanguageController = __decorate([(0, _swagger.ApiTags)('AI Language'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Controller)('ai/language'), __param(0, (0, _common.Inject)(_aiTranslator.AiTranslatorService)), __param(1, (0, _common.Inject)(_aiTts.AiTtsService)), __param(2, (0, _common.Inject)(_aiStt.AiSttService)), __metadata("design:paramtypes", [Object, Object, Object])], AiLanguageController);