import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  CoursesService,
  CreateCourseDto,
  UpdateCourseDto,
  CreateSectionDto,
  CreateLessonDto,
} from '../../courses.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../../core/decorators/current-user.decorator';
import { TenantId } from '../../../core/decorators/tenant.decorator';
import { PaginationDto } from '../../../core/pagination/pagination.dto';
import { Public } from '../../../core/decorators/public.decorator';
import { UserRole, CourseLevel } from '@prisma/client';
import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AddReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

class EnrollDto {
  @ApiProperty()
  @IsString()
  studentId: string;
}

@ApiTags('Courses')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'List all courses in tenant' })
  findAll(
    @TenantId() tenantId: string,
    @Query() pagination: PaginationDto,
    @Query('category') category?: string,
    @Query('level') level?: CourseLevel,
    @Query('teacherId') teacherId?: string,
    @Query('published') published?: string,
  ) {
    return this.coursesService.findAll(tenantId, pagination, {
      category,
      level,
      teacherId,
      published: published !== undefined ? published === 'true' : undefined,
    });
  }

  @Get('search')
  @ApiOperation({ summary: 'Full-text search courses via Elasticsearch' })
  search(
    @TenantId() tenantId: string,
    @Query('q') query: string,
  ) {
    return this.coursesService.search(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID with sections and lessons' })
  findById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.coursesService.findById(id, tenantId);
  }

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new course' })
  create(
    @TenantId() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCourseDto,
  ) {
    return this.coursesService.create(tenantId, user.id, dto);
  }

  @Put(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update course details' })
  update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, tenantId, dto, user.id);
  }

  @Post(':id/publish')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a course' })
  publish(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.coursesService.publish(id, tenantId);
  }

  @Post(':id/unpublish')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpublish a course' })
  unpublish(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.coursesService.unpublish(id, tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course' })
  delete(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.coursesService.delete(id, tenantId);
  }

  @Post(':id/sections')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add section to course' })
  createSection(
    @Param('id') courseId: string,
    @TenantId() tenantId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.coursesService.createSection(courseId, tenantId, dto);
  }

  @Post('sections/:sectionId/lessons')
  @Roles(UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add lesson to section' })
  createLesson(
    @Param('sectionId') sectionId: string,
    @TenantId() tenantId: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.coursesService.createLesson(sectionId, tenantId, dto);
  }

  @Post(':id/enroll')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enroll a student in a course' })
  enroll(
    @Param('id') courseId: string,
    @TenantId() tenantId: string,
    @Body() dto: EnrollDto,
  ) {
    return this.coursesService.enrollStudent(courseId, dto.studentId, tenantId);
  }

  @Put(':id/progress/:lessonId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update lesson completion progress' })
  updateProgress(
    @Param('id') courseId: string,
    @Param('lessonId') lessonId: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.coursesService.updateProgress(courseId, user.id, lessonId, tenantId);
  }

  @Post(':id/reviews')
  @ApiOperation({ summary: 'Add a review for a course' })
  addReview(
    @Param('id') courseId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AddReviewDto,
  ) {
    return this.coursesService.addReview(courseId, user.id, dto.rating, dto.comment);
  }
}
