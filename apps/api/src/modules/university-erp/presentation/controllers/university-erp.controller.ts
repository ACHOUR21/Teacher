import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { Roles } from '../../../core/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { UniversityErpService } from '../../university-erp.service';

@ApiTags('University ERP')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('university-erp')
export class UniversityErpController {
  constructor(private readonly universityErpService: UniversityErpService) {}

  @Post('universities')
  @Roles('ADMIN', 'UNIVERSITY_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a university' })
  create(@Request() req: any, @Body() body: any) {
    return this.universityErpService.createUniversity(req.tenant?.id, body);
  }

  @Get('universities')
  @ApiOperation({ summary: 'List universities' })
  findAll(@Request() req: any) {
    return this.universityErpService.getUniversities(req.tenant?.id);
  }

  @Get('universities/:id')
  @ApiOperation({ summary: 'Get a university by ID' })
  findOne(@Param('id') id: string) {
    return this.universityErpService.getUniversity(id);
  }

  @Patch('universities/:id')
  @Roles('ADMIN', 'UNIVERSITY_ADMIN')
  @ApiOperation({ summary: 'Update university fields' })
  updateUniversity(@Param('id') id: string, @Body() body: { name?: string; code?: string }) {
    return this.universityErpService.updateUniversity(id, body);
  }

  @Get('universities/:id/faculties')
  @ApiOperation({ summary: 'List faculties in university' })
  faculties(@Param('id') id: string) {
    return this.universityErpService.getFaculties(id);
  }

  @Post('universities/:id/faculties')
  @Roles('ADMIN', 'UNIVERSITY_ADMIN')
  @ApiOperation({ summary: 'Create a faculty' })
  createFaculty(@Param('id') id: string, @Body() body: any) {
    return this.universityErpService.createFaculty(id, body);
  }

  @Delete('faculties/:id')
  @Roles('ADMIN', 'UNIVERSITY_ADMIN')
  @ApiOperation({ summary: 'Delete a faculty' })
  deleteFaculty(@Param('id') id: string) {
    return this.universityErpService.deleteFaculty(id);
  }

  @Post('faculties/:facultyId/departments')
  @Roles('ADMIN', 'UNIVERSITY_ADMIN')
  @ApiOperation({ summary: 'Create a department under a faculty' })
  createDepartment(@Param('facultyId') facultyId: string, @Body() body: { name: string; code?: string }) {
    return this.universityErpService.createUniDepartment(facultyId, body);
  }

  @Get('faculties/:facultyId/departments')
  @ApiOperation({ summary: 'List departments in a faculty' })
  getDepartments(@Param('facultyId') facultyId: string) {
    return this.universityErpService.getDepartments(facultyId);
  }

  @Post('universities/:id/programs')
  @Roles('ADMIN', 'UNIVERSITY_ADMIN')
  @ApiOperation({ summary: 'Create an academic program' })
  createProgram(@Param('id') id: string, @Body() body: any) {
    return this.universityErpService.createProgram(id, body);
  }

  @Get('universities/:id/programs')
  @ApiOperation({ summary: 'List programs in university' })
  programs(@Param('id') id: string) {
    return this.universityErpService.getPrograms(id);
  }

  @Get('programs/:programId/stats')
  @ApiOperation({ summary: 'Get enrollment stats for a program' })
  programStats(@Param('programId') programId: string) {
    return this.universityErpService.getProgramEnrollmentStats(programId);
  }

  @Post('programs/:programId/enroll')
  @Roles('ADMIN', 'UNIVERSITY_ADMIN')
  @ApiOperation({ summary: 'Enroll a student in a program' })
  enroll(@Param('programId') programId: string, @Body() body: { studentId: string }) {
    return this.universityErpService.enrollStudent(body.studentId, programId);
  }

  @Get('programs/:programId/enrollments')
  @ApiOperation({ summary: 'Get program enrollments' })
  enrollments(@Param('programId') programId: string) {
    return this.universityErpService.getEnrollments(programId);
  }

  @Patch('enrollments/:id/status')
  @Roles('ADMIN', 'UNIVERSITY_ADMIN')
  @ApiOperation({ summary: 'Update enrollment status' })
  updateStatus(@Param('id') id: string, @Body() body: { status: any }) {
    return this.universityErpService.updateEnrollmentStatus(id, body.status);
  }

  @Get('students/:studentId/academic-record')
  @ApiOperation({ summary: 'Get full academic record for a student' })
  academicRecord(@Param('studentId') studentId: string, @Query('universityId') universityId: string) {
    return this.universityErpService.getStudentAcademicRecord(studentId, universityId);
  }
}
