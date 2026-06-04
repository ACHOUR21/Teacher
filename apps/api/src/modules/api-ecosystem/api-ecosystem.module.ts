import { Module } from '@nestjs/common';
import { ApiEcosystemController } from './presentation/controllers/api-ecosystem.controller';
import { ApiEcosystemService } from './api-ecosystem.service';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [ApiEcosystemController],
  providers: [ApiEcosystemService],
  exports: [ApiEcosystemService],
})
export class ApiEcosystemModule {}
