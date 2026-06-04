import { Controller, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TeachersService } from '../../teachers.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';

@ApiTags('Teachers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @ApiOperation({ summary: 'List all teachers in tenant' })
  findAll(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('schoolId') schoolId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.teachersService.findAll(req.tenant?.id, { search, schoolId, page: +page, limit: +limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get teacher profile' })
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update teacher profile' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.teachersService.update(id, body);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get teacher performance statistics' })
  stats(@Param('id') id: string) {
    return this.teachersService.getPerformanceStats(id);
  }

  @Get(':id/schedule')
  @ApiOperation({ summary: 'Get teacher upcoming schedule' })
  schedule(@Param('id') id: string) {
    return this.teachersService.getSchedule(id);
  }
}
