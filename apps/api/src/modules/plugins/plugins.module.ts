import { Module } from '@nestjs/common';
import { PluginsService } from './plugins.service';
import { PluginsController } from './presentation/controllers/plugins.controller';

@Module({
  controllers: [PluginsController],
  providers: [PluginsService],
  exports: [PluginsService],
})
export class PluginsModule {}
