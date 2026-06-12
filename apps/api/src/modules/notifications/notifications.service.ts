import { Injectable, Logger, Optional } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import * as nodemailer from 'nodemailer';

import { PrismaService } from '../database/prisma.service';

import type { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly gateway?: NotificationsGateway,
  ) {
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
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-call
      const twilio = (require('twilio') as (sid: string, tok: string) => { messages: { create: (opts: Record<string, string | undefined>) => Promise<void> } })(accountSid, authToken);
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
      if (!response.ok) {this.logger.error('FCM push failed', await response.text());}
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
    if (!user) {return;}

    const notification = await this.createInApp(userId, NotificationType.IN_APP, title, body, data);

    // Real-time delivery via Socket.IO
    this.gateway?.sendToUser(userId, {
      id: notification.id,
      title,
      message: body,
      type: (data?.['type'] as string) ?? 'IN_APP',
      href: data?.['href'] as string | undefined,
      createdAt: notification.createdAt.toISOString(),
      data,
    });

    if (user.email) {
      await this.sendEmail(user.email, title, `<p>${body}</p>`);
    }

    for (const device of user.devices) {
      if (device.fcmToken) {
        await this.sendPush(device.fcmToken, title, body, data as Record<string, string>);
      }
    }
  }

  async registerFcmToken(userId: string, fcmToken: string, platform = 'WEB') {
    const deviceId = `${userId}-${platform.toLowerCase()}-fcm`;
    return this.prisma.userDevice.upsert({
      where: { deviceId },
      create: {
        userId,
        deviceId,
        fcmToken,
        deviceType: platform.toUpperCase(),
        deviceName: `${platform} (Push)`,
        isActive: true,
      },
      update: {
        fcmToken,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });
  }

  async removeFcmToken(userId: string, fcmToken: string) {
    await this.prisma.userDevice.updateMany({
      where: { userId, fcmToken },
      data: { fcmToken: null },
    });
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

  async deleteNotification(userId: string, notificationId: string) {
    return this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
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

  async sendEmailVerification(to: string, firstName: string, verificationToken: string) {
    const verifyUrl = `${process.env['APP_URL'] ?? 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    const html = emailTemplate({
      title: 'Verify your email address',
      preheader: 'Confirm your email to activate your EduAI account.',
      body: `
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">Hi ${firstName},</h2>
        <p style="margin:0 0 16px;color:#374151">Thanks for signing up for EduAI! Please verify your email address to activate your account.</p>
        <a href="${verifyUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">
          Verify Email Address →
        </a>
        <p style="margin:20px 0 0;color:#6b7280;font-size:12px">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>`,
    });
    await this.sendEmail(to, 'Verify your EduAI email address', html);
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

  async sendGradePublishedEmail(to: string, firstName: string, assignmentTitle: string, grade: number, maxGrade: number, feedback?: string) {
    const pct = Math.round((grade / maxGrade) * 100);
    const html = emailTemplate({
      title: `Grade published: ${assignmentTitle}`,
      preheader: `You scored ${pct}% on ${assignmentTitle}.`,
      body: `
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">Hi ${firstName}, your grade is in!</h2>
        <p style="margin:0 0 16px;color:#374151">Your submission for <strong>${assignmentTitle}</strong> has been graded.</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:16px 20px;margin:0 0 16px">
          <span style="font-size:32px;font-weight:700;color:#111827">${pct}%</span>
          <span style="color:#6b7280;font-size:14px;margin-left:8px">(${grade} / ${maxGrade} points)</span>
        </div>
        ${feedback ? `<p style="margin:0 0 16px;color:#374151"><strong>Instructor feedback:</strong> ${feedback}</p>` : ''}
        <a href="${process.env.APP_URL ?? 'http://localhost:3000'}/assignments"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">
          View Assignment →
        </a>`,
    });
    await this.sendEmail(to, `Grade published: ${assignmentTitle}`, html);
  }

  async sendAssignmentDueReminderEmail(to: string, firstName: string, assignmentTitle: string, courseTitle: string, dueDate: Date) {
    const dueDateStr = dueDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const html = emailTemplate({
      title: `Assignment due soon: ${assignmentTitle}`,
      preheader: `${assignmentTitle} is due ${dueDateStr}.`,
      body: `
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">Hi ${firstName}, don't forget!</h2>
        <p style="margin:0 0 16px;color:#374151">Your assignment <strong>${assignmentTitle}</strong> in <strong>${courseTitle}</strong> is due soon.</p>
        <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:12px 16px;margin:0 0 16px">
          <span style="color:#92400e;font-weight:600">⏰ Due: ${dueDateStr}</span>
        </div>
        <a href="${process.env.APP_URL ?? 'http://localhost:3000'}/assignments"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">
          Submit Now →
        </a>`,
    });
    await this.sendEmail(to, `Due soon: ${assignmentTitle}`, html);
  }

  async sendCertificateAwardedEmail(to: string, firstName: string, courseTitle: string, verifyCode: string) {
    const verifyUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/certificates/verify/${verifyCode}`;
    const html = emailTemplate({
      title: `Certificate awarded: ${courseTitle}`,
      preheader: `Congratulations! You've completed ${courseTitle}.`,
      body: `
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">Congratulations, ${firstName}! 🏆</h2>
        <p style="margin:0 0 16px;color:#374151">You've successfully completed <strong>${courseTitle}</strong> and earned your certificate.</p>
        <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border:2px solid #f59e0b;border-radius:12px;padding:20px;text-align:center;margin:0 0 16px">
          <span style="font-size:40px">🎓</span>
          <p style="margin:8px 0 0;font-weight:700;color:#92400e">${courseTitle}</p>
          <p style="margin:4px 0 0;font-size:12px;color:#b45309">Certificate ID: ${verifyCode}</p>
        </div>
        <a href="${verifyUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">
          View Certificate →
        </a>`,
    });
    await this.sendEmail(to, `You earned a certificate: ${courseTitle}`, html);
  }

  async sendAssignmentSubmittedEmail(to: string, instructorName: string, studentName: string, assignmentTitle: string, courseTitle: string) {
    const html = emailTemplate({
      title: `New submission: ${assignmentTitle}`,
      preheader: `${studentName} submitted ${assignmentTitle}.`,
      body: `
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">Hi ${instructorName},</h2>
        <p style="margin:0 0 16px;color:#374151"><strong>${studentName}</strong> has submitted their assignment for <strong>${assignmentTitle}</strong> in <strong>${courseTitle}</strong>.</p>
        <a href="${process.env.APP_URL ?? 'http://localhost:3000'}/assignments/gradebook"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">
          Review Submission →
        </a>`,
    });
    await this.sendEmail(to, `New submission: ${assignmentTitle}`, html);
  }

  async sendCourseCompletionEmail(to: string, firstName: string, courseTitle: string, courseId: string) {
    const html = emailTemplate({
      title: `You completed ${courseTitle}!`,
      preheader: `Course completed: ${courseTitle}.`,
      body: `
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">Amazing work, ${firstName}! 🎉</h2>
        <p style="margin:0 0 16px;color:#374151">You have successfully completed <strong>${courseTitle}</strong>. Your dedication and hard work have paid off!</p>
        <a href="${process.env.APP_URL ?? 'http://localhost:3000'}/courses/${courseId}"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">
          View Course →
        </a>`,
    });
    await this.sendEmail(to, `Course completed: ${courseTitle}`, html);
  }

  async sendAdminAlertEmail(to: string, adminName: string, alertTitle: string, alertBody: string) {
    const html = emailTemplate({
      title: alertTitle,
      preheader: alertTitle,
      body: `
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">Hi ${adminName},</h2>
        <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;margin:0 0 16px">
          <p style="margin:0;color:#991b1b;font-weight:600">⚠️ ${alertTitle}</p>
          <p style="margin:8px 0 0;color:#7f1d1d">${alertBody}</p>
        </div>
        <a href="${process.env.APP_URL ?? 'http://localhost:3000'}/admin"
           style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">
          View Admin Panel →
        </a>`,
    });
    await this.sendEmail(to, `[Alert] ${alertTitle}`, html);
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
