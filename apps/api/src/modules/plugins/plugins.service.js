"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PluginsService = void 0;
var _common = require("@nestjs/common");
var _prisma = require("../database/prisma.service");
var _pluginSandbox = require("./application/plugin-sandbox.service");
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
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

let PluginsService = exports.PluginsService = class PluginsService {
  constructor(prisma, sandbox) {
    this.prisma = prisma;
    this.sandbox = sandbox;
  }
  async listMarketplace(tenantId, query) {
    const {
      search,
      category,
      page = 1,
      limit = 20
    } = query;
    const skip = (page - 1) * limit;
    const where = {
      isActive: true
    };
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }
    if (category) {
      where.category = category;
    }
    const [data, total] = await Promise.all([this.prisma.plugin.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        installCount: 'desc'
      }
    }), this.prisma.plugin.count({
      where
    })]);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }
  async getPlugin(pluginId) {
    const plugin = await this.prisma.plugin.findUnique({
      where: {
        id: pluginId
      }
    });
    if (!plugin) {
      throw new _common.NotFoundException('Plugin not found');
    }
    return plugin;
  }
  async getInstalledPlugins(tenantId) {
    return this.prisma.installedPlugin.findMany({
      where: {
        tenantId
      },
      include: {
        plugin: true
      },
      orderBy: {
        installedAt: 'desc'
      }
    });
  }
  async installPlugin(tenantId, pluginId, config = {}) {
    const plugin = await this.prisma.plugin.findUnique({
      where: {
        id: pluginId
      }
    });
    if (!plugin) {
      throw new _common.NotFoundException('Plugin not found');
    }
    // Validate manifest before allowing installation
    this.sandbox.validateManifest(plugin.manifest);
    const existing = await this.prisma.installedPlugin.findUnique({
      where: {
        tenantId_pluginId: {
          tenantId,
          pluginId
        }
      }
    });
    if (existing) {
      throw new _common.ConflictException('Plugin already installed');
    }
    const [installed] = await this.prisma.$transaction([this.prisma.installedPlugin.create({
      data: {
        tenantId,
        pluginId,
        config,
        isEnabled: true
      },
      include: {
        plugin: true
      }
    }), this.prisma.plugin.update({
      where: {
        id: pluginId
      },
      data: {
        installCount: {
          increment: 1
        }
      }
    })]);
    return installed;
  }
  async uninstallPlugin(tenantId, pluginId) {
    const installed = await this.prisma.installedPlugin.findUnique({
      where: {
        tenantId_pluginId: {
          tenantId,
          pluginId
        }
      }
    });
    if (!installed) {
      throw new _common.NotFoundException('Plugin not installed');
    }
    await this.prisma.$transaction([this.prisma.installedPlugin.delete({
      where: {
        tenantId_pluginId: {
          tenantId,
          pluginId
        }
      }
    }), this.prisma.plugin.update({
      where: {
        id: pluginId
      },
      data: {
        installCount: {
          decrement: 1
        }
      }
    })]);
    return {
      message: 'Plugin uninstalled'
    };
  }
  async togglePlugin(tenantId, pluginId, isEnabled) {
    const installed = await this.prisma.installedPlugin.findUnique({
      where: {
        tenantId_pluginId: {
          tenantId,
          pluginId
        }
      }
    });
    if (!installed) {
      throw new _common.NotFoundException('Plugin not installed');
    }
    return this.prisma.installedPlugin.update({
      where: {
        tenantId_pluginId: {
          tenantId,
          pluginId
        }
      },
      data: {
        isEnabled
      },
      include: {
        plugin: true
      }
    });
  }
  async updatePluginConfig(tenantId, pluginId, config) {
    const installed = await this.prisma.installedPlugin.findUnique({
      where: {
        tenantId_pluginId: {
          tenantId,
          pluginId
        }
      }
    });
    if (!installed) {
      throw new _common.NotFoundException('Plugin not installed');
    }
    return this.prisma.installedPlugin.update({
      where: {
        tenantId_pluginId: {
          tenantId,
          pluginId
        }
      },
      data: {
        config
      },
      include: {
        plugin: true
      }
    });
  }
  async getPluginSandboxMeta(pluginId) {
    const plugin = await this.prisma.plugin.findUnique({
      where: {
        id: pluginId
      }
    });
    if (!plugin) {
      throw new _common.NotFoundException('Plugin not found');
    }
    const manifest = this.sandbox.validateManifest(plugin.manifest);
    return {
      sandbox: this.sandbox.buildSandboxAttribute(manifest),
      csp: this.sandbox.buildCsp(manifest),
      permissions: manifest.permissions,
      entrypoint: manifest.entrypoint
    };
  }
  async getPluginCategories() {
    const plugins = await this.prisma.plugin.findMany({
      where: {
        isActive: true
      },
      select: {
        category: true
      },
      distinct: ['category']
    });
    return plugins.map(p => p.category).filter(Boolean);
  }
};
exports.PluginsService = PluginsService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_pluginSandbox.PluginSandboxService)), __metadata("design:paramtypes", [Object, Object])], PluginsService);