import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentsService } from '../../students.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';

@ApiTags('Students')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @ApiOperation({ summary: 'List students in tenant' })
  findAll(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('schoolId') schoolId?: string,
    @Query('classId') classId?: string,
    @Query('grade') grade?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.studentsService.findAll(req.tenant?.id, { search, schoolId, classId, grade, page: +page, limit: +limit });
  }

  @Get('me/progress')
  @ApiOperation({ summary: 'Get current student learning progress' })
  myProgress(@CurrentUser() user: any) {
    return this.studentsService.getLearningProgress(user.studentProfile?.id ?? user.id);
  }

  @Get('me/performance')
  @ApiOperation({ summary: 'Get current student performance summary' })
  myPerformance(@CurrentUser() user: any) {
    return this.studentsService.getPerformanceSummary(user.studentProfile?.id ?? user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student profile' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get student learning progress' })
  progress(@Param('id') id: string) {
    return this.studentsService.getLearningProgress(id);
  }

  @Get(':id/submissions')
  @ApiOperation({ summary: 'Get student submissions' })
  submissions(@Param('id') id: string) {
    return this.studentsService.getSubmissions(id);
  }

  @Get(':id/performance')
  @ApiOperation({ summary: 'Get student performance summary' })
  performance(@Param('id') id: string) {
    return this.studentsService.getPerformanceSummary(id);
  }

  @Post('invite')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Invite a student by email' })
  invite(@Request() req: any, @Body() body: { email: string; firstName?: string; lastName?: string; grade?: string }) {
    return this.studentsService.inviteStudent(req.tenant?.id, body);
  }
}
