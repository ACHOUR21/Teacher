/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Res,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Response } from 'express';

import { Public } from '../../../core/decorators/public.decorator';
import { Roles } from '../../../core/decorators/roles.decorator';
import { TenantId } from '../../../core/decorators/tenant.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { CustomDomainDto } from '../../dto/custom-domain.dto';
import { UpdateBrandingDto } from '../../dto/update-branding.dto';
import { WhiteLabelService } from '../../white-label.service';

@ApiTags('White Label')
@Controller('white-label')
export class WhiteLabelController {
  constructor(private readonly whiteLabelService: WhiteLabelService) {}

  // ─── Branding ───────────────────────────────────────────────────────────────

  @Get('branding')
  @Public()
  @ApiOperation({ summary: 'Get resolved branding for the current tenant (with defaults fallback)' })
  @ApiResponse({ status: 200, description: 'TenantBranding object' })
  getBranding(@TenantId() tenantId: string) {
    return this.whiteLabelService.getBranding(tenantId);
  }

  @Put('branding')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update branding settings for the current tenant' })
  @ApiResponse({ status: 200, description: 'Updated TenantBranding object' })
  updateBranding(@TenantId() tenantId: string, @Body() dto: UpdateBrandingDto) {
    return this.whiteLabelService.updateBranding(tenantId, dto);
  }

  @Get('branding/css')
  @Public()
  @ApiOperation({ summary: 'Returns a text/css stylesheet with CSS custom properties for the tenant brand' })
  @ApiResponse({ status: 200, description: 'CSS string', content: { 'text/css': {} } })
  async getBrandingCss(@TenantId() tenantId: string, @Res() res: Response) {
    const branding = await this.whiteLabelService.getBranding(tenantId);
    const css = this.whiteLabelService.generateCssVariables(branding);
    const customCss = branding.customCss ? `\n\n/* Custom CSS */\n${branding.customCss}` : '';
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(`${css}${customCss}`);
  }

  // ─── Custom Domain ──────────────────────────────────────────────────────────

  @Post('domain/validate')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Check DNS TXT record to validate custom domain ownership' })
  @ApiResponse({ status: 200, description: '{ valid: boolean; txtRecord: string }' })
  validateDomain(@TenantId() tenantId: string, @Body() dto: CustomDomainDto) {
    return this.whiteLabelService.validateCustomDomain(tenantId, dto.domain);
  }

  @Post('domain/register')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Register a custom domain and trigger cert provisioning (pending DNS verification)' })
  @ApiResponse({ status: 204, description: 'Domain registered successfully' })
  async registerDomain(@TenantId() tenantId: string, @Body() dto: CustomDomainDto) {
    await this.whiteLabelService.registerCustomDomain(tenantId, dto.domain);
  }

  // ─── Legacy endpoints (kept for backward compatibility) ─────────────────────

  @Get('settings')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '[Deprecated] Get tenant white-label settings — use GET /branding instead' })
  getSettings(@Request() req: any) {
    return this.whiteLabelService.getSettings(req.tenant?.id ?? req.tenantId);
  }

  @Put('settings')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Deprecated] Update white-label settings — use PUT /branding instead' })
  updateSettings(@Request() req: any, @Body() body: any) {
    return this.whiteLabelService.upsertSettings(req.tenant?.id ?? req.tenantId, body);
  }

  @Get('theme.css')
  @Public()
  @ApiOperation({ summary: '[Deprecated] Get generated CSS theme — use GET /branding/css instead' })
  async getThemeCSS(@Request() req: any) {
    const css = await this.whiteLabelService.generateThemeCSS(req.tenant?.id ?? req.tenantId);
    return css;
  }

  @Get('by-domain/:domain')
  @Public()
  @ApiOperation({ summary: 'Resolve tenant by custom domain' })
  getByDomain(@Param('domain') domain: string) {
    return this.whiteLabelService.getByDomain(domain);
  }

  // ─── Additional endpoints ───────────────────────────────────────────────────

  @Get('domain')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SCHOOL_ADMIN, UserRole.UNIVERSITY_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get custom domain configuration for tenant' })
  getCustomDomain(@TenantId() tenantId: string) {
    return this.whiteLabelService.getCustomDomain(tenantId);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reset all white-label customizations to platform defaults' })
  resetToDefaults(@TenantId() tenantId: string) {
    return this.whiteLabelService.resetToDefaults(tenantId);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Export full branding configuration as JSON snapshot' })
  exportBrandingConfig(@TenantId() tenantId: string) {
    return this.whiteLabelService.exportBrandingConfig(tenantId);
  }

  @Post('import')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Import branding from a JSON snapshot' })
  importBrandingConfig(@TenantId() tenantId: string, @Body() body: any) {
    return this.whiteLabelService.importBrandingConfig(tenantId, body);
  }
}
