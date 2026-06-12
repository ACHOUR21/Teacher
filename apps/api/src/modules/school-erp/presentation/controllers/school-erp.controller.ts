/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser, CurrentUserPayload } from '../../../core/decorators/current-user.decorator';
import { Roles } from '../../../core/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { AttendanceManagementService } from '../../attendance-management.service';
import { GradeBookService } from '../../gradebook.service';
import { SchoolErpService } from '../../school-erp.service';
import { TimetableService, UpsertTimetableSlotDto } from '../../timetable.service';


@ApiTags('School ERP')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('school-erp')
export class SchoolErpController {
  constructor(
    private readonly schoolErpService: SchoolErpService,
    private readonly timetableService: TimetableService,
    private readonly gradeBookService: GradeBookService,
    private readonly attendanceManagementService: AttendanceManagementService,
  ) {}

  // ─── Schools ────────────────────────────────────────────────────────────────

  @Post('schools')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a school' })
  create(@Request() req: any, @Body() body: any) {
    return this.schoolErpService.createSchool(req.tenant?.id, body);
  }

  @Get('schools')
  @ApiOperation({ summary: 'List schools in tenant' })
  findAll(@Request() req: any) {
    return this.schoolErpService.getSchools(req.tenant?.id);
  }

  @Get('schools/:id')
  @ApiOperation({ summary: 'Get school details' })
  findOne(@Param('id') id: string) {
    return this.schoolErpService.getSchool(id);
  }

  @Get('schools/:id/stats')
  @ApiOperation({ summary: 'Get school statistics' })
  stats(@Param('id') id: string) {
    return this.schoolErpService.getSchoolStats(id);
  }

  @Post('schools/:id/departments')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a department' })
  createDepartment(@Param('id') schoolId: string, @Body() body: any) {
    return this.schoolErpService.createDepartment(schoolId, body);
  }

  @Get('schools/:id/departments')
  @ApiOperation({ summary: 'List school departments' })
  departments(@Param('id') schoolId: string) {
    return this.schoolErpService.getDepartments(schoolId);
  }

  @Post('schools/:id/classes')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Create a class' })
  createClass(@Param('id') schoolId: string, @Body() body: any) {
    return this.schoolErpService.createClass(schoolId, body);
  }

  @Get('schools/:id/classes')
  @ApiOperation({ summary: 'List school classes' })
  classes(@Param('id') schoolId: string) {
    return this.schoolErpService.getClasses(schoolId);
  }

  @Post('schools/:schoolId/teachers')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign teacher to school' })
  @ApiBody({ schema: { properties: { teacherId: { type: 'string' } }, required: ['teacherId'] } })
  assignTeacher(@Param('schoolId') schoolId: string, @Body('teacherId') teacherId: string) {
    return this.schoolErpService.assignTeacherToSchool(teacherId, schoolId);
  }

  @Get('schools/:schoolId/teachers')
  @ApiOperation({ summary: 'List school teachers' })
  getTeachers(@Param('schoolId') schoolId: string) {
    return this.schoolErpService.getSchoolTeachers(schoolId);
  }

  // ─── Students ───────────────────────────────────────────────────────────────

  @Post('classes/:classId/students')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign student to class' })
  @ApiBody({ schema: { properties: { studentId: { type: 'string' } }, required: ['studentId'] } })
  assignStudent(@Param('classId') classId: string, @Body('studentId') studentId: string) {
    return this.schoolErpService.assignStudentToClass(studentId, classId);
  }

  @Delete('classes/:classId/students/:studentId')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove student from class' })
  removeStudent(@Param('classId') classId: string, @Param('studentId') studentId: string) {
    return this.schoolErpService.removeStudentFromClass(studentId, classId);
  }

  @Get('classes/:classId/students')
  @ApiOperation({ summary: 'List students in a class' })
  getClassStudents(@Param('classId') classId: string) {
    return this.schoolErpService.getClassStudents(classId);
  }

  // ─── Timetable ──────────────────────────────────────────────────────────────

  @Get('classes/:classId/timetable')
  @ApiOperation({ summary: 'Get class weekly timetable (grouped by day)' })
  getClassTimetable(@Param('classId') classId: string) {
    return this.timetableService.getClassTimetable(classId);
  }

  @Post('timetable/slots')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Create a timetable slot' })
  createSlot(@Body() dto: UpsertTimetableSlotDto) {
    return this.timetableService.upsertSlot(dto);
  }

