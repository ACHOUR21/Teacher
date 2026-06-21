"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PluginEventsService = void 0;
var _common = require("@nestjs/common");
var _prisma = require("../database/prisma.service");
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
var PluginEventsService_1;
let PluginEventsService = exports.PluginEventsService = PluginEventsService_1 = class PluginEventsService {
  logger = new _common.Logger(PluginEventsService_1.name);
  constructor(prisma) {
    this.prisma = prisma;
  }
  /**
   * Emit a platform event to all installed, enabled plugins for a given tenant.
   *
   * For MVP, this logs the intent and returns early — the actual HTTP calls to
   * external webhook URLs are out of scope and would be implemented via BullMQ
   * background jobs in a future iteration.
   */
  async emitToPlugins(tenantId, event, payload) {
    // Get all installed + enabled plugins for this tenant
    const installed = await this.prisma.installedPlugin.findMany({
      where: {
        tenantId,
        isEnabled: true,
        isActive: true
      }
    });
    if (installed.length === 0) {
      return;
    }
    // Non-blocking: fire and forget per plugin
    for (const plugin of installed) {
      const config = plugin.config;
      const webhookUrl = config?.webhookUrl;
      this.logger.log(`[PluginEvents] tenant=${tenantId} plugin=${plugin.pluginId} event=${event} ` + `webhook=${webhookUrl ?? 'not-configured'}`);
      // Actual HTTP dispatch (BullMQ job) would go here:
      // await this.eventsQueue.add('dispatch-plugin-event', {
      //   tenantId, pluginId: plugin.pluginId, webhookUrl, event, payload,
      // });
    }
  }
};
exports.PluginEventsService = PluginEventsService = PluginEventsService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], PluginEventsService);