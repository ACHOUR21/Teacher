import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
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

  @Post('recommend')
  @ApiOperation({ summary: 'Get personalized course recommendations' })
  recommend(@CurrentUser() user: any, @Request() req: any) {
    return this.aiService.getRecommendations(user.id, req.tenant?.id);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get AI usage statistics for tenant' })
  usage(@Request() req: any, @Query('period') period: 'day' | 'week' | 'month') {
    return this.aiService.getUsageStats(req.tenant?.id, period);
  }
}
