import { Module } from '@nestjs/common';

import { ApiEcosystemModule } from '../api-ecosystem/api-ecosystem.module';
import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';
import { SearchModule } from '../search/search.module';
import { StorageModule } from '../storage/storage.module';

import { CoursesService } from './courses.service';
import { CoursesController } from './presentation/controllers/courses.controller';

@Module({
  imports: [DatabaseModule, CacheModule, SearchModule, StorageModule, ApiEcosystemModule],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
