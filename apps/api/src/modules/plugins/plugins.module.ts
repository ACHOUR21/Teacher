import { Module } from '@nestjs/common';
import { PluginsService } from './plugins.service';
import { PluginsController } from './presentation/controllers/plugins.controller';
import { PluginSandboxService } from './application/plugin-sandbox.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PluginsController],
  providers: [PluginsService, PluginSandboxService],
  exports: [PluginsService, PluginSandboxService],
})
export class PluginsModule {}