  @Put('timetable/slots/:id')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Update a timetable slot' })
  updateSlot(@Param('id') id: string, @Body() dto: Omit<UpsertTimetableSlotDto, 'id'>) {
    return this.timetableService.upsertSlot({ ...dto, id });
  }

  @Delete('timetable/slots/:id')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a timetable slot' })
  deleteSlot(@Param('id') id: string) {
    return this.timetableService.deleteSlot(id);
  }

  @Get('timetable/conflicts')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Detect timetable conflicts for the tenant' })
  detectConflicts(@Request() req: any) {
    return this.timetableService.detectConflicts(req.tenant?.id);
  }

  @Get('teachers/:teacherId/timetable')
  @ApiOperation({ summary: "Get a teacher's full schedule" })
  getTeacherTimetable(@Param('teacherId') teacherId: string) {
    return this.timetableService.getTeacherTimetable(teacherId);
  }

  // Legacy endpoints kept for backwards compatibility
  @Post('classes/:classId/timetable')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Add timetable entry (legacy)' })
  addTimetable(@Param('classId') classId: string, @Body() body: any) {
    return this.schoolErpService.createTimetableEntry(classId, body);
  }

  @Delete('timetable/:id')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a timetable entry (legacy)' })
  deleteTimetable(@Param('id') id: string) {
    return this.schoolErpService.deleteTimetableEntry(id);
  }

  // ─── Grade Book ─────────────────────────────────────────────────────────────

  @Get('classes/:classId/grades')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get class grade book' })
  @ApiQuery({ name: 'subject', required: false })
  @ApiQuery({ name: 'term', required: false })
  getClassGrades(
    @Param('classId') classId: string,
    @Query('subject') subject?: string,
    @Query('term') term?: string,
  ) {
    return this.gradeBookService.getClassGrades(classId, subject, term);
  }

  @Post('grades')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit or update a grade' })
  submitGrade(
    @Body() dto: any,
    @Request() req: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.gradeBookService.submitGrade(dto, req.tenant?.id, user.id);
  }

  @Post('grades/bulk-import')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Bulk import grades' })
  bulkImportGrades(
    @Body() body: { classId: string; grades: any[] },
    @Request() req: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.gradeBookService.bulkImportGrades(body.classId, body.grades, req.tenant?.id, user.id);
  }

  @Get('classes/:classId/grade-stats')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get class grade statistics' })
  @ApiQuery({ name: 'subject', required: false })
  getClassStats(
    @Param('classId') classId: string,
    @Query('subject') subject?: string,
  ) {
    return this.gradeBookService.getClassStats(classId, subject);
  }

  @Get('students/:studentId/report-card')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: 'Get student report card' })
  @ApiQuery({ name: 'term', required: true })
  getReportCard(
    @Param('studentId') studentId: string,
    @Query('term') term: string,
  ) {
    return this.gradeBookService.getReportCard(studentId, term || 'Term 1');
  }

  // ─── Attendance Management ──────────────────────────────────────────────────

  @Post('attendance/bulk')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark bulk attendance for a class' })
  markBulkAttendance(
    @Body() body: { classId: string; date: string; records: Array<{ studentId: string; status: string; note?: string }> },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.attendanceManagementService.markBulkAttendance(
      body.classId,
      new Date(body.date),
      body.records as any,
      user.id,
    );
  }

  @Get('classes/:classId/attendance')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get class attendance summary' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getClassAttendanceSummary(
    @Param('classId') classId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const now = new Date();
    const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate = to ? new Date(to) : now;
    return this.attendanceManagementService.getClassAttendanceSummary(classId, fromDate, toDate);
  }

  @Get('students/:studentId/attendance')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: "Get student's attendance history" })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getStudentAttendance(
    @Param('studentId') studentId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendanceManagementService.getStudentAttendance(
      studentId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('classes/:classId/attendance/flagged')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get students with attendance below threshold' })
  @ApiQuery({ name: 'threshold', required: false })
  getFlaggedStudents(
    @Param('classId') classId: string,
    @Query('threshold') threshold?: string,
  ) {
    const thresh = threshold ? Number(threshold) : 75;
    return this.attendanceManagementService.getFlaggedStudents(classId, thresh);
  }

  @Post('attendance/send-alerts/:classId')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send absence alerts to parents' })
  sendAbsenceAlerts(
    @Param('classId') classId: string,
    @Body('date') date: string,
  ) {
    return this.attendanceManagementService.sendAbsenceAlerts(classId, date ? new Date(date) : new Date());
  }
}
