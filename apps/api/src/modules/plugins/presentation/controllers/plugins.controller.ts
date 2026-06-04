import { Controller, Get, Post, Delete, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PluginsService } from '../../plugins.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../tenants/guards/tenant.guard';

@ApiTags('plugins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('plugins')
export class PluginsController {
  constructor(private readonly pluginsService: PluginsService) {}

  @Get('marketplace')
  @ApiOperation({ summary: 'Browse plugin marketplace' })
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
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('marketplace/categories')
  @ApiOperation({ summary: 'Get plugin categories' })
  getCategories() {
    return this.pluginsService.getPluginCategories();
  }

  @Get('marketplace/:pluginId')
  @ApiOperation({ summary: 'Get plugin details' })
  getPlugin(@Param('pluginId') pluginId: string) {
    return this.pluginsService.getPlugin(pluginId);
  }

  @Get('installed')
  @ApiOperation({ summary: 'List installed plugins for tenant' })
  getInstalled(@Req() req: any) {
    return this.pluginsService.getInstalledPlugins(req.tenantId);
  }

  @Post('install/:pluginId')
  @ApiOperation({ summary: 'Install a plugin' })
  install(
    @Req() req: any,
    @Param('pluginId') pluginId: string,
    @Body() body: { config?: Record<string, any> },
  ) {
    return this.pluginsService.installPlugin(req.tenantId, pluginId, body.config);
  }

  @Delete('uninstall/:pluginId')
  @ApiOperation({ summary: 'Uninstall a plugin' })
  uninstall(@Req() req: any, @Param('pluginId') pluginId: string) {
    return this.pluginsService.uninstallPlugin(req.tenantId, pluginId);
  }

  @Patch(':pluginId/toggle')
  @ApiOperation({ summary: 'Enable or disable an installed plugin' })
  toggle(
    @Req() req: any,
    @Param('pluginId') pluginId: string,
    @Body() body: { isEnabled: boolean },
  ) {
    return this.pluginsService.togglePlugin(req.tenantId, pluginId, body.isEnabled);
  }

  @Patch(':pluginId/config')
  @ApiOperation({ summary: 'Update plugin configuration' })
  updateConfig(
    @Req() req: any,
    @Param('pluginId') pluginId: string,
    @Body() body: { config: Record<string, any> },
  ) {
    return this.pluginsService.updatePluginConfig(req.tenantId, pluginId, body.config);
  }
}
