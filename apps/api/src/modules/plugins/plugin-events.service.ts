import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PluginEventsService {
  private readonly logger = new Logger(PluginEventsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Emit a platform event to all installed, enabled plugins for a given tenant.
   *
   * For MVP, this logs the intent and returns early — the actual HTTP calls to
   * external webhook URLs are out of scope and would be implemented via BullMQ
   * background jobs in a future iteration.
   */
  async emitToPlugins(tenantId: string, event: string, payload: unknown): Promise<void> {
    // Get all installed + enabled plugins for this tenant
    const installed = await this.prisma.installedPlugin.findMany({
      where: { tenantId, isEnabled: true, isActive: true },
    });

    if (installed.length === 0) {
      return;
    }

    // Non-blocking: fire and forget per plugin
    for (const plugin of installed) {
      const config = plugin.config as Record<string, unknown> | null;
      const webhookUrl = config?.webhookUrl as string | undefined;

      this.logger.log(
        `[PluginEvents] tenant=${tenantId} plugin=${plugin.pluginId} event=${event} ` +
          `webhook=${webhookUrl ?? 'not-configured'}`,
      );

      // Actual HTTP dispatch (BullMQ job) would go here:
      // await this.eventsQueue.add('dispatch-plugin-event', {
      //   tenantId, pluginId: plugin.pluginId, webhookUrl, event, payload,
      // });
    }
  }
}
