/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Post, Delete, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { TenantGuard } from '../../../core/guards/tenant.guard';
import { PluginInstallService } from '../../plugin-install.service';
import { PluginRegistryService } from '../../plugin-registry.service';
import { PluginsService } from '../../plugins.service';

@ApiTags('plugins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('plugins')
export class PluginsController {
  constructor(
    private readonly pluginsService: PluginsService,
    private readonly registry: PluginRegistryService,
    private readonly installer: PluginInstallService,
  ) {}

  // ─── Catalog (built-in registry) ────────────────────────────────────────────

  @Get('catalog')
  @ApiOperation({ summary: 'Browse the built-in plugin catalog' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'free', required: false, type: Boolean })
  listCatalog(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('free') free?: string,
  ) {
    return this.registry.listPlugins({
      search,
      category,
      free: free === 'true' ? true : undefined,
    });
  }

  @Get('catalog/categories')
  @ApiOperation({ summary: 'Get available plugin categories from catalog' })
  getCatalogCategories() {
    return this.registry.getCategories();
  }

  @Get('catalog/:pluginId')
  @ApiOperation({ summary: 'Get catalog plugin details' })
  getCatalogPlugin(@Param('pluginId') pluginId: string) {
    return this.registry.getPlugin(pluginId);
  }

  // ─── Installed plugins (catalog-backed) ─────────────────────────────────────

  @Post('installed')
  @ApiOperation({ summary: 'Install a plugin for this tenant (catalog-backed)' })
  installFromCatalog(
    @Req() req: any,
    @Body() body: { pluginId: string; config?: Record<string, unknown> },
  ) {
    return this.installer.installPlugin(req.tenantId, body.pluginId, body.config);
  }

  @Get('installed')
  @ApiOperation({ summary: 'List installed plugins for this tenant' })
  getInstalled(@Req() req: any) {
    return this.installer.getInstalledPlugins(req.tenantId);
  }

  @Delete('installed/:pluginId')
  @ApiOperation({ summary: 'Uninstall a plugin' })
  uninstallCatalog(@Req() req: any, @Param('pluginId') pluginId: string) {
    return this.installer.uninstallPlugin(req.tenantId, pluginId);
  }

  @Patch('installed/:pluginId/config')
  @ApiOperation({ summary: 'Update plugin configuration' })
  updateConfigCatalog(
    @Req() req: any,
    @Param('pluginId') pluginId: string,
    @Body() body: { config: Record<string, unknown> },
  ) {
    return this.installer.updatePluginConfig(req.tenantId, pluginId, body.config);
  }

  @Patch('installed/:pluginId/toggle')
  @ApiOperation({ summary: 'Enable or disable an installed plugin' })
  toggleCatalog(
    @Req() req: any,
    @Param('pluginId') pluginId: string,
    @Body() body: { enabled: boolean },
  ) {
    return this.installer.togglePlugin(req.tenantId, pluginId, body.enabled);
  }

  // ─── Legacy marketplace (DB-backed) ─────────────────────────────────────────

  @Get('marketplace')
  @ApiOperation({ summary: 'Browse plugin marketplace (DB-backed)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listMarketplace(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.pluginsService.listMarketplace(req.tenantId, {
      search,
      category,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('marketplace/categories')
  @ApiOperation({ summary: 'Get plugin categories (DB-backed)' })
  getCategories() {
    return this.pluginsService.getPluginCategories();
  }

  @Get('marketplace/:pluginId')
  @ApiOperation({ summary: 'Get plugin details (DB-backed)' })
  getPlugin(@Param('pluginId') pluginId: string) {
    return this.pluginsService.getPlugin(pluginId);
  }

  @Post('install/:pluginId')
  @ApiOperation({ summary: 'Install a DB-backed plugin' })
  install(
    @Req() req: any,
    @Param('pluginId') pluginId: string,
    @Body() body: { config?: Record<string, unknown> },
  ) {
    return this.pluginsService.installPlugin(req.tenantId, pluginId, body.config);
  }

  @Delete('uninstall/:pluginId')
  @ApiOperation({ summary: 'Uninstall a DB-backed plugin' })
  uninstall(@Req() req: any, @Param('pluginId') pluginId: string) {
    return this.pluginsService.uninstallPlugin(req.tenantId, pluginId);
  }

  @Patch(':pluginId/toggle')
  @ApiOperation({ summary: 'Enable or disable an installed DB-backed plugin' })
  toggle(
    @Req() req: any,
    @Param('pluginId') pluginId: string,
    @Body() body: { isEnabled: boolean },
  ) {
    return this.pluginsService.togglePlugin(req.tenantId, pluginId, body.isEnabled);
  }

  @Patch(':pluginId/config')
  @ApiOperation({ summary: 'Update DB-backed plugin configuration' })
  updateConfig(
    @Req() req: any,
    @Param('pluginId') pluginId: string,
    @Body() body: { config: Record<string, unknown> },
  ) {
    return this.pluginsService.updatePluginConfig(req.tenantId, pluginId, body.config);
  }

  @Get(':pluginId/sandbox-meta')
  @ApiOperation({ summary: 'Get sandbox metadata for a plugin' })
  getSandboxMeta(@Param('pluginId') pluginId: string) {
    return this.pluginsService.getPluginSandboxMeta(pluginId);
  }
}
