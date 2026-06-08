import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SearchService } from '../../search.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorator';
import { TenantId } from '../../../core/decorators/tenant.decorator';
import { Public } from '../../../core/decorators/public.decorator';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

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

  @Get('suggest')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Autocomplete suggestions for search input' })
  @ApiQuery({ name: 'q', required: true })
  suggest(@TenantId() tenantId: string, @Query('q') query: string) {
    return this.searchService.suggest(query, tenantId);
  }
}
