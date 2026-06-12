import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { CurrentUser } from '../core/decorators/current-user.decorator';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';

import { ParentPortalService } from './parent-portal.service';

@ApiTags('Parent Portal')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('parents')
export class ParentPortalController {
  constructor(private readonly portal: ParentPortalService) {}

  // ── GET /parents/children ──────────────────────────────────────────────────
  @Get('children')
  @ApiOperation({ summary: 'List all children linked to the authenticated parent' })
  getChildren(@CurrentUser('id') parentUserId: string) {
    return this.portal.getChildren(parentUserId);
  }

  // ── POST /parents/link-child ───────────────────────────────────────────────
  @Post('link-child')
  @ApiOperation({ summary: 'Link a child to this parent account by student email' })
  linkChild(
    @CurrentUser('id') parentUserId: string,
    @Body() body: { childEmail: string },
  ) {
    return this.portal.linkChildByEmail(parentUserId, body.childEmail);
  }

  // ── GET /parents/children/:childId/overview ────────────────────────────────
  @Get('children/:childId/overview')
  @ApiOperation({ summary: "Get child's academic overview (courses, grades, attendance, AI usage)" })
  getChildOverview(
    @CurrentUser('id') parentUserId: string,
    @Param('childId') childUserId: string,
  ) {
    return this.portal.getChildOverview(parentUserId, childUserId);
  }

  // ── GET /parents/children/:childId/attendance ──────────────────────────────
  @Get('children/:childId/attendance')
  @ApiOperation({ summary: "Get child's attendance records for a given month" })
  @ApiQuery({ name: 'month', required: false, description: 'YYYY-MM format, defaults to current month' })
  getChildAttendance(
    @CurrentUser('id') parentUserId: string,
    @Param('childId') childUserId: string,
    @Query('month') month?: string,
  ) {
    const monthDate = month ? new Date(`${month}-01`) : undefined;
    return this.portal.getChildAttendance(parentUserId, childUserId, monthDate);
  }

  // ── GET /parents/children/:childId/assignments ─────────────────────────────
  @Get('children/:childId/assignments')
  @ApiOperation({ summary: "Get child's recent assignment submissions and grades" })
  getChildAssignments(
    @CurrentUser('id') parentUserId: string,
    @Param('childId') childUserId: string,
  ) {
    return this.portal.getChildAssignments(parentUserId, childUserId);
  }

  // ── GET /parents/children/:childId/events ─────────────────────────────────
  @Get('children/:childId/events')
  @ApiOperation({ summary: "Get child's upcoming events (live sessions, assignment due dates)" })
  getChildUpcomingEvents(
    @CurrentUser('id') parentUserId: string,
    @Param('childId') childUserId: string,
  ) {
    return this.portal.getChildUpcomingEvents(parentUserId, childUserId);
  }

  // ── POST /parents/teachers/:teacherId/message ──────────────────────────────
  @Post('teachers/:teacherId/message')
  @ApiOperation({ summary: 'Send a message to a teacher' })
  messageTeacher(
    @CurrentUser('id') parentUserId: string,
    @Param('teacherId') teacherUserId: string,
    @Body() body: { subject: string; message: string },
  ) {
    return this.portal.messageTeacher(parentUserId, teacherUserId, body.subject, body.message);
  }

  // ── GET /parents/conversations ─────────────────────────────────────────────
  @Get('conversations')
  @ApiOperation({ summary: "Get parent's teacher conversations" })
  getConversations(@CurrentUser('id') parentUserId: string) {
    return this.portal.getConversations(parentUserId);
  }
}
