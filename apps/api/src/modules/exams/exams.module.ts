import { Module } from '@nestjs/common';

import { CertificatesModule } from '../certificates/certificates.module';
import { DatabaseModule } from '../database/database.module';
import { SearchModule } from '../search/search.module';

import { ExamsService } from './exams.service';
import { ExamsController } from './presentation/controllers/exams.controller';

@Module({
  imports: [DatabaseModule, CertificatesModule, SearchModule],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
