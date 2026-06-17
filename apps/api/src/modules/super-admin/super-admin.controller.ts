import {
  Controller, Get, Patch, Put, Delete, Post, Param, Query, Body,
  UseGuards, HttpCode, HttpStatus, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole, SubscriptionPlan, AuditAction } from '@prisma/client';

import { CurrentUser, CurrentUserPayload } from '../core/decorators/current-user.decorator';
import { Roles } from '../core/decorators/roles.decorator';
import { JwtAuthGuard } from '../core/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';

import { SuperAdminService } from './super-admin.service';


@ApiTags('Super Admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  // ─── Platform Overview ──────────────────────────────────────────────────────

  @Get('overview')
  @ApiOperation({ summary: 'Platform KPIs: total tenants, users, MRR, AI cost/day, uptime' })
  overview() {
    return this.superAdminService.getPlatformOverview();
  }

  @Get('system-health')
  @ApiOperation({ summary: 'Service health status (DB, Redis, queues)' })
  systemHealth() {
    return this.superAdminService.getSystemHealth();
  }

  /** Legacy alias kept for backwards compat with existing frontend */
  @Get('health')
  @ApiOperation({ summary: 'System health check (alias)' })
  health() {
    return this.superAdminService.getSystemHealth();
  }

  // ─── Tenants ────────────────────────────────────────────────────────────────

  @Get('tenants')
  @ApiOperation({ summary: 'Paginated tenant list with search, plan filter, status filter' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'plan', required: false, enum: SubscriptionPlan })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'suspended'] })
  tenants(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('search') search?: string,
    @Query('plan') plan?: SubscriptionPlan,
    @Query('status') status?: 'active' | 'suspended',
  ) {
    return this.superAdminService.getTenants(+page, +limit, search, plan, status);
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Tenant details: users, subscription, usage, feature flags' })
  tenantDetails(@Param('id') id: string) {
    return this.superAdminService.getTenantDetails(id);
  }

  @Put('tenants/:id/status')
  @ApiOperation({ summary: 'Activate or suspend a tenant' })
  updateTenantStatus(
    @Param('id') id: string,
    @Body() dto: { isActive: boolean },
    @CurrentUser() admin: CurrentUserPayload,
    @Request() req: { ip?: string },
  ) {
    return this.superAdminService.updateTenantStatus(id, dto.isActive, admin.id, req.ip);
  }

  @Put('tenants/:id/plan')
  @ApiOperation({ summary: 'Override subscription plan for a tenant' })
  overrideTenantPlan(
    @Param('id') id: string,
    @Body() dto: { plan: SubscriptionPlan },
    @CurrentUser() admin: CurrentUserPayload,
    @Request() req: { ip?: string },
  ) {
    return this.superAdminService.overrideTenantPlan(id, dto.plan, admin.id, req.ip);
  }

  /** Legacy PATCH — kept for existing frontend usage */
  @Patch('tenants/:id')
  @ApiOperation({ summary: 'Update tenant plan, status, or details (legacy)' })
  updateTenant(
    @Param('id') id: string,
    @Body() dto: { name?: string; plan?: SubscriptionPlan; isActive?: boolean; domain?: string },
    @CurrentUser() admin: CurrentUserPayload,
    @Request() req: { ip?: string },
  ) {
    return this.superAdminService.updateTenantLegacy(id, dto, admin.id, req.ip);
  }

  @Delete('tenants/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a tenant and all its data' })
  deleteTenant(
    @Param('id') id: string,
    @CurrentUser() admin: CurrentUserPayload,
    @Request() req: { ip?: string },
  ) {
    return this.superAdminService.deleteTenant(id, admin.id, req.ip);
  }

  @Post('tenants/:id/impersonate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate short-lived impersonation token for a tenant admin' })
  impersonateTenantAdmin(
    @Param('id') tenantId: string,
    @CurrentUser() admin: CurrentUserPayload,
    @Request() req: { ip?: string },
  ) {
    return this.superAdminService.impersonateTenantAdmin(tenantId, admin.id, req.ip);
  }

  // ─── Users ──────────────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'Paginated user list across all tenants' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive'] })
  users(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: 'active' | 'inactive',
  ) {
    return this.superAdminService.getUsers(+page, +limit, search, role, tenantId, status);
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: 'Change user role' })
  changeUserRole(
    @Param('id') id: string,
    @Body() dto: { role: UserRole },
    @CurrentUser() admin: CurrentUserPayload,
    @Request() req: { ip?: string },
  ) {
    return this.superAdminService.changeUserRole(id, dto.role, admin.id, req.ip);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Permanently delete a user (GDPR)' })
  deleteUser(
    @Param('id') id: string,
    @CurrentUser() admin: CurrentUserPayload,
    @Request() req: { ip?: string },
  ) {
    return this.superAdminService.deleteUser(id, admin.id, req.ip);
  }

  /** Legacy PATCH — kept for existing frontend usage */
  @Patch('users/:id')
  @ApiOperation({ summary: 'Update any user role or active status (legacy)' })
  updateUser(
    @Param('id') id: string,
    @Body() dto: { role?: UserRole; isActive?: boolean },
    @CurrentUser() admin: CurrentUserPayload,
    @Request() req: { ip?: string },
  ) {
    return this.superAdminService.updateUserLegacy(id, dto, admin.id, req.ip);
  }

  // ─── AI Usage ───────────────────────────────────────────────────────────────

  @Get('ai-usage')
  @ApiOperation({ summary: 'AI usage and cost breakdown by tenant and model' })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date string' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date string' })
  aiUsage(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.superAdminService.getAiUsage(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  // ─── Audit Log ──────────────────────────────────────────────────────────────

  @Get('audit-log')
  @ApiOperation({ summary: 'Platform-wide audit log with tenant/user filter' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date string' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date string' })
  auditLog(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('tenantId') tenantId?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: AuditAction,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.superAdminService.getPlatformAuditLog(+page, +limit, {
      tenantId,
      userId,
      action,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  // ─── Billing (legacy endpoint) ──────────────────────────────────────────────

  @Get('billing')
  @ApiOperation({ summary: 'Platform-wide billing and revenue overview' })
  billing() {
    return this.superAdminService.getBillingOverview();
  }

  // ─── Impersonate (legacy endpoint) ─────────────────────────────────────────

  @Post('impersonate/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate a short-lived token to impersonate any user (legacy)' })
  impersonate(
    @Param('userId') userId: string,
    @CurrentUser() admin: CurrentUserPayload,
    @Request() req: { ip?: string },
  ) {
    return this.superAdminService.impersonateUser(userId, admin.id, req.ip);
  }
}
