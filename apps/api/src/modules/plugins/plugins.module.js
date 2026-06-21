"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PluginsModule = void 0;
var _common = require("@nestjs/common");
var _database = require("../database/database.module");
var _pluginEvents = require("./plugin-events.service");
var _pluginInstall = require("./plugin-install.service");
var _pluginRegistry = require("./plugin-registry.service");
var _pluginSandbox = require("./application/plugin-sandbox.service");
var _plugins = require("./plugins.service");
var _plugins2 = require("./presentation/controllers/plugins.controller");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let PluginsModule = exports.PluginsModule = class PluginsModule {};
exports.PluginsModule = PluginsModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule],
  controllers: [_plugins2.PluginsController],
  providers: [_plugins.PluginsService, _pluginSandbox.PluginSandboxService, _pluginRegistry.PluginRegistryService, _pluginInstall.PluginInstallService, _pluginEvents.PluginEventsService],
  exports: [_plugins.PluginsService, _pluginSandbox.PluginSandboxService, _pluginRegistry.PluginRegistryService, _pluginInstall.PluginInstallService, _pluginEvents.PluginEventsService]
})], PluginsModule);