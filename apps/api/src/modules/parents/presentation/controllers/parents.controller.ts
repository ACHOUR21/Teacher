import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ParentsService } from '../../parents.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';

@ApiTags('Parents')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get('children')
  @ApiOperation({ summary: 'Get parent linked children' })
  children(@CurrentUser() user: any) {
    return this.parentsService.getChildren(user.id);
  }

  @Post('children/link')
  @ApiOperation({ summary: 'Link a student as child' })
  link(@CurrentUser() user: any, @Body() body: { studentId: string; relationship?: string }) {
    return this.parentsService.linkChild(user.id, body.studentId, body.relationship);
  }

  @Get('children/:studentId/progress')
  @ApiOperation({ summary: 'View child course progress' })
  childProgress(@CurrentUser() user: any, @Param('studentId') studentId: string) {
    return this.parentsService.getChildProgress(user.id, studentId);
  }

  @Get('children/:studentId/submissions')
  @ApiOperation({ summary: 'View child assignment submissions' })
  childSubmissions(@CurrentUser() user: any, @Param('studentId') studentId: string) {
    return this.parentsService.getChildSubmissions(user.id, studentId);
  }

  @Get('children/:studentId/attendance')
  @ApiOperation({ summary: 'View child live session attendance' })
  childAttendance(@CurrentUser() user: any, @Param('studentId') studentId: string) {
    return this.parentsService.getChildAttendance(user.id, studentId);
  }
}
