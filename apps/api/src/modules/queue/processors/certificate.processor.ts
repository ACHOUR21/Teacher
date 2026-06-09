import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { CertificatesService } from '../../certificates/certificates.service';
import { QUEUE_CERTIFICATE } from '../queue.module';

export interface CertificateJobData {
  studentId: string;
  templateId: string;
  metadata?: Record<string, unknown>;
}

export interface BulkCertificateJobData {
  certificates: CertificateJobData[];
}

@Processor(QUEUE_CERTIFICATE)
export class CertificateProcessor {
  private readonly logger = new Logger(CertificateProcessor.name);

  constructor(private readonly certificatesService: CertificatesService) {}

  @Process('issue')
  async handleIssue(job: Job<CertificateJobData>) {
    const { studentId, templateId, metadata } = job.data;
    this.logger.log(`Issuing certificate for student ${studentId} with template ${templateId}`);
    return this.certificatesService.issueCertificate(studentId, templateId, metadata ?? {});
  }

  @Process('bulk-issue')
  async handleBulkIssue(job: Job<BulkCertificateJobData>) {
    const { certificates } = job.data;
    this.logger.log(`Bulk issuing ${certificates.length} certificates`);
    const results = await Promise.allSettled(
      certificates.map(c => this.certificatesService.issueCertificate(c.studentId, c.templateId, c.metadata ?? {})),
    );
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    this.logger.log(`Bulk issue complete: ${succeeded} succeeded, ${failed} failed`);
    return { succeeded, failed };
  }
}
