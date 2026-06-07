import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SchoolErpService } from '../../school-erp.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('School ERP')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('school-erp')
export class SchoolErpController {
  constructor(private readonly schoolErpService: SchoolErpService) {}

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

  @Get('classes/:classId/timetable')
  @ApiOperation({ summary: 'Get class timetable' })
  timetable(@Param('classId') classId: string) {
    return this.schoolErpService.getTimetable(classId);
  }

  @Post('classes/:classId/timetable')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Add timetable entry' })
  addTimetable(@Param('classId') classId: string, @Body() body: any) {
    return this.schoolErpService.createTimetableEntry(classId, body);
  }

  @Delete('timetable/:id')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Delete a timetable entry' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTimetable(@Param('id') id: string) {
    return this.schoolErpService.deleteTimetableEntry(id);
  }

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
}
