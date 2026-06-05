import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QUEUE_EMAIL } from '../queue.module';
import { NotificationsService } from '../../notifications/notifications.service';

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Processor(QUEUE_EMAIL)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Process('send')
  async handleSend(job: Job<EmailJobData>) {
    const { to, subject, html, text } = job.data;
    this.logger.log(`Sending email to ${to}: ${subject}`);
    await this.notificationsService.sendEmail(to, subject, html, text);
  }

  @Process('bulk')
  async handleBulk(job: Job<{ recipients: EmailJobData[] }>) {
    const { recipients } = job.data;
    this.logger.log(`Sending bulk email to ${recipients.length} recipients`);
    await Promise.allSettled(
      recipients.map(r => this.notificationsService.sendEmail(r.to, r.subject, r.html, r.text)),
    );
  }
}
