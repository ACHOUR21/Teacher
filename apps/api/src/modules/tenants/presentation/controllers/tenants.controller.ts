import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation , ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';

import { CurrentUser, CurrentUserPayload } from '../../../core/decorators/current-user.decorator';
import { Roles } from '../../../core/decorators/roles.decorator';
import { TenantId } from '../../../core/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { PaginationDto } from '../../../core/pagination/pagination.dto';
import { TenantsService, CreateTenantDto, UpdateTenantDto } from '../../tenants.service';

class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  settings: Record<string, unknown>;
}

class UpdateOnboardingDto {
  @IsArray() completedSteps: number[];
  @IsBoolean() completed: boolean;
}

class UpdateTenantProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() website?: string;
}

@ApiTags('Tenants')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all tenants (Super Admin only)' })
  findAll(@Query() pagination: PaginationDto) {
    return this.tenantsService.findAll(pagination);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get tenant by ID' })
  findById(@Param('id') id: string) {
    return this.tenantsService.findById(id);
  }

  @Get('me/details')
  @ApiOperation({ summary: 'Get current tenant details' })
  getCurrentTenant(@TenantId() tenantId: string) {
    return this.tenantsService.findById(tenantId);
  }

  @Get('me/stats')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.UNIVERSITY_ADMIN)
  @ApiOperation({ summary: 'Get current tenant statistics' })
  getStats(@TenantId() tenantId: string) {
    return this.tenantsService.getStats(tenantId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create new tenant (Super Admin only)' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update tenant' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Put('me/settings')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.UNIVERSITY_ADMIN)
  @ApiOperation({ summary: 'Update current tenant settings' })
  updateSettings(
    @TenantId() tenantId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.tenantsService.updateSettings(tenantId, dto.settings);
  }

  @Get('me/onboarding')
  @ApiOperation({ summary: 'Get onboarding status for current tenant' })
  getOnboarding(@TenantId() tenantId: string) {
    return this.tenantsService.getOnboardingStatus(tenantId);
  }

  @Patch('me/onboarding')
  @ApiOperation({ summary: 'Update onboarding progress' })
  updateOnboarding(@TenantId() tenantId: string, @Body() dto: UpdateOnboardingDto) {
    return this.tenantsService.updateOnboarding(tenantId, dto.completedSteps, dto.completed);
  }

  @Patch('me/profile')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.UNIVERSITY_ADMIN)
  @ApiOperation({ summary: 'Update tenant profile (logo, description, website)' })
  updateProfile(@TenantId() tenantId: string, @Body() dto: UpdateTenantProfileDto) {
    return this.tenantsService.updateTenantProfile(tenantId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tenant (Super Admin only)' })
  delete(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.tenantsService.delete(id, user.id);
  }
}
