import { Controller, Get, Post, Delete, Put, Body, Request, HttpCode, HttpStatus, UseGuards, Ip, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConsentType } from '@prisma/client';

import { CurrentUser } from '../core/decorators/current-user.decorator';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';

import { GdprService } from './gdpr.service';

import type { CurrentUserPayload } from '../core/decorators/current-user.decorator';


@ApiTags('GDPR')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('gdpr')
export class GdprController {
  constructor(private readonly gdpr: GdprService) {}

  @Get('export')
  @ApiOperation({ summary: 'Export all personal data (GDPR Article 15/20)' })
  async exportData(@CurrentUser() user: CurrentUserPayload) {
    return this.gdpr.exportUserData(user.id);
  }

  @Get('consents')
  @ApiOperation({ summary: 'Get current consent records' })
  async getConsents(@CurrentUser() user: CurrentUserPayload) {
    return this.gdpr.getConsents(user.id);
  }

  @Put('consents')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update consent preferences' })
  async updateConsents(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { consents: { type: ConsentType; granted: boolean; version?: string }[] },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    await this.gdpr.upsertConsents(user.id, user.tenantId, body.consents, { ipAddress: ip, userAgent });
    return { message: 'Consents updated' };
  }

  @Get('deletion-request')
  @ApiOperation({ summary: 'Get current deletion request status' })
  async getDeletion(@CurrentUser() user: CurrentUserPayload) {
    return this.gdpr.getDeletionRequest(user.id);
  }

  @Post('deletion-request')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request account deletion (30-day grace period)' })
  async requestDeletion(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { reason?: string },
  ) {
    return this.gdpr.requestDeletion(user.id, user.tenantId, body.reason);
  }

  @Delete('deletion-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending deletion request' })
  async cancelDeletion(@CurrentUser() user: CurrentUserPayload) {
    await this.gdpr.cancelDeletion(user.id);
    return { message: 'Deletion request cancelled — your account has been reactivated' };
  }
}
