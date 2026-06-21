"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PluginsController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _tenant = require("../../../core/guards/tenant.guard");
var _pluginInstall = require("../../plugin-install.service");
var _pluginRegistry = require("../../plugin-registry.service");
var _plugins = require("../../plugins.service");
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
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

let PluginsController = exports.PluginsController = class PluginsController {
  constructor(pluginsService, registry, installer) {
    this.pluginsService = pluginsService;
    this.registry = registry;
    this.installer = installer;
  }
  // ─── Catalog (built-in registry) ────────────────────────────────────────────
  listCatalog(search, category, free) {
    return this.registry.listPlugins({
      search,
      category,
      free: free === 'true' ? true : undefined
    });
  }
  getCatalogCategories() {
    return this.registry.getCategories();
  }
  getCatalogPlugin(pluginId) {
    return this.registry.getPlugin(pluginId);
  }
  // ─── Installed plugins (catalog-backed) ─────────────────────────────────────
  installFromCatalog(req, body) {
    return this.installer.installPlugin(req.tenantId, body.pluginId, body.config);
  }
  getInstalled(req) {
    return this.installer.getInstalledPlugins(req.tenantId);
  }
  uninstallCatalog(req, pluginId) {
    return this.installer.uninstallPlugin(req.tenantId, pluginId);
  }
  updateConfigCatalog(req, pluginId, body) {
    return this.installer.updatePluginConfig(req.tenantId, pluginId, body.config);
  }
  toggleCatalog(req, pluginId, body) {
    return this.installer.togglePlugin(req.tenantId, pluginId, body.enabled);
  }
  // ─── Legacy marketplace (DB-backed) ─────────────────────────────────────────
  listMarketplace(req, search, category, page, limit) {
    return this.pluginsService.listMarketplace(req.tenantId, {
      search,
      category,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20
    });
  }
  getCategories() {
    return this.pluginsService.getPluginCategories();
  }
  getPlugin(pluginId) {
    return this.pluginsService.getPlugin(pluginId);
  }
  install(req, pluginId, body) {
    return this.pluginsService.installPlugin(req.tenantId, pluginId, body.config);
  }
  uninstall(req, pluginId) {
    return this.pluginsService.uninstallPlugin(req.tenantId, pluginId);
  }
  toggle(req, pluginId, body) {
    return this.pluginsService.togglePlugin(req.tenantId, pluginId, body.isEnabled);
  }
  updateConfig(req, pluginId, body) {
    return this.pluginsService.updatePluginConfig(req.tenantId, pluginId, body.config);
  }
  getSandboxMeta(pluginId) {
    return this.pluginsService.getPluginSandboxMeta(pluginId);
  }
};
__decorate([(0, _common.Get)('catalog'), (0, _swagger.ApiOperation)({
  summary: 'Browse the built-in plugin catalog'
}), (0, _swagger.ApiQuery)({
  name: 'search',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'category',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'free',
  required: false,
  type: Boolean
}), __param(0, (0, _common.Query)('search')), __param(1, (0, _common.Query)('category')), __param(2, (0, _common.Query)('free')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, String]), __metadata("design:returntype", void 0)], PluginsController.prototype, "listCatalog", null);
__decorate([(0, _common.Get)('catalog/categories'), (0, _swagger.ApiOperation)({
  summary: 'Get available plugin categories from catalog'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], PluginsController.prototype, "getCatalogCategories", null);
__decorate([(0, _common.Get)('catalog/:pluginId'), (0, _swagger.ApiOperation)({
  summary: 'Get catalog plugin details'
}), __param(0, (0, _common.Param)('pluginId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], PluginsController.prototype, "getCatalogPlugin", null);
__decorate([(0, _common.Post)('installed'), (0, _swagger.ApiOperation)({
  summary: 'Install a plugin for this tenant (catalog-backed)'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], PluginsController.prototype, "installFromCatalog", null);
__decorate([(0, _common.Get)('installed'), (0, _swagger.ApiOperation)({
  summary: 'List installed plugins for this tenant'
}), __param(0, (0, _common.Req)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], PluginsController.prototype, "getInstalled", null);
__decorate([(0, _common.Delete)('installed/:pluginId'), (0, _swagger.ApiOperation)({
  summary: 'Uninstall a plugin'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('pluginId')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], PluginsController.prototype, "uninstallCatalog", null);
__decorate([(0, _common.Patch)('installed/:pluginId/config'), (0, _swagger.ApiOperation)({
  summary: 'Update plugin configuration'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('pluginId')), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, Object]), __metadata("design:returntype", void 0)], PluginsController.prototype, "updateConfigCatalog", null);
__decorate([(0, _common.Patch)('installed/:pluginId/toggle'), (0, _swagger.ApiOperation)({
  summary: 'Enable or disable an installed plugin'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('pluginId')), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, Object]), __metadata("design:returntype", void 0)], PluginsController.prototype, "toggleCatalog", null);
__decorate([(0, _common.Get)('marketplace'), (0, _swagger.ApiOperation)({
  summary: 'Browse plugin marketplace (DB-backed)'
}), (0, _swagger.ApiQuery)({
  name: 'search',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'category',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'page',
  required: false,
  type: Number
}), (0, _swagger.ApiQuery)({
  name: 'limit',
  required: false,
  type: Number
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Query)('search')), __param(2, (0, _common.Query)('category')), __param(3, (0, _common.Query)('page')), __param(4, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, String, String, String]), __metadata("design:returntype", void 0)], PluginsController.prototype, "listMarketplace", null);
__decorate([(0, _common.Get)('marketplace/categories'), (0, _swagger.ApiOperation)({
  summary: 'Get plugin categories (DB-backed)'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], PluginsController.prototype, "getCategories", null);
__decorate([(0, _common.Get)('marketplace/:pluginId'), (0, _swagger.ApiOperation)({
  summary: 'Get plugin details (DB-backed)'
}), __param(0, (0, _common.Param)('pluginId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], PluginsController.prototype, "getPlugin", null);
__decorate([(0, _common.Post)('install/:pluginId'), (0, _swagger.ApiOperation)({
  summary: 'Install a DB-backed plugin'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('pluginId')), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, Object]), __metadata("design:returntype", void 0)], PluginsController.prototype, "install", null);
__decorate([(0, _common.Delete)('uninstall/:pluginId'), (0, _swagger.ApiOperation)({
  summary: 'Uninstall a DB-backed plugin'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('pluginId')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String]), __metadata("design:returntype", void 0)], PluginsController.prototype, "uninstall", null);
__decorate([(0, _common.Patch)(':pluginId/toggle'), (0, _swagger.ApiOperation)({
  summary: 'Enable or disable an installed DB-backed plugin'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('pluginId')), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, Object]), __metadata("design:returntype", void 0)], PluginsController.prototype, "toggle", null);
__decorate([(0, _common.Patch)(':pluginId/config'), (0, _swagger.ApiOperation)({
  summary: 'Update DB-backed plugin configuration'
}), __param(0, (0, _common.Req)()), __param(1, (0, _common.Param)('pluginId')), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, String, Object]), __metadata("design:returntype", void 0)], PluginsController.prototype, "updateConfig", null);
__decorate([(0, _common.Get)(':pluginId/sandbox-meta'), (0, _swagger.ApiOperation)({
  summary: 'Get sandbox metadata for a plugin'
}), __param(0, (0, _common.Param)('pluginId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], PluginsController.prototype, "getSandboxMeta", null);
exports.PluginsController = PluginsController = __decorate([(0, _swagger.ApiTags)('plugins'), (0, _swagger.ApiBearerAuth)(), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _tenant.TenantGuard), (0, _common.Controller)('plugins'), __param(0, (0, _common.Inject)(_plugins.PluginsService)), __param(1, (0, _common.Inject)(_pluginRegistry.PluginRegistryService)), __param(2, (0, _common.Inject)(_pluginInstall.PluginInstallService)), __metadata("design:paramtypes", [Object, Object, Object])], PluginsController);