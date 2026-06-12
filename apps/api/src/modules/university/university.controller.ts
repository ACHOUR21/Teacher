import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser, CurrentUserPayload } from '../core/decorators/current-user.decorator';
import { Roles } from '../core/decorators/roles.decorator';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';

import {
  UniversityService,
  CreateDepartmentDto,
  CreateFacultyMemberDto,
  CreateSemesterDto,
} from './university.service';

@ApiTags('University ERP')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('university')
export class UniversityController {
  constructor(private readonly universityService: UniversityService) {}

  // ─── Dashboard ────────────────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Get university dashboard stats' })
  getDashboard(@CurrentUser() user: CurrentUserPayload) {
    return this.universityService.getDashboardStats(user.tenantId);
  }

  // ─── Departments ──────────────────────────────────────────────────────────

  @Get('departments')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.UNIVERSITY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List departments with faculty and course counts' })
  getDepartments(@CurrentUser() user: CurrentUserPayload) {
    return this.universityService.getDepartments(user.tenantId);
  }

  @Post('departments')
  @Roles(UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a department' })
  createDepartment(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: CreateDepartmentDto,
  ) {
    return this.universityService.createDepartment(user.tenantId, body);
  }

  // ─── Faculty ──────────────────────────────────────────────────────────────

  @Get('faculty')
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.UNIVERSITY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all faculty members' })
  @ApiQuery({ name: 'departmentId', required: false })
  getFaculty(
    @CurrentUser() user: CurrentUserPayload,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.universityService.getFacultyMembers(user.tenantId, departmentId);
  }

  @Post('faculty')
  @Roles(UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a faculty member' })
  createFaculty(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: CreateFacultyMemberDto,
  ) {
    return this.universityService.createFacultyMember(user.tenantId, body);
  }

  // ─── Courses ──────────────────────────────────────────────────────────────

  @Get('courses')
  @ApiOperation({ summary: 'List university courses (paginated)' })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getCourses(
    @CurrentUser() user: CurrentUserPayload,
    @Query('departmentId') departmentId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.universityService.getUniversityCourses(
      user.tenantId,
      departmentId,
      page,
      limit,
    );
  }

  // ─── Enrollment ───────────────────────────────────────────────────────────

  @Post('enrollment')
  @ApiOperation({ summary: 'Enroll a student in a course' })
  enrollStudent(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { studentId: string; courseId: string; semesterId: string },
  ) {
    return this.universityService.enrollStudent(
      user.tenantId,
      body.studentId,
      body.courseId,
      body.semesterId,
    );
  }

  @Delete('enrollment/:courseId')
  @ApiOperation({ summary: 'Drop a course (for current user student)' })
  dropCourse(
    @CurrentUser() user: CurrentUserPayload,
    @Param('courseId') courseId: string,
    @Query('studentId') studentId?: string,
  ) {
    // Admins/Teachers can pass studentId; students drop their own
    const sid = studentId ?? user.id;
    return this.universityService.dropCourse(user.tenantId, sid, courseId);
  }

  // ─── Transcript ───────────────────────────────────────────────────────────

  @Get('transcript/:studentId')
  @Roles(
    UserRole.ADMIN,
    UserRole.TEACHER,
    UserRole.UNIVERSITY_ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.STUDENT,
  )
  @ApiOperation({ summary: 'Get transcript for a student' })
  getTranscript(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
  ) {
    return this.universityService.getTranscript(user.tenantId, studentId);
  }

  // ─── Semesters ────────────────────────────────────────────────────────────

  @Get('semesters/active')
  @ApiOperation({ summary: 'Get current active semester' })
  getActiveSemester(@CurrentUser() user: CurrentUserPayload) {
    return this.universityService.getActiveSemester(user.tenantId);
  }

  @Post('semesters')
  @Roles(UserRole.ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a semester' })
  createSemester(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: CreateSemesterDto,
  ) {
    return this.universityService.createSemester(user.tenantId, body);
  }
}
