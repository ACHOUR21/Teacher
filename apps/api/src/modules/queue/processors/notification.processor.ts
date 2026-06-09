import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import { NotificationsService } from '../../notifications/notifications.service';
import { QUEUE_NOTIFICATION } from '../queue.module';

export interface NotificationJobData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface PushJobData {
  fcmToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface SmsJobData {
  to: string;
  body: string;
}

@Processor(QUEUE_NOTIFICATION)
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Process('notify-user')
  async handleNotifyUser(job: Job<NotificationJobData>) {
    const { userId, title, body, data } = job.data;
    this.logger.log(`Notifying user ${userId}: ${title}`);
    await this.notificationsService.notifyUser(userId, title, body, data);
  }

  @Process('push')
  async handlePush(job: Job<PushJobData>) {
    const { fcmToken, title, body, data } = job.data;
    this.logger.log(`Sending push to token: ${fcmToken.substring(0, 8)}...`);
    await this.notificationsService.sendPush(fcmToken, title, body, data);
  }

  @Process('sms')
  async handleSms(job: Job<SmsJobData>) {
    const { to, body } = job.data;
    this.logger.log(`Sending SMS to ${to}`);
    await this.notificationsService.sendSms(to, body);
  }
}
