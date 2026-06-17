import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../database/prisma.service';

import { EmailService } from './email/email.service';

export interface DigestData {
  userId: string;
  userEmail: string;
  userName: string;
  unreadCount: number;
  coursesProgressed: Array<{ title: string; progressPercent: number }>;
  achievementsUnlocked: Array<{ title: string; earnedAt: string }>;
  upcomingLessons: Array<{ title: string; scheduledAt: string }>;
  aiSessionCount: number;
}

@Injectable()
export class NotificationDigestService {
  private readonly logger = new Logger(NotificationDigestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /** Every Monday at 8 AM */
  @Cron('0 8 * * 1')
  async sendWeeklyDigests(): Promise<void> {
    this.logger.log('Starting weekly digest send...');

    // Find all users who have opted into weekly digest emails
    // We look at any user with a profile that has weeklyDigest.email = true
    // For users with no profile, we default to true (per DEFAULTS)
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, email: true, firstName: true, lastName: true, profile: { select: { preferences: true } } },
    });

    let sent = 0;
    for (const user of users) {
      try {
        const prefs = (user.profile?.preferences as Record<string, unknown>)?.['notificationPreferences'] as
          | Record<string, Record<string, boolean>>
          | undefined;

        // Default is email: true for weeklyDigest
        const emailEnabled = prefs?.['weeklyDigest']?.['email'] ?? true;
        if (!emailEnabled) continue;

        const digest = await this.buildDigestForUser(user.id);
        if (!digest) continue;

        await this.sendDigestEmail(digest);
        sent++;
      } catch (err) {
        this.logger.error(`Failed to send digest for user ${user.id}`, err);
      }
    }

    this.logger.log(`Weekly digest: sent ${sent} emails`);
  }

  async buildDigestForUser(userId: string): Promise<DigestData | null> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        studentProfile: {
          select: {
            courseProgress: {
              where: { lastAccessedAt: { gte: oneWeekAgo } },
              select: { progressPercent: true, course: { select: { title: true } } },
              orderBy: { lastAccessedAt: 'desc' },
              take: 5,
            },
          },
        },
        achievements: {
          where: { earnedAt: { gte: oneWeekAgo } },
          select: {
            earnedAt: true,
            achievement: { select: { type: true } },
          },
          take: 5,
        },
        aiConversations: {
          where: { createdAt: { gte: oneWeekAgo } },
          select: { id: true },
        },
        notifications: {
          where: { isRead: false },
          select: { id: true },
        },
      },
    });

    if (!user) return null;

    // Upcoming live sessions for the next 7 days
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const upcomingSessions = await this.prisma.liveSession.findMany({
      where: {
        scheduledAt: { gte: new Date(), lte: nextWeek },
        status: 'SCHEDULED',
        participants: { some: { userId } },
      },
      select: { title: true, scheduledAt: true },
      orderBy: { scheduledAt: 'asc' },
      take: 3,
    });

    const coursesProgressed = (user.studentProfile?.courseProgress ?? []).map((p) => ({
      title: p.course.title,
      progressPercent: Math.round(p.progressPercent),
    }));

    const achievementsUnlocked = (user.achievements ?? []).map((a) => ({
      title: a.achievement.type,
      earnedAt: a.earnedAt.toISOString(),
    }));

    const upcomingLessons = upcomingSessions.map((s) => ({
      title: s.title,
      scheduledAt: s.scheduledAt.toISOString(),
    }));

    return {
      userId,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      unreadCount: user.notifications.length,
      coursesProgressed,
      achievementsUnlocked,
      upcomingLessons,
      aiSessionCount: user.aiConversations.length,
    };
  }

  private async sendDigestEmail(digest: DigestData): Promise<void> {
    const subject = `Your week at EduAI — ${digest.unreadCount} update${digest.unreadCount !== 1 ? 's' : ''}`;

    const courseRows = digest.coursesProgressed.length
      ? digest.coursesProgressed
          .map(
            (c) => `
          <tr>
            <td style="padding:8px 0;color:#374151;font-size:14px">${c.title}</td>
            <td style="padding:8px 0;width:140px">
              <div style="background:#e5e7eb;border-radius:4px;height:8px">
                <div style="background:#2563eb;border-radius:4px;height:8px;width:${c.progressPercent}%"></div>
              </div>
              <span style="font-size:11px;color:#6b7280">${c.progressPercent}%</span>
            </td>
          </tr>`,
          )
          .join('')
      : '<tr><td colspan="2" style="color:#9ca3af;font-size:14px;padding:8px 0">No course activity this week.</td></tr>';

    const achievementRows = digest.achievementsUnlocked.length
      ? digest.achievementsUnlocked
          .map(
            (a) => `<li style="margin:4px 0;color:#374151;font-size:14px">
            <span style="margin-right:6px">🏆</span>${a.title}</li>`,
          )
          .join('')
      : '<li style="color:#9ca3af;font-size:14px">No new achievements this week.</li>';

    const upcomingRows = digest.upcomingLessons.length
      ? digest.upcomingLessons
          .map((s) => {
            const d = new Date(s.scheduledAt);
            const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            return `<li style="margin:4px 0;color:#374151;font-size:14px">
              <span style="margin-right:6px">📅</span>${s.title} — <strong>${dateStr}</strong></li>`;
          })
          .join('')
      : '<li style="color:#9ca3af;font-size:14px">No upcoming sessions.</li>';

    const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000';

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title>
<span style="display:none;max-height:0;overflow:hidden">Your weekly EduAI progress summary is ready.</span>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px">
<tr><td align="center">
<table width="100%" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
  <tr><td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:28px 32px">
    <span style="color:#fff;font-size:18px;font-weight:700">EduAI Ultimate</span>
    <p style="color:rgba(255,255,255,.8);font-size:13px;margin:4px 0 0">Weekly Digest</p>
  </td></tr>
  <tr><td style="padding:32px">
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827">Hi ${digest.userName},</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px">Here's what happened on EduAI this week.</p>

    ${digest.unreadCount > 0 ? `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin:0 0 24px;display:flex;align-items:center">
      <span style="font-size:20px;margin-right:10px">🔔</span>
      <span style="color:#1d4ed8;font-size:14px;font-weight:600">${digest.unreadCount} unread notification${digest.unreadCount !== 1 ? 's' : ''} waiting for you</span>
    </div>` : ''}

    <h3 style="margin:0 0 12px;font-size:15px;color:#111827;border-bottom:2px solid #f3f4f6;padding-bottom:8px">
      📚 This week's progress
    </h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
      ${courseRows}
    </table>

    <h3 style="margin:0 0 12px;font-size:15px;color:#111827;border-bottom:2px solid #f3f4f6;padding-bottom:8px">
      🏆 Achievements unlocked
    </h3>
    <ul style="margin:0 0 24px;padding-left:0;list-style:none">
      ${achievementRows}
    </ul>

    <h3 style="margin:0 0 12px;font-size:15px;color:#111827;border-bottom:2px solid #f3f4f6;padding-bottom:8px">
      📅 Coming up
    </h3>
    <ul style="margin:0 0 24px;padding-left:0;list-style:none">
      ${upcomingRows}
    </ul>

    ${digest.aiSessionCount > 0 ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin:0 0 24px">
      <span style="font-size:14px;color:#15803d">🤖 You had <strong>${digest.aiSessionCount}</strong> AI learning session${digest.aiSessionCount !== 1 ? 's' : ''} this week. Great work!</span>
    </div>` : ''}

    <a href="${appUrl}/dashboard"
       style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px">
      Go to Dashboard →
    </a>
  </td></tr>
  <tr><td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center">
    © ${new Date().getFullYear()} EduAI Ultimate ·
    <a href="${appUrl}/notifications/preferences" style="color:#6b7280">Manage email preferences</a>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

    await this.emailService['send'](digest.userEmail, subject, html);
  }
}
