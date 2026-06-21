"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NotificationPreferencesService = void 0;
var _common = require("@nestjs/common");
var _prisma = require("../database/prisma.service");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = void 0 && (void 0).__metadata || function (k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = void 0 && (void 0).__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
const DEFAULTS = {
  courseEnrollment: {
    inApp: true,
    email: true,
    push: true
  },
  assignmentGraded: {
    inApp: true,
    email: true,
    push: true
  },
  liveSessionStarting: {
    inApp: true,
    email: false,
    push: true
  },
  newMessage: {
    inApp: true,
    email: true,
    push: true
  },
  achievementUnlocked: {
    inApp: true,
    email: false,
    push: true
  },
  paymentSucceeded: {
    inApp: true,
    email: true,
    push: false
  },
  paymentFailed: {
    inApp: true,
    email: true,
    push: true
  },
  weeklyDigest: {
    inApp: false,
    email: true,
    push: false
  },
  systemAnnouncements: {
    inApp: true,
    email: false,
    push: false
  },
  aiUsageThreshold: {
    inApp: true,
    email: true,
    push: false
  }
};
const PREFS_KEY = 'notificationPreferences';
let NotificationPreferencesService = exports.NotificationPreferencesService = class NotificationPreferencesService {
  constructor(prisma) {
    this.prisma = prisma;
  }
  async getPreferences(userId) {
    const profile = await this.prisma.userProfile.findUnique({
      where: {
        userId
      },
      select: {
        preferences: true
      }
    });
    if (!profile) return {
      ...DEFAULTS
    };
    const stored = profile.preferences?.[PREFS_KEY];
    if (!stored || typeof stored !== 'object') return {
      ...DEFAULTS
    };
    // Merge stored prefs over defaults so new keys always have a value
    return this.mergeWithDefaults(stored);
  }
  async updatePreferences(userId, updates) {
    const current = await this.getPreferences(userId);
    const merged = this.mergeWithDefaults({
      ...current,
      ...updates
    });
    // Upsert the profile so preferences are always stored
    await this.prisma.userProfile.upsert({
      where: {
        userId
      },
      create: {
        userId,
        preferences: {
          [PREFS_KEY]: merged
        }
      },
      update: {
        preferences: {
          // JSON merge — keep existing keys, overwrite notificationPreferences
          ...(await this.getRawPreferences(userId)),
          [PREFS_KEY]: merged
        }
      }
    });
    return merged;
  }
  async shouldNotify(userId, type, channel) {
    const prefs = await this.getPreferences(userId);
    return prefs[type]?.[channel] ?? true;
  }
  // ── Helpers ────────────────────────────────────────────────────────────────
  mergeWithDefaults(stored) {
    const result = {
      ...DEFAULTS
    };
    for (const key of Object.keys(DEFAULTS)) {
      if (stored[key] && typeof stored[key] === 'object') {
        result[key] = {
          ...DEFAULTS[key],
          ...stored[key]
        };
      }
    }
    return result;
  }
  async getRawPreferences(userId) {
    const profile = await this.prisma.userProfile.findUnique({
      where: {
        userId
      },
      select: {
        preferences: true
      }
    });
    return profile?.preferences ?? {};
  }
};
exports.NotificationPreferencesService = NotificationPreferencesService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], NotificationPreferencesService);