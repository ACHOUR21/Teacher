import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { UserRole } from '@prisma/client';

import { CurrentUser, CurrentUserPayload } from '../core/decorators/current-user.decorator';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { ContentModerationService } from './content-moderation.service';
import { PlagiarismDetectionService } from './plagiarism-detection.service';

class ModerateContentDto {
  @IsString()
  text: string;

  @IsOptional()
  @IsString()
  context?: 'submission' | 'message' | 'comment' | 'course';
}

class ReviewModerationDto {
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

@ApiTags('AI Moderation')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('ai/moderation')
export class AiModerationController {
  constructor(
    private readonly moderationService: ContentModerationService,
    private readonly plagiarismService: PlagiarismDetectionService,
  ) {}

  /**
   * POST /ai/moderation/check
   * Moderate arbitrary text content.
   */
  @Post('check')
  @ApiOperation({ summary: 'Moderate content text' })
  moderateContent(@Body() dto: ModerateContentDto) {
    return this.moderationService.moderateContent(dto.text, dto.context);
  }

  /**
   * POST /ai/moderation/submission/:id
   * Run moderation on a specific submission.
   */
  @Post('submission/:id')
  @ApiOperation({ summary: 'Run content moderation on a submission' })
  moderateSubmission(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.moderationService.moderateSubmission(id, user.tenantId);
  }

  /**
   * GET /ai/moderation/queue
   * Get flagged submissions queue (admin only).
   */
  @Get('queue')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get content moderation queue (admin)' })
  getModerationQueue(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: 'pending' | 'reviewed',
  ) {
    return this.moderationService.getModerationQueue(user.tenantId, status);
  }

  /**
   * PATCH /ai/moderation/review/:id
   * Admin review of a flagged submission.
   */
  @Patch('review/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Review a flagged submission moderation result' })
  reviewModeration(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ReviewModerationDto,
  ) {
    return this.moderationService.reviewModeration(
      user.tenantId,
      id,
      user.id,
      dto.approved,
      dto.note,
    );
  }

  /**
   * POST /ai/plagiarism/check/:submissionId
   * Run plagiarism detection on a submission.
   */
  @Post('/ai/plagiarism/check/:submissionId')
  @ApiOperation({ summary: 'Run plagiarism detection on a submission' })
  checkPlagiarism(
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.plagiarismService.checkPlagiarism(submissionId, user.tenantId);
  }

  /**
   * GET /ai/plagiarism/report/:assignmentId
   * Get batch plagiarism report for all submissions in an assignment.
   */
  @Get('/ai/plagiarism/report/:assignmentId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get batch plagiarism report for an assignment' })
  getBatchReport(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.plagiarismService.getBatchReport(user.tenantId, assignmentId);
  }
}
