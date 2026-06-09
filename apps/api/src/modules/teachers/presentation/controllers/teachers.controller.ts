import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request, NotFoundException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { TeachersService } from '../../teachers.service';

@ApiTags('Teachers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my teacher profile' })
  myProfile(@CurrentUser() user: any) {
    return this.teachersService.findByUserId(user.sub ?? user.id);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get my performance stats' })
  async myStats(@CurrentUser() user: any) {
    const teacher = await this.teachersService.findByUserId(user.sub ?? user.id);
    if (!teacher) {throw new NotFoundException('Teacher profile not found');}
    return this.teachersService.getPerformanceStats(teacher.id);
  }

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

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregate teacher stats for tenant' })
  tenantStats(@Request() req: any) {
    return this.teachersService.getTenantStats(req.tenant?.id);
  }

  @Post('invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invite a teacher by email' })
  invite(@Request() req: any, @Body() body: { email: string; firstName?: string; lastName?: string }) {
    return this.teachersService.inviteTeacher(req.tenant?.id, body);
  }
}
