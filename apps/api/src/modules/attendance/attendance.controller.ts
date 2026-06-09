import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser, CurrentUserPayload } from '../core/decorators/current-user.decorator';
import { Roles } from '../core/decorators/roles.decorator';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { PrismaService } from '../database/prisma.service';

import { AttendanceService, MarkAttendanceDto } from './attendance.service';

@ApiTags('Attendance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark attendance for a class on a given date' })
  async markAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: MarkAttendanceDto,
  ) {
    return this.attendanceService.markAttendance(
      dto.classId,
      dto.date,
      dto.records,
      user.id,
    );
  }

  @Get('my')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get own attendance history (student)' })
  async getMyAttendance(
    @CurrentUser() user: CurrentUserPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
    if (!student) {throw new NotFoundException('Student profile not found');}
    return this.attendanceService.getStudentAttendance(student.id, from, to);
  }

  @Get('class/:classId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get attendance for a class on a specific date' })
  async getClassAttendance(
    @Param('classId') classId: string,
    @Query('date') date: string,
  ) {
    const resolvedDate = date ?? new Date().toISOString().split('T')[0];
    return this.attendanceService.getClassAttendance(classId, resolvedDate);
  }

  @Get('class/:classId/summary')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get per-student attendance summary for a class over a date range' })
  async getClassSummary(
    @Param('classId') classId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const resolvedFrom = from ?? new Date(new Date().setDate(1)).toISOString().split('T')[0];
    const resolvedTo = to ?? new Date().toISOString().split('T')[0];
    return this.attendanceService.getClassSummary(classId, resolvedFrom, resolvedTo);
  }

  @Get('class/:classId/roster')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get class roster (all students) for attendance marking' })
  async getClassRoster(@Param('classId') classId: string) {
    return this.attendanceService.getClassRoster(classId);
  }

  @Get('student/:studentId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.STUDENT)
  @ApiOperation({ summary: "Get a student's attendance history" })
  async getStudentAttendance(
    @Param('studentId') studentId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    // Students can only view their own attendance
    if (user.role === UserRole.STUDENT) {
      const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
      if (!student || student.id !== studentId) {
        throw new ForbiddenException('You can only view your own attendance');
      }
    }
    return this.attendanceService.getStudentAttendance(studentId, from, to);
  }
}
