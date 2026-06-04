import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UniversityErpService } from '../../university-erp.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { Roles } from '../../../core/decorators/roles.decorator';

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

  @Post('universities/:id/faculties')
  @Roles('ADMIN', 'UNIVERSITY_ADMIN')
  @ApiOperation({ summary: 'Create a faculty' })
  createFaculty(@Param('id') id: string, @Body() body: any) {
    return this.universityErpService.createFaculty(id, body);
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
}
