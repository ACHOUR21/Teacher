import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

export interface ChannelPreference {
  inApp: boolean;
  email: boolean;
  push: boolean;
}

export interface NotificationPreferences {
  courseEnrollment: ChannelPreference;
  assignmentGraded: ChannelPreference;
  liveSessionStarting: ChannelPreference;
  newMessage: ChannelPreference;
  achievementUnlocked: ChannelPreference;
  paymentSucceeded: ChannelPreference;
  paymentFailed: ChannelPreference;
  weeklyDigest: ChannelPreference;
  systemAnnouncements: ChannelPreference;
  aiUsageThreshold: ChannelPreference;
}

const DEFAULTS: NotificationPreferences = {
  courseEnrollment:    { inApp: true,  email: true,  push: true  },
  assignmentGraded:    { inApp: true,  email: true,  push: true  },
  liveSessionStarting: { inApp: true,  email: false, push: true  },
  newMessage:          { inApp: true,  email: true,  push: true  },
  achievementUnlocked: { inApp: true,  email: false, push: true  },
  paymentSucceeded:    { inApp: true,  email: true,  push: false },
  paymentFailed:       { inApp: true,  email: true,  push: true  },
  weeklyDigest:        { inApp: false, email: true,  push: false },
  systemAnnouncements: { inApp: true,  email: false, push: false },
  aiUsageThreshold:    { inApp: true,  email: true,  push: false },
};

const PREFS_KEY = 'notificationPreferences';

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { preferences: true },
    });

    if (!profile) return { ...DEFAULTS };

    const stored = (profile.preferences as Record<string, unknown>)?.[PREFS_KEY];
    if (!stored || typeof stored !== 'object') return { ...DEFAULTS };

    // Merge stored prefs over defaults so new keys always have a value
    return this.mergeWithDefaults(stored as Partial<NotificationPreferences>);
  }

  async updatePreferences(
    userId: string,
    updates: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const current = await this.getPreferences(userId);
    const merged = this.mergeWithDefaults({ ...current, ...updates });

    // Upsert the profile so preferences are always stored
    await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        preferences: { [PREFS_KEY]: merged } as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
      update: {
        preferences: {
          // JSON merge — keep existing keys, overwrite notificationPreferences
          ...(await this.getRawPreferences(userId)),
          [PREFS_KEY]: merged,
        } as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    });

    return merged;
  }

  async shouldNotify(
    userId: string,
    type: keyof NotificationPreferences,
    channel: 'inApp' | 'email' | 'push',
  ): Promise<boolean> {
    const prefs = await this.getPreferences(userId);
    return prefs[type]?.[channel] ?? true;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private mergeWithDefaults(stored: Partial<NotificationPreferences>): NotificationPreferences {
    const result = { ...DEFAULTS };
    for (const key of Object.keys(DEFAULTS) as Array<keyof NotificationPreferences>) {
      if (stored[key] && typeof stored[key] === 'object') {
        result[key] = { ...DEFAULTS[key], ...stored[key] };
      }
    }
    return result;
  }

  private async getRawPreferences(userId: string): Promise<Record<string, unknown>> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { preferences: true },
    });
    return (profile?.preferences as Record<string, unknown>) ?? {};
  }
}
