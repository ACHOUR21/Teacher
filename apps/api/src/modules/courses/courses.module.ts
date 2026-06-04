import { Module } from '@nestjs/common';
import { CoursesController } from './presentation/controllers/courses.controller';
import { CoursesService } from './courses.service';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';
import { SearchModule } from '../search/search.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [DatabaseModule, CacheModule, SearchModule, StorageModule],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
