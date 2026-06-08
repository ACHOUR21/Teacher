import { Module } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { ExamsController } from './presentation/controllers/exams.controller';
import { DatabaseModule } from '../database/database.module';
import { CertificatesModule } from '../certificates/certificates.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [DatabaseModule, CertificatesModule, SearchModule],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
