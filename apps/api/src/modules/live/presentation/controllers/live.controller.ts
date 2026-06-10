/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Post, Param, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsInt, Min, Max } from 'class-validator';

import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { LiveService } from '../../live.service';

class CreateSessionDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsDateString() scheduledAt: string;
  @IsOptional() @IsInt() @Min(2) @Max(500) maxParticipants?: number;
}

@ApiTags('Live')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('live')
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create a live session' })
  create(@CurrentUser() user: any, @Body() dto: CreateSessionDto) {
    return this.liveService.createSession(user.teacherProfile?.id ?? user.id, {
      ...dto,
      scheduledAt: new Date(dto.scheduledAt),
    });
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List live sessions for tenant' })
  findAll(@Request() req: any) {
    return this.liveService.findAll(req.tenant?.id, {});
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get session details' })
  findOne(@Param('id') id: string) {
    return this.liveService.findOne(id);
  }

  @Patch('sessions/:id/start')
  @ApiOperation({ summary: 'Start a scheduled session' })
  start(@Param('id') id: string, @CurrentUser() user: any) {
    return this.liveService.startSession(id, user.teacherProfile?.id ?? user.id);
  }

  @Patch('sessions/:id/end')
  @ApiOperation({ summary: 'End a live session' })
  end(@Param('id') id: string, @CurrentUser() user: any) {
    return this.liveService.endSession(id, user.teacherProfile?.id ?? user.id);
  }

  @Post('sessions/:id/join')
  @ApiOperation({ summary: 'Join a live session' })
  join(@Param('id') id: string, @CurrentUser() user: any) {
    return this.liveService.joinSession(id, user.id);
  }

  @Post('sessions/:id/leave')
  @ApiOperation({ summary: 'Leave a live session' })
  leave(@Param('id') id: string, @CurrentUser() user: any) {
    return this.liveService.leaveSession(id, user.id);
  }

  @Get('sessions/:id/participants')
  @ApiOperation({ summary: 'Get active participants' })
  participants(@Param('id') id: string) {
    return this.liveService.getParticipants(id);
  }
}
