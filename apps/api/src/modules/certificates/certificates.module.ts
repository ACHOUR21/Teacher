import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from '../database/database.module';
import { CertificateProcessor } from '../queue/processors/certificate.processor';
import { StorageModule } from '../storage/storage.module';

import { CertificatesService } from './certificates.service';
import { CertificatesController } from './presentation/controllers/certificates.controller';

@Module({
  imports: [DatabaseModule, StorageModule, ConfigModule],
  controllers: [CertificatesController],
  providers: [CertificatesService, CertificateProcessor],
  exports: [CertificatesService],
})
export class CertificatesModule {}
