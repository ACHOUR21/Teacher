import { Module } from '@nestjs/common';
import { PluginsService } from './plugins.service';
import { PluginsController } from './presentation/controllers/plugins.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PluginsController],
  providers: [PluginsService],
  exports: [PluginsService],
})
export class PluginsModule {}
