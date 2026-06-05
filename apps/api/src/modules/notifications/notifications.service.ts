import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../database/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';

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
      data: { userId, type, title, body, data: (data ?? {}) as Prisma.InputJsonValue },
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

  // ── Branded email templates ──────────────────────────────────────────────

  async sendWelcomeEmail(to: string, firstName: string, tenantName: string) {
    const html = emailTemplate({
      title: `Welcome to ${tenantName}!`,
      preheader: `You're now part of ${tenantName} on EduAI.`,
      body: `
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">Hi ${firstName}, welcome aboard! 🎉</h2>
        <p style="margin:0 0 16px;color:#374151">Your account on <strong>${tenantName}</strong> is ready.
        Start exploring courses, connect with your classmates, and let our AI tutor guide your learning.</p>
        <a href="${process.env.APP_URL ?? 'http://localhost:3000'}/login"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">
          Go to Dashboard →
        </a>`,
    });
    await this.sendEmail(to, `Welcome to ${tenantName}!`, html);
  }

  async sendPasswordResetEmail(to: string, firstName: string, resetToken: string) {
    const resetUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const html = emailTemplate({
      title: 'Reset your password',
      preheader: 'A password reset was requested for your account.',
      body: `
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">Hi ${firstName},</h2>
        <p style="margin:0 0 16px;color:#374151">We received a request to reset your EduAI password.
        Click the button below — this link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">
          Reset Password →
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af">If you didn't request this, you can safely ignore this email.</p>`,
    });
    await this.sendEmail(to, 'Reset your EduAI password', html);
  }

  async sendCourseEnrollmentEmail(to: string, firstName: string, courseTitle: string, courseId: string) {
    const courseUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/courses/${courseId}`;
    const html = emailTemplate({
      title: `You're enrolled in ${courseTitle}`,
      preheader: `Start learning ${courseTitle} today.`,
      body: `
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">Congrats, ${firstName}! 🎓</h2>
        <p style="margin:0 0 16px;color:#374151">You're now enrolled in <strong>${courseTitle}</strong>.
        Head to the course page to start your first lesson.</p>
        <a href="${courseUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">
          Start Learning →
        </a>`,
    });
    await this.sendEmail(to, `You're enrolled in ${courseTitle}`, html);
  }
}

// ── Shared email layout ──────────────────────────────────────────────────────
function emailTemplate({ title, preheader, body }: { title: string; preheader: string; body: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<span style="display:none;max-height:0;overflow:hidden">${preheader}</span>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
  <tr><td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:28px 32px">
    <span style="color:#fff;font-size:18px;font-weight:700">EduAI Ultimate</span>
  </td></tr>
  <tr><td style="padding:32px">${body}</td></tr>
  <tr><td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center">
    © ${new Date().getFullYear()} EduAI Ultimate · <a href="#" style="color:#6b7280">Unsubscribe</a>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
