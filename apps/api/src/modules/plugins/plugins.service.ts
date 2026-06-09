import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

import { PluginSandboxService } from './application/plugin-sandbox.service';

@Injectable()
export class PluginsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sandbox: PluginSandboxService,
  ) {}

  async listMarketplace(tenantId: string, query: { search?: string; category?: string; page?: number; limit?: number }) {
    const { search, category, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (search) {where.name = { contains: search, mode: 'insensitive' };}
    if (category) {where.category = category;}

    const [data, total] = await Promise.all([
      this.prisma.plugin.findMany({ where, skip, take: limit, orderBy: { installCount: 'desc' } }),
      this.prisma.plugin.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getPlugin(pluginId: string) {
    const plugin = await this.prisma.plugin.findUnique({ where: { id: pluginId } });
    if (!plugin) {throw new NotFoundException('Plugin not found');}
    return plugin;
  }

  async getInstalledPlugins(tenantId: string) {
    return this.prisma.installedPlugin.findMany({
      where: { tenantId },
      include: { plugin: true },
      orderBy: { installedAt: 'desc' },
    });
  }

  async installPlugin(tenantId: string, pluginId: string, config: Record<string, any> = {}) {
    const plugin = await this.prisma.plugin.findUnique({ where: { id: pluginId } });
    if (!plugin) {throw new NotFoundException('Plugin not found');}

    // Validate manifest before allowing installation
    this.sandbox.validateManifest(plugin.manifest);

    const existing = await this.prisma.installedPlugin.findUnique({
      where: { tenantId_pluginId: { tenantId, pluginId } },
    });
    if (existing) {throw new ConflictException('Plugin already installed');}

    const [installed] = await this.prisma.$transaction([
      this.prisma.installedPlugin.create({
        data: { tenantId, pluginId, config, isEnabled: true },
        include: { plugin: true },
      }),
      this.prisma.plugin.update({
        where: { id: pluginId },
        data: { installCount: { increment: 1 } },
      }),
    ]);

    return installed;
  }

  async uninstallPlugin(tenantId: string, pluginId: string) {
    const installed = await this.prisma.installedPlugin.findUnique({
      where: { tenantId_pluginId: { tenantId, pluginId } },
    });
    if (!installed) {throw new NotFoundException('Plugin not installed');}

    await this.prisma.$transaction([
      this.prisma.installedPlugin.delete({ where: { tenantId_pluginId: { tenantId, pluginId } } }),
      this.prisma.plugin.update({ where: { id: pluginId }, data: { installCount: { decrement: 1 } } }),
    ]);

    return { message: 'Plugin uninstalled' };
  }

  async togglePlugin(tenantId: string, pluginId: string, isEnabled: boolean) {
    const installed = await this.prisma.installedPlugin.findUnique({
      where: { tenantId_pluginId: { tenantId, pluginId } },
    });
    if (!installed) {throw new NotFoundException('Plugin not installed');}

    return this.prisma.installedPlugin.update({
      where: { tenantId_pluginId: { tenantId, pluginId } },
      data: { isEnabled },
      include: { plugin: true },
    });
  }

  async updatePluginConfig(tenantId: string, pluginId: string, config: Record<string, any>) {
    const installed = await this.prisma.installedPlugin.findUnique({
      where: { tenantId_pluginId: { tenantId, pluginId } },
    });
    if (!installed) {throw new NotFoundException('Plugin not installed');}

    return this.prisma.installedPlugin.update({
      where: { tenantId_pluginId: { tenantId, pluginId } },
      data: { config },
      include: { plugin: true },
    });
  }

  async getPluginSandboxMeta(pluginId: string) {
    const plugin = await this.prisma.plugin.findUnique({ where: { id: pluginId } });
    if (!plugin) {throw new NotFoundException('Plugin not found');}
    const manifest = this.sandbox.validateManifest(plugin.manifest);
    return {
      sandbox: this.sandbox.buildSandboxAttribute(manifest),
      csp: this.sandbox.buildCsp(manifest),
      permissions: manifest.permissions,
      entrypoint: manifest.entrypoint,
    };
  }

  async getPluginCategories() {
    const plugins = await this.prisma.plugin.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });
    return plugins.map(p => p.category).filter(Boolean);
  }
}
