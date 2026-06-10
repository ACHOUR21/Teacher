import {
  Controller, Get, Post, Delete, Param, Body, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery , ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsEnum, IsInt, IsArray, IsNumber, ValidateNested } from 'class-validator';

import { CurrentUser, CurrentUserPayload } from '../../../core/decorators/current-user.decorator';
import { RequiresPlanFeature } from '../../../core/decorators/require-plan.decorator';
import { Roles } from '../../../core/decorators/roles.decorator';
import { TenantId } from '../../../core/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { PlanGuard } from '../../../core/guards/plan.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { ExamsService, GeneratedQuestion, SaveExamDto } from '../../exams.service';

class QuestionDto implements GeneratedQuestion {
  @ApiProperty({ enum: ['multiple_choice', 'true_false', 'short_answer', 'essay'] })
  @IsEnum(['multiple_choice', 'true_false', 'short_answer', 'essay'])
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

  @ApiProperty()
  @IsString()
  question: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiProperty()
  @IsString()
  correctAnswer: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  points?: number;
}

class SaveExamBodyDto implements SaveExamDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  subject: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  timeLimit?: number;

  @ApiProperty({ type: [QuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}

class SubmitAnswersDto {
  @ApiProperty({ description: 'Map of questionId → answer string' })
  answers: Record<string, string>;
}

@ApiTags('Exams')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PlanGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequiresPlanFeature('aiExamGenerator')
  @ApiOperation({ summary: 'Save an AI-generated exam' })
  saveExam(
    @TenantId() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SaveExamBodyDto,
  ) {
    return this.examsService.saveExam(tenantId, user.id, dto);
  }

  @Get()
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequiresPlanFeature('aiExamGenerator')
  @ApiOperation({ summary: 'List exams in tenant' })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  @ApiQuery({ name: 'mine', required: false, type: Boolean })
  listExams(
    @TenantId() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query('published') published?: string,
    @Query('mine') mine?: string,
  ) {
    return this.examsService.listExams(tenantId, {
      published: published !== undefined ? published === 'true' : undefined,
      createdBy: mine === 'true' ? user.id : undefined,
    });
  }

  @Get(':examId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT)
  @RequiresPlanFeature('aiExamGenerator')
  @ApiOperation({ summary: 'Get exam (answers hidden for students)' })
  getExam(
    @Param('examId') examId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const includeAnswers = ([UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN] as string[]).includes(user.role);
    return this.examsService.getExam(examId, includeAnswers);
  }

  @Post(':examId/publish')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequiresPlanFeature('aiExamGenerator')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish exam so students can take it' })
  publishExam(@Param('examId') examId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.examsService.publishExam(examId, user.id);
  }

  @Delete(':examId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequiresPlanFeature('aiExamGenerator')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete exam' })
  deleteExam(@Param('examId') examId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.examsService.deleteExam(examId, user.id);
  }

  // ---------- Attempts (students)

  @Post(':examId/attempts')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  @RequiresPlanFeature('aiExamGenerator')
  @ApiOperation({ summary: 'Start or resume an exam attempt' })
  startAttempt(@Param('examId') examId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.examsService.startAttempt(examId, user.id);
  }

  @Post('attempts/:attemptId/submit')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  @RequiresPlanFeature('aiExamGenerator')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit exam answers' })
  submitAttempt(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SubmitAnswersDto,
  ) {
    return this.examsService.submitAttempt(attemptId, user.id, dto.answers);
  }

  @Get('attempts/:attemptId/result')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  @RequiresPlanFeature('aiExamGenerator')
  @ApiOperation({ summary: 'Get attempt result' })
  getAttemptResult(@Param('attemptId') attemptId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.examsService.getAttemptResult(attemptId, user.id);
  }

  @Get(':examId/attempts')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequiresPlanFeature('aiExamGenerator')
  @ApiOperation({ summary: 'List all submissions for an exam (teacher view)' })
  listAttempts(@Param('examId') examId: string) {
    return this.examsService.listAttempts(examId);
  }
}
