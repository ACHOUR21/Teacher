import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { PluginEventsService } from './plugin-events.service';
import { PluginInstallService } from './plugin-install.service';
import { PluginRegistryService } from './plugin-registry.service';
import { PluginSandboxService } from './application/plugin-sandbox.service';
import { PluginsService } from './plugins.service';
import { PluginsController } from './presentation/controllers/plugins.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [PluginsController],
  providers: [
    PluginsService,
    PluginSandboxService,
    PluginRegistryService,
    PluginInstallService,
    PluginEventsService,
  ],
  exports: [PluginsService, PluginSandboxService, PluginRegistryService, PluginInstallService, PluginEventsService],
})
export class PluginsModule {}
