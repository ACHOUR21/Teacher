import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SchoolErpService } from '../../school-erp.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { Roles } from '../../../core/decorators/roles.decorator';

@ApiTags('School ERP')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('school-erp')
export class SchoolErpController {
  constructor(private readonly schoolErpService: SchoolErpService) {}

  @Post('schools')
  @Roles('ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
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
  @Roles('ADMIN', 'SCHOOL_ADMIN')
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
  @Roles('ADMIN', 'SCHOOL_ADMIN')
  @ApiOperation({ summary: 'Create a class' })
  createClass(@Param('id') schoolId: string, @Body() body: any) {
    return this.schoolErpService.createClass(schoolId, body);
  }

  @Get('schools/:id/classes')
  @ApiOperation({ summary: 'List school classes' })
  classes(@Param('id') schoolId: string) {
    return this.schoolErpService.getClasses(schoolId);
  }

  @Get('classes/:classId/timetable')
  @ApiOperation({ summary: 'Get class timetable' })
  timetable(@Param('classId') classId: string) {
    return this.schoolErpService.getTimetable(classId);
  }

  @Post('classes/:classId/timetable')
  @Roles('ADMIN', 'SCHOOL_ADMIN', 'TEACHER')
  @ApiOperation({ summary: 'Add timetable entry' })
  addTimetable(@Param('classId') classId: string, @Body() body: any) {
    return this.schoolErpService.createTimetableEntry(classId, body);
  }
}
