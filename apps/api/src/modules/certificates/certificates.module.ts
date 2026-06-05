import { Module } from '@nestjs/common';
import { CertificatesController } from './presentation/controllers/certificates.controller';
import { CertificatesService } from './certificates.service';
import { CertificateProcessor } from '../queue/processors/certificate.processor';
import { DatabaseModule } from '../database/database.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [DatabaseModule, StorageModule],
  controllers: [CertificatesController],
  providers: [CertificatesService, CertificateProcessor],
  exports: [CertificatesService],
})
export class CertificatesModule {}
