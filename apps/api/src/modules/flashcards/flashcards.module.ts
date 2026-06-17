import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { FlashcardsService } from './flashcards.service';
import { FlashcardsController } from './presentation/controllers/flashcards.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [FlashcardsController],
  providers: [FlashcardsService],
  exports: [FlashcardsService],
})
export class FlashcardsModule {}
