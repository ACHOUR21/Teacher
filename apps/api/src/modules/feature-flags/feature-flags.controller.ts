import { Controller, Get, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser, type CurrentUserPayload } from '../core/decorators/current-user.decorator';
import { Roles } from '../core/decorators/roles.decorator';
import { TenantId } from '../core/decorators/tenant.decorator';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';

import { type FeatureFlag } from './feature-flags.constants';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('Feature Flags')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly flagsService: FeatureFlagsService) {}

  @Get()
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all feature flags for current tenant context' })
  getAllFlags(@TenantId() tenantId: string, @CurrentUser() user: CurrentUserPayload) {
    return this.flagsService.getAllFlags({ tenantId, userId: user.id });
  }

  @Get(':flag')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Check if a specific feature flag is enabled' })
  async getFlag(
    @Param('flag') flag: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    const enabled = await this.flagsService.isEnabled(flag as FeatureFlag, { tenantId, userId: user.id });
    return { flag, enabled };
  }

  @Put('global/:flag')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Set global flag override (super admin)' })
  setGlobalFlag(
    @Param('flag') flag: string,
    @Body() body: { enabled: boolean },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.flagsService.setGlobalFlag(flag as FeatureFlag, body.enabled, user.id);
  }

  @Put('tenant/:flag')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Set tenant-level flag override (admin)' })
  setTenantFlag(
    @Param('flag') flag: string,
    @Body() body: { enabled: boolean },
    @TenantId() tenantId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.flagsService.setTenantFlag(flag as FeatureFlag, tenantId, body.enabled, user.id);
  }

  @Delete('global/:flag')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset global flag to default' })
  resetGlobalFlag(@Param('flag') flag: string) {
    return this.flagsService.resetFlag(flag as FeatureFlag);
  }

  @Delete('tenant/:flag')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reset tenant flag to default' })
  resetTenantFlag(@Param('flag') flag: string, @TenantId() tenantId: string) {
    return this.flagsService.resetFlag(flag as FeatureFlag, tenantId);
  }
}
