import { Module } from '@nestjs/common';
import { AiController } from './presentation/controllers/ai.controller';
import { AiService } from './ai.service';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [DatabaseModule, CacheModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
