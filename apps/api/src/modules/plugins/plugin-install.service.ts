/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

import { PluginRegistryService } from './plugin-registry.service';

export interface InstalledPluginDto {
  id: string;
  tenantId: string;
  pluginId: string;
  version: string;
  enabled: boolean;
  config: Record<string, unknown>;
  installedAt: Date;
  name: string;
  description: string;
  category: string;
  author: string;
  iconUrl: string;
  price: number;
  rating: number;
  installs: number;
  tags: string[];
  permissions: string[];
}

@Injectable()
export class PluginInstallService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: PluginRegistryService,
  ) {}

  async installPlugin(
    tenantId: string,
    pluginId: string,
    config: Record<string, unknown> = {},
  ): Promise<InstalledPluginDto> {
    const listing = this.registry.getPlugin(pluginId);

    const existing = await this.prisma.installedPlugin.findUnique({
      where: { tenantId_pluginId: { tenantId, pluginId } },
    });
    if (existing) {
      throw new ConflictException('Plugin is already installed for this tenant');
    }

    const record = await this.prisma.installedPlugin.create({
      data: {
        tenantId,
        pluginId,
        config: config as any,
        isEnabled: true,
        isActive: true,
      },
    });

    return this.toDto(record, listing);
  }

  async uninstallPlugin(tenantId: string, pluginId: string): Promise<void> {
    const existing = await this.prisma.installedPlugin.findUnique({
      where: { tenantId_pluginId: { tenantId, pluginId } },
    });
    if (!existing) {
      throw new NotFoundException('Plugin is not installed');
    }

    await this.prisma.installedPlugin.delete({
      where: { tenantId_pluginId: { tenantId, pluginId } },
    });
  }

  async getInstalledPlugins(tenantId: string): Promise<InstalledPluginDto[]> {
    const records = await this.prisma.installedPlugin.findMany({
      where: { tenantId },
      orderBy: { installedAt: 'desc' },
    });

    return records.map(record => {
      try {
        const listing = this.registry.getPlugin(record.pluginId);
        return this.toDto(record, listing);
      } catch {
        // Plugin removed from catalog — return minimal record
        return this.toDto(record, null);
      }
    });
  }

  async updatePluginConfig(
    tenantId: string,
    pluginId: string,
    config: Record<string, unknown>,
  ): Promise<InstalledPluginDto> {
    const existing = await this.prisma.installedPlugin.findUnique({
      where: { tenantId_pluginId: { tenantId, pluginId } },
    });
    if (!existing) {
      throw new NotFoundException('Plugin is not installed');
    }

    const record = await this.prisma.installedPlugin.update({
      where: { tenantId_pluginId: { tenantId, pluginId } },
      data: { config: config as any },
    });

    const listing = this.registry.getPlugin(pluginId);
    return this.toDto(record, listing);
  }

  async togglePlugin(
    tenantId: string,
    pluginId: string,
    enabled: boolean,
  ): Promise<InstalledPluginDto> {
    const existing = await this.prisma.installedPlugin.findUnique({
      where: { tenantId_pluginId: { tenantId, pluginId } },
    });
    if (!existing) {
      throw new NotFoundException('Plugin is not installed');
    }

    const record = await this.prisma.installedPlugin.update({
      where: { tenantId_pluginId: { tenantId, pluginId } },
      data: { isEnabled: enabled },
    });

    const listing = this.registry.getPlugin(pluginId);
    return this.toDto(record, listing);
  }

  private toDto(
    record: {
      id: string;
      tenantId: string;
      pluginId: string;
      config: unknown;
      isEnabled: boolean;
      installedAt: Date;
    },
    listing: {
      version?: string;
      name?: string;
      description?: string;
      category?: string;
      author?: string;
      iconUrl?: string;
      price?: number;
      rating?: number;
      installs?: number;
      tags?: string[];
      permissions?: string[];
    } | null,
  ): InstalledPluginDto {
    return {
      id: record.id,
      tenantId: record.tenantId,
      pluginId: record.pluginId,
      version: listing?.version ?? 'unknown',
      enabled: record.isEnabled,
      config: (record.config as Record<string, unknown>) ?? {},
      installedAt: record.installedAt,
      name: listing?.name ?? record.pluginId,
      description: listing?.description ?? '',
      category: listing?.category ?? '',
      author: listing?.author ?? '',
      iconUrl: listing?.iconUrl ?? '',
      price: listing?.price ?? 0,
      rating: listing?.rating ?? 0,
      installs: listing?.installs ?? 0,
      tags: listing?.tags ?? [],
      permissions: listing?.permissions ?? [],
    };
  }
}
