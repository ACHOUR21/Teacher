import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Public } from '../../../core/decorators/public.decorator';
import { Roles } from '../../../core/decorators/roles.decorator';
import { TenantId } from '../../../core/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { SearchService } from '../../search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // ── Unified search: GET /search?q=...&type=courses|users|all ─────────────

  @Get()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unified search across courses, users, or all entities' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'type', required: false, enum: ['courses', 'users', 'all'], description: 'Entity type to search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  search(
    @TenantId() tenantId: string,
    @Query('q') query: string,
    @Query('type') type: 'courses' | 'users' | 'all' = 'all',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const p = page ? +page : 1;
    const l = limit ? +limit : 20;
    if (type === 'courses') {
      return this.searchService.searchCourses(query, tenantId, {}, p, l);
    }
    if (type === 'users') {
      return this.searchService.searchUsers(query, tenantId, {}, p, l);
    }
    return this.searchService.searchAll(query, tenantId, l);
  }

  // ── Dedicated course search (public) ─────────────────────────────────────

  @Get('courses')
  @Public()
  @ApiOperation({ summary: 'Full-text course search' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'level', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  searchCourses(
    @TenantId() tenantId: string,
    @Query('q') query: string,
    @Query('category') category?: string,
    @Query('level') level?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.searchCourses(query, tenantId, { category, level }, page ? +page : 1, limit ? +limit : 20);
  }

  // ── Dedicated user search (privileged) ───────────────────────────────────

  @Get('users')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Full-text user search' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  searchUsers(
    @TenantId() tenantId: string,
    @Query('q') query: string,
    @Query('role') role?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.searchUsers(query, tenantId, { role }, page ? +page : 1, limit ? +limit : 20);
  }

  // ── Exam search ──────────────────────────────────────────────────────────

  @Get('exams')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Full-text exam search' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'difficulty', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  searchExams(
    @TenantId() tenantId: string,
    @Query('q') query: string,
    @Query('difficulty') difficulty?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.searchExams(query, tenantId, { difficulty }, page ? +page : 1, limit ? +limit : 20);
  }

  // ── Multi-entity search ───────────────────────────────────────────────────

  @Get('all')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unified search across courses, users, and exams' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Results per entity type' })
  searchAll(
    @TenantId() tenantId: string,
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.searchAll(query, tenantId, limit ? +limit : 5);
  }

  // ── Autocomplete suggestions ──────────────────────────────────────────────

  @Get('suggest')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Autocomplete suggestions for search input' })
  @ApiQuery({ name: 'q', required: true })
  suggest(@TenantId() tenantId: string, @Query('q') query: string) {
    return this.searchService.suggest(query, tenantId);
  }

  // ── Health check ─────────────────────────────────────────────────────────

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Check Elasticsearch connectivity' })
  health() {
    return this.searchService.checkHealth();
  }

  // ── Manual re-index a course (ADMIN only) ─────────────────────────────────

  @Post('index/course')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Manually re-index a course document' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['id', 'title', 'tenantId'],
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        teacherName: { type: 'string' },
        tenantId: { type: 'string' },
        level: { type: 'string' },
        isPublished: { type: 'boolean' },
      },
    },
  })
  indexCourse(
    @Body()
    body: {
      id: string;
      title: string;
      description?: string;
      category?: string;
      tags?: string[];
      teacherName?: string;
      tenantId: string;
      level?: string;
      isPublished?: boolean;
    },
  ) {
    return this.searchService.indexCourse({
      ...body,
      tags: body.tags ?? [],
      teacherName: body.teacherName ?? '',
    });
  }
}
