/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Post, Delete, Patch, Param, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsString, IsArray, IsOptional, IsInt, IsBoolean, IsDateString, Min, IsNumber } from 'class-validator';

import { Roles } from '../../../core/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { ApiEcosystemService } from '../../api-ecosystem.service';
import { ApiKeysService, CreateApiKeyDto } from '../../api-keys.service';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

class CreateApiKeyBodyDto implements CreateApiKeyDto {
  @IsString() name: string;
  @IsArray() @IsString({ each: true }) scopes: string[];
  @IsOptional() @IsInt() @Min(100) rateLimit?: number;
  @IsOptional() @IsNumber() expiresInDays?: number;
}

class LegacyCreateApiKeyDto {
  @IsString() name: string;
  @IsArray() @IsString({ each: true }) scopes: string[];
  @IsOptional() @IsInt() @Min(100) rateLimit?: number;
  @IsOptional() @IsDateString() expiresAt?: string;
}

class CreateWebhookDto {
  @IsString() url: string;
  @IsArray() @IsString({ each: true }) events: string[];
}

class ToggleApiKeyDto {
  @IsBoolean() isActive: boolean;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@ApiTags('API Ecosystem')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api-ecosystem')
export class ApiEcosystemController {
  constructor(
    private readonly apiEcosystemService: ApiEcosystemService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  // ── Usage Stats ──────────────────────────────────────────────────────────────

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  @ApiOperation({ summary: 'Get API ecosystem usage statistics' })
  getStats(@Request() req: any) {
    return this.apiEcosystemService.getUsageStats(req.tenant?.id);
  }

  // ── Legacy tenant-scoped key routes ─────────────────────────────────────────

  @Get('keys')
  @ApiOperation({ summary: 'List API keys (tenant scope)' })
  listKeys(@Request() req: any) {
    return this.apiEcosystemService.listApiKeys(req.tenant?.id);
  }

  @Post('keys')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create API key (legacy tenant scope)' })
  createKey(@Request() req: any, @Body() dto: LegacyCreateApiKeyDto) {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    return this.apiEcosystemService.createApiKey(req.tenant?.id, dto.name, dto.scopes, dto.rateLimit, expiresAt);
  }

  @Delete('keys/:id')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Revoke API key (legacy)' })
  revokeKey(@Param('id') id: string, @Request() req: any) {
    return this.apiEcosystemService.revokeApiKey(id, req.tenant?.id);
  }

  @Patch('keys/:id/toggle')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Enable or disable an API key' })
  @ApiBody({ type: ToggleApiKeyDto })
  toggleKey(@Param('id') id: string, @Request() req: any, @Body() dto: ToggleApiKeyDto) {
    return this.apiEcosystemService.toggleApiKey(id, req.tenant?.id, dto.isActive);
  }

  // ── User-scoped API key routes (/api-keys) ───────────────────────────────────

  @Post('api-keys')
  @ApiOperation({ summary: 'Create API key for the authenticated user' })
  async createUserApiKey(@Request() req: any, @Body() dto: CreateApiKeyBodyDto) {
    const userId: string = req.user?.id ?? req.user?.sub;
    const tenantId: string = req.tenant?.id ?? req.user?.tenantId;
    return this.apiKeysService.createApiKey(userId, tenantId, dto);
  }

  @Get('api-keys')
  @ApiOperation({ summary: 'List API keys for the authenticated user' })
  listUserApiKeys(@Request() req: any) {
    const userId: string = req.user?.id ?? req.user?.sub;
    const tenantId: string = req.tenant?.id ?? req.user?.tenantId;
    return this.apiKeysService.listApiKeys(userId, tenantId);
  }

  @Delete('api-keys/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a user API key' })
  async revokeUserApiKey(@Param('id') id: string, @Request() req: any) {
    const userId: string = req.user?.id ?? req.user?.sub;
    const tenantId: string = req.tenant?.id ?? req.user?.tenantId;
    await this.apiKeysService.revokeApiKey(userId, tenantId, id);
  }

  @Get('api-keys/usage')
  @ApiOperation({ summary: 'Get per-key usage stats for the authenticated user' })
  getUserApiKeyUsage(@Request() req: any) {
    const userId: string = req.user?.id ?? req.user?.sub;
    const tenantId: string = req.tenant?.id ?? req.user?.tenantId;
    return this.apiKeysService.getUsageStats(userId, tenantId);
  }

  // ── Webhooks ─────────────────────────────────────────────────────────────────

  @Get('webhooks')
  @ApiOperation({ summary: 'List webhook endpoints' })
  listWebhooks(@Request() req: any) {
    return this.apiEcosystemService.listWebhooks(req.tenant?.id);
  }

  @Post('webhooks')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create webhook endpoint' })
  createWebhook(@Request() req: any, @Body() dto: CreateWebhookDto) {
    return this.apiEcosystemService.createWebhook(req.tenant?.id, dto.url, dto.events);
  }

  @Delete('webhooks/:id')
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Disable (soft-delete) a webhook endpoint' })
  deleteWebhook(@Param('id') id: string, @Request() req: any) {
    return this.apiEcosystemService.deleteWebhook(id, req.tenant?.id);
  }
}
