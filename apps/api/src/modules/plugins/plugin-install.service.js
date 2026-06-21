"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PluginInstallService = void 0;
var _common = require("@nestjs/common");
var _prisma = require("../database/prisma.service");
var _pluginRegistry = require("./plugin-registry.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = void 0 && (void 0).__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = void 0 && (void 0).__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

let PluginInstallService = exports.PluginInstallService = class PluginInstallService {
  constructor(prisma, registry) {
    this.prisma = prisma;
    this.registry = registry;
  }
  async installPlugin(tenantId, pluginId, config = {}) {
    const listing = this.registry.getPlugin(pluginId);
    const existing = await this.prisma.installedPlugin.findUnique({
      where: {
        tenantId_pluginId: {
          tenantId,
          pluginId
        }
      }
    });
    if (existing) {
      throw new _common.ConflictException('Plugin is already installed for this tenant');
    }
    const record = await this.prisma.installedPlugin.create({
      data: {
        tenantId,
        pluginId,
        config: config,
        isEnabled: true,
        isActive: true
      }
    });
    return this.toDto(record, listing);
  }
  async uninstallPlugin(tenantId, pluginId) {
    const existing = await this.prisma.installedPlugin.findUnique({
      where: {
        tenantId_pluginId: {
          tenantId,
          pluginId
        }
      }
    });
    if (!existing) {
      throw new _common.NotFoundException('Plugin is not installed');
    }
    await this.prisma.installedPlugin.delete({
      where: {
        tenantId_pluginId: {
          tenantId,
          pluginId
        }
      }
    });
  }
  async getInstalledPlugins(tenantId) {
    const records = await this.prisma.installedPlugin.findMany({
      where: {
        tenantId
      },
      orderBy: {
        installedAt: 'desc'
      }
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
  async updatePluginConfig(tenantId, pluginId, config) {
    const existing = await this.prisma.installedPlugin.findUnique({
      where: {
        tenantId_pluginId: {
          tenantId,
          pluginId
        }
      }
    });
    if (!existing) {
      throw new _common.NotFoundException('Plugin is not installed');
    }
    const record = await this.prisma.installedPlugin.update({
      where: {
        tenantId_pluginId: {
          tenantId,
          pluginId
        }
      },
      data: {
        config: config
      }
    });
    const listing = this.registry.getPlugin(pluginId);
    return this.toDto(record, listing);
  }
  async togglePlugin(tenantId, pluginId, enabled) {
    const existing = await this.prisma.installedPlugin.findUnique({
      where: {
        tenantId_pluginId: {
          tenantId,
          pluginId
        }
      }
    });
    if (!existing) {
      throw new _common.NotFoundException('Plugin is not installed');
    }
    const record = await this.prisma.installedPlugin.update({
      where: {
        tenantId_pluginId: {
          tenantId,
          pluginId
        }
      },
      data: {
        isEnabled: enabled
      }
    });
    const listing = this.registry.getPlugin(pluginId);
    return this.toDto(record, listing);
  }
  toDto(record, listing) {
    return {
      id: record.id,
      tenantId: record.tenantId,
      pluginId: record.pluginId,
      version: listing?.version ?? 'unknown',
      enabled: record.isEnabled,
      config: record.config ?? {},
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
      permissions: listing?.permissions ?? []
    };
  }
};
exports.PluginInstallService = PluginInstallService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_pluginRegistry.PluginRegistryService)), __metadata("design:paramtypes", [Object, Object])], PluginInstallService);