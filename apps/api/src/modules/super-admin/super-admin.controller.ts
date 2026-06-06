import {
  Controller, Get, Patch, Delete, Post, Param, Query, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import { UserRole, SubscriptionPlan } from '@prisma/client';

@ApiTags('Super Admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Platform-wide KPIs and charts' })
  overview() {
    return this.superAdminService.getPlatformOverview();
  }

  @Get('health')
  @ApiOperation({ summary: 'System health check' })
  health() {
    return this.superAdminService.getSystemHealth();
  }

  @Get('tenants')
  @ApiOperation({ summary: 'List all tenants across the platform' })
  tenants(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('plan') plan?: SubscriptionPlan,
  ) {
    return this.superAdminService.getTenants(+page, +limit, search, plan);
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Get tenant details with stats' })
  tenantDetails(@Param('id') id: string) {
    return this.superAdminService.getTenantDetails(id);
  }

  @Patch('tenants/:id')
  @ApiOperation({ summary: 'Update tenant plan, status, or details' })
  updateTenant(
    @Param('id') id: string,
    @Body() dto: { name?: string; plan?: SubscriptionPlan; isActive?: boolean; domain?: string },
  ) {
    return this.superAdminService.updateTenant(id, dto);
  }

  @Delete('tenants/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a tenant and all its data' })
  deleteTenant(@Param('id') id: string) {
    return this.superAdminService.deleteTenant(id);
  }

  @Get('users')
  @ApiOperation({ summary: 'Cross-tenant user search and listing' })
  users(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.superAdminService.getUsers(+page, +limit, search, role, tenantId);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update any user role or active status' })
  updateUser(
    @Param('id') id: string,
    @Body() dto: { role?: UserRole; isActive?: boolean },
  ) {
    return this.superAdminService.updateUser(id, dto);
  }

  @Get('billing')
  @ApiOperation({ summary: 'Platform-wide billing and revenue overview' })
  billing() {
    return this.superAdminService.getBillingOverview();
  }

  @Post('impersonate/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a short-lived token to impersonate any user' })
  impersonate(@Param('userId') userId: string) {
    return this.superAdminService.impersonate(userId);
  }
}
