import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  QuizzesService,
  CreateQuizDto,
  UpdateQuizDto,
  SubmitAttemptDto,
} from './quizzes.service';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../core/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@ApiTags('Quizzes')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(
    private readonly quizzesService: QuizzesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get quiz by lesson ID' })
  getByLesson(@Param('lessonId') lessonId: string) {
    return this.quizzesService.getByLesson(lessonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by ID with attempt count' })
  getById(@Param('id') id: string) {
    return this.quizzesService.getById(id);
  }

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a quiz' })
  async create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateQuizDto) {
    if (user.role === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
      if (!teacher) throw new NotFoundException('Teacher profile not found');
    }
    return this.quizzesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a quiz' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateQuizDto,
  ) {
    if (user.role === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
      if (!teacher) throw new NotFoundException('Teacher profile not found');
    }
    return this.quizzesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a quiz' })
  async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    if (user.role === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
      if (!teacher) throw new NotFoundException('Teacher profile not found');
    }
    return this.quizzesService.deleteQuiz(id);
  }

  @Post(':id/attempt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a quiz attempt' })
  async submitAttempt(
    @Param('id') quizId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.quizzesService.submitAttempt(quizId, user.id, dto.answers);
  }

  @Get(':id/my-attempts')
  @ApiOperation({ summary: 'Get my attempts for a quiz' })
  getMyAttempts(@Param('id') quizId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.quizzesService.getMyAttempts(quizId, user.id);
  }

  @Get(':id/results')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all attempts for a quiz (teacher/admin only)' })
  async getResults(@Param('id') quizId: string, @CurrentUser() user: CurrentUserPayload) {
    if (user.role === UserRole.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
      if (!teacher) throw new NotFoundException('Teacher profile not found');
    }
    return this.quizzesService.getResults(quizId);
  }
}
