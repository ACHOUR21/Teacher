import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from '../../search.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { TenantId } from '../../../core/decorators/tenant.decorator';
import { Public } from '../../../core/decorators/public.decorator';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('courses')
  @Public()
  @ApiOperation({ summary: 'Full-text course search via Elasticsearch' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
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
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Full-text user search via Elasticsearch' })
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
}
