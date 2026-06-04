import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../database/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? '587'),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  async sendEmail(to: string, subject: string, html: string, text?: string) {
    try {
      await this.transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html, text });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}`, err);
    }
  }

  async sendSms(to: string, body: string) {
    // Twilio integration
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) { this.logger.warn('Twilio not configured'); return; }
    try {
      const twilio = require('twilio')(accountSid, authToken);
      await twilio.messages.create({ body, from: process.env.TWILIO_PHONE_NUMBER, to });
    } catch (err) {
      this.logger.error(`Failed to send SMS to ${to}`, err);
    }
  }

  async sendPush(fcmToken: string, title: string, body: string, data?: Record<string, string>) {
    const serverKey = process.env.FCM_SERVER_KEY;
    if (!serverKey) { this.logger.warn('FCM not configured'); return; }
    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: { Authorization: `key=${serverKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: fcmToken, notification: { title, body }, data: data ?? {} }),
      });
      if (!response.ok) this.logger.error('FCM push failed', await response.text());
    } catch (err) {
      this.logger.error('FCM push error', err);
    }
  }

  async createInApp(userId: string, type: NotificationType, title: string, body: string, data?: Record<string, unknown>) {
    return this.prisma.notification.create({
      data: { userId, type, title, body, data: data ?? {} },
    });
  }

  async notifyUser(userId: string, title: string, body: string, data?: Record<string, unknown>) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { devices: { where: { isActive: true } } },
    });
    if (!user) return;

    await this.createInApp(userId, NotificationType.IN_APP, title, body, data);

    if (user.email) {
      await this.sendEmail(user.email, title, `<p>${body}</p>`);
    }

    for (const device of user.devices) {
      if (device.fcmToken) {
        await this.sendPush(device.fcmToken, title, body, data as Record<string, string>);
      }
    }
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { data: notifications, total, page, limit };
  }

  async markRead(userId: string, notificationId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }
}
