import { Controller, Post, Get, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsArray, Min, Max } from 'class-validator';
import { AiService } from '../../ai.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';

class TutorChatDto {
  @IsString() message: string;
  @IsString() subject: string;
  @IsOptional() @IsString() conversationId?: string;
}

class HomeworkDto {
  @IsString() problem: string;
  @IsString() subject: string;
}

class GenerateExamDto {
  @IsString() topic: string;
  @IsInt() @Min(1) @Max(50) numQuestions: number;
  @IsString() difficulty: string;
  @IsArray() @IsString({ each: true }) questionTypes: string[];
}

class GenerateLessonDto {
  @IsString() topic: string;
  @IsString() gradeLevel: string;
  @IsInt() @Min(15) @Max(180) duration: number;
}

class GenerateFlashcardsDto {
  @IsString() topic: string;
  @IsInt() @Min(5) @Max(50) numCards: number;
}

class TranslateDto {
  @IsString() text: string;
  @IsString() targetLanguage: string;
  @IsOptional() @IsString() sourceLanguage?: string;
}

class PlagiarismDto {
  @IsString() content: string;
}

@ApiTags('AI')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('tutor/chat')
  @ApiOperation({ summary: 'Chat with AI tutor' })
  tutorChat(@CurrentUser() user: any, @Request() req: any, @Body() dto: TutorChatDto) {
    return this.aiService.tutorChat(user.id, req.tenant?.id, dto.message, dto.subject, dto.conversationId);
  }

  @Post('homework/solve')
  @ApiOperation({ summary: 'Get homework solution with steps' })
  solveHomework(@CurrentUser() user: any, @Request() req: any, @Body() dto: HomeworkDto) {
    return this.aiService.solveHomework(user.id, req.tenant?.id, dto.problem, dto.subject);
  }

  @Post('exam/generate')
  @ApiOperation({ summary: 'Generate an exam' })
  generateExam(@CurrentUser() user: any, @Request() req: any, @Body() dto: GenerateExamDto) {
    return this.aiService.generateExam(user.id, req.tenant?.id, dto.topic, dto.numQuestions, dto.difficulty, dto.questionTypes);
  }

  @Post('lesson/generate')
  @ApiOperation({ summary: 'Generate a lesson plan' })
  generateLesson(@CurrentUser() user: any, @Request() req: any, @Body() dto: GenerateLessonDto) {
    return this.aiService.generateLesson(user.id, req.tenant?.id, dto.topic, dto.gradeLevel, dto.duration);
  }

  @Post('flashcards/generate')
  @ApiOperation({ summary: 'Generate flashcards' })
  generateFlashcards(@CurrentUser() user: any, @Request() req: any, @Body() dto: GenerateFlashcardsDto) {
    return this.aiService.generateFlashcards(user.id, req.tenant?.id, dto.topic, dto.numCards);
  }

  @Post('mindmap/generate')
  @ApiOperation({ summary: 'Generate a mind map' })
  generateMindMap(@CurrentUser() user: any, @Request() req: any, @Body() body: { topic: string }) {
    return this.aiService.generateMindMap(user.id, req.tenant?.id, body.topic);
  }

  @Post('translate')
  @ApiOperation({ summary: 'Translate text' })
  translate(@CurrentUser() user: any, @Request() req: any, @Body() dto: TranslateDto) {
    return this.aiService.translate(user.id, req.tenant?.id, dto.text, dto.targetLanguage, dto.sourceLanguage);
  }

  @Post('plagiarism/check')
  @ApiOperation({ summary: 'Check content for plagiarism' })
  plagiarismCheck(@CurrentUser() user: any, @Request() req: any, @Body() dto: PlagiarismDto) {
    return this.aiService.checkPlagiarism(user.id, req.tenant?.id, dto.content);
  }

  @Post('content/moderate')
  @ApiOperation({ summary: 'Moderate content for inappropriate material' })
  moderateContent(@Request() req: any, @Body() dto: { content: string }) {
    return this.aiService.moderateContent(req.tenant?.id, dto.content);
  }

  @Post('recommend')
  @ApiOperation({ summary: 'Get personalized course recommendations' })
  recommend(@CurrentUser() user: any, @Request() req: any) {
    return this.aiService.getRecommendations(user.id, req.tenant?.id);
  }

  @Post('curriculum/generate')
  @ApiOperation({ summary: 'Generate a full curriculum' })
  generateCurriculum(@CurrentUser() user: any, @Request() req: any, @Body() body: { subject: string; gradeLevel: string; weeks: number; objectives: string[] }) {
    return this.aiService.generateCurriculum(user.id, req.tenant?.id, body.subject, body.gradeLevel, body.weeks, body.objectives);
  }

  @Post('research/assist')
  @ApiOperation({ summary: 'AI research assistant' })
  researchAssist(@CurrentUser() user: any, @Request() req: any, @Body() body: { topic: string; depth: 'overview' | 'detailed' | 'academic'; conversationId?: string }) {
    return this.aiService.researchAssist(user.id, req.tenant?.id, body.topic, body.depth, body.conversationId);
  }

  @Post('speech-to-text')
  @ApiOperation({ summary: 'Transcribe audio to text' })
  speechToText(@CurrentUser() user: any, @Request() req: any, @Body() body: { audioBase64: string; language?: string }) {
    return this.aiService.speechToText(user.id, req.tenant?.id, body.audioBase64, body.language);
  }

  @Post('text-to-speech')
  @ApiOperation({ summary: 'Convert text to speech audio' })
  textToSpeech(@CurrentUser() user: any, @Request() req: any, @Body() body: { text: string; voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' }) {
    return this.aiService.textToSpeech(user.id, req.tenant?.id, body.text, body.voice);
  }

  @Post('career/advise')
  @ApiOperation({ summary: 'Get AI career advice' })
  careerAdvise(@CurrentUser() user: any, @Request() req: any, @Body() body: { interests: string[]; skills: string[]; educationLevel: string; targetRole?: string }) {
    return this.aiService.getCareerAdvice(user.id, req.tenant?.id, body.interests, body.skills, body.educationLevel, body.targetRole);
  }

  @Get('predict/performance/:studentId')
  @ApiOperation({ summary: 'Predict student performance' })
  predictPerformance(@Request() req: any, @Param('studentId') studentId: string) {
    return this.aiService.predictPerformance(req.tenant?.id, studentId);
  }

  @Get('predict/dropout/:studentId')
  @ApiOperation({ summary: 'Predict student dropout risk' })
  predictDropout(@Request() req: any, @Param('studentId') studentId: string) {
    return this.aiService.predictDropout(req.tenant?.id, studentId);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get AI usage stats for this billing period' })
  getUsage(@Request() req: any, @Query('period') period = 'month') {
    const startDate = new Date();
    if (period === 'month') startDate.setDate(1);
    else if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
    return this.aiService.getAIUsageByPeriod(req.tenant?.id, startDate);
  }
}
