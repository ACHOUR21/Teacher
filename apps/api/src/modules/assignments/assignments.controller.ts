import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  AssignmentsService,
  CreateAssignmentDto,
  SubmitAssignmentDto,
  GradeSubmissionDto,
} from './assignments.service';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../core/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Assignments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create an assignment' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateAssignmentDto) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
    if (!teacher) throw new NotFoundException('Teacher profile not found');
    return this.assignmentsService.create(teacher.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List assignments (filter by lessonId, or all for teacher)' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('lessonId') lessonId?: string,
  ) {
    const isTeacherRole = user.role === UserRole.TEACHER;
    if (isTeacherRole) {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
      return this.assignmentsService.findAll(teacher?.id, undefined, lessonId);
    }
    const isStudentRole = user.role === UserRole.STUDENT;
    if (isStudentRole) {
      const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
      if (!student) throw new NotFoundException('Student profile not found');
      return this.assignmentsService.getStudentAssignments(student.id);
    }
    return this.assignmentsService.findAll(undefined, undefined, lessonId);
  }

  @Get('my')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get all assignments for the logged-in student' })
  async myAssignments(@CurrentUser() user: CurrentUserPayload) {
    const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) throw new NotFoundException('Student profile not found');
    return this.assignmentsService.getStudentAssignments(student.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment by ID' })
  findById(@Param('id') id: string) {
    return this.assignmentsService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an assignment' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: Partial<CreateAssignmentDto>,
  ) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
    if (!teacher) throw new NotFoundException('Teacher profile not found');
    return this.assignmentsService.update(id, teacher.id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an assignment' })
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
    if (!teacher) throw new NotFoundException('Teacher profile not found');
    return this.assignmentsService.delete(id, teacher.id);
  }

  @Post(':id/submit')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit an assignment' })
  async submit(
    @Param('id') assignmentId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SubmitAssignmentDto,
  ) {
    const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) throw new NotFoundException('Student profile not found');
    return this.assignmentsService.submit(assignmentId, student.id, dto);
  }

  @Get(':id/submissions')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all submissions for an assignment' })
  async getSubmissions(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
    if (!teacher) throw new NotFoundException('Teacher profile not found');
    return this.assignmentsService.getSubmissions(id, teacher.id);
  }

  @Get(':id/my-submission')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my submission for an assignment' })
  async getMySubmission(@Param('id') assignmentId: string, @CurrentUser() user: CurrentUserPayload) {
    const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) throw new NotFoundException('Student profile not found');
    return this.assignmentsService.getMySubmission(assignmentId, student.id);
  }

  @Patch('submissions/:submissionId/grade')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Grade a submission' })
  async grade(
    @Param('submissionId') submissionId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: GradeSubmissionDto,
  ) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
    if (!teacher) throw new NotFoundException('Teacher profile not found');
    return this.assignmentsService.grade(submissionId, teacher.id, dto);
  }
}
