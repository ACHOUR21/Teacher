import { Module } from '@nestjs/common';

import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';

import { ApiEcosystemService } from './api-ecosystem.service';
import { ApiEcosystemController } from './presentation/controllers/api-ecosystem.controller';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [ApiEcosystemController],
  providers: [ApiEcosystemService],
  exports: [ApiEcosystemService],
})
export class ApiEcosystemModule {}
