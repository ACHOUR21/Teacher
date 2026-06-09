import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { PluginSandboxService } from './application/plugin-sandbox.service';
import { PluginsService } from './plugins.service';
import { PluginsController } from './presentation/controllers/plugins.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [PluginsController],
  providers: [PluginsService, PluginSandboxService],
  exports: [PluginsService, PluginSandboxService],
})
export class PluginsModule {}
