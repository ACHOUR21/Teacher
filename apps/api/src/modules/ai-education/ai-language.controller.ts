import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../core/decorators/current-user.decorator';
import { AiTranslatorService } from './ai-translator.service';
import { AiTtsService } from './ai-tts.service';
import { AiSttService } from './ai-stt.service';

// ─── DTOs ────────────────────────────────────────────────────────────────────

class TranslateTextDto {
  @IsString()
  text: string;

  @IsString()
  targetLanguage: string;

  @IsOptional()
  @IsString()
  sourceLanguage?: string;
}

class TranslateCourseDto {
  @IsString()
  targetLanguage: string;
}

class GenerateSsmlDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  rate?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  pitch?: number;

  @IsOptional()
  @IsEnum(['strong', 'moderate', 'reduced'])
  emphasis?: 'strong' | 'moderate' | 'reduced';
}

class TranscribeAudioDto {
  @IsString()
  audioBase64: string;

  @IsString()
  mimeType: string;

  @IsOptional()
  @IsString()
  language?: string;
}

// ─── Controller ──────────────────────────────────────────────────────────────

@ApiTags('AI Language')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('ai/language')
export class AiLanguageController {
  constructor(
    private readonly translatorService: AiTranslatorService,
    private readonly ttsService: AiTtsService,
    private readonly sttService: AiSttService,
  ) {}

  /**
   * POST /ai/language/translate
   * Translate arbitrary text to a target language.
   */
  @Post('translate')
  @ApiOperation({ summary: 'Translate text to a target language' })
  translateText(@Body() dto: TranslateTextDto) {
    return this.translatorService.translateText(
      dto.text,
      dto.targetLanguage,
      dto.sourceLanguage,
    );
  }

  /**
   * POST /ai/language/translate-course/:courseId
   * Translate a course title and description.
   */
  @Post('translate-course/:courseId')
  @ApiOperation({ summary: 'Translate course title and description' })
  translateCourse(
    @Param('courseId') courseId: string,
    @Body() dto: TranslateCourseDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.translatorService.translateCourseContent(
      courseId,
      user.tenantId,
      dto.targetLanguage,
    );
  }

  /**
   * GET /ai/language/supported-languages
   * Return the list of languages supported by the translator.
   */
  @Get('supported-languages')
  @ApiOperation({ summary: 'List supported translation languages' })
  getSupportedLanguages() {
    return { languages: this.translatorService.getSupportedLanguages() };
  }

  /**
   * POST /ai/language/tts/ssml
   * Generate SSML markup for browser TTS.
   */
  @Post('tts/ssml')
  @ApiOperation({ summary: 'Generate SSML markup for browser TTS' })
  generateSsml(@Body() dto: GenerateSsmlDto) {
    const ssml = this.ttsService.generateSsml(dto.text, {
      rate: dto.rate,
      pitch: dto.pitch,
      emphasis: dto.emphasis,
    });
    return { ssml, text: dto.text };
  }

  /**
   * POST /ai/language/tts/lesson/:lessonId
   * Convert a lesson's text content to SSML / audio-ready output.
   */
  @Post('tts/lesson/:lessonId')
  @ApiOperation({ summary: 'Convert lesson content to TTS output' })
  convertLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.ttsService.convertLessonToAudio(lessonId, user.tenantId);
  }

  /**
   * POST /ai/language/stt/transcribe
   * Transcribe base64-encoded audio.
   */
  @Post('stt/transcribe')
  @ApiOperation({ summary: 'Transcribe audio from base64 input' })
  transcribeAudio(@Body() dto: TranscribeAudioDto) {
    return this.sttService.transcribeAudio(
      dto.audioBase64,
      dto.mimeType,
      dto.language,
    );
  }

  /**
   * GET /ai/language/stt/vtt
   * Generate a WebVTT subtitle file from plain text.
   * Query params: text, durationSeconds
   */
  @Get('stt/vtt')
  @ApiOperation({ summary: 'Generate WebVTT from plain text' })
  generateVtt(
    @Query('text') text: string,
    @Query('durationSeconds') durationSeconds: string,
  ) {
    const duration = parseFloat(durationSeconds ?? '60');
    const vtt = this.sttService.generateTranscriptVtt(text ?? '', duration);
    return { vtt };
  }
}
