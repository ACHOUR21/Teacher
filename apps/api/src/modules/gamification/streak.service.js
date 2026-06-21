"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StreakService = void 0;
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
let StreakService = exports.StreakService = class StreakService {
  constructor(prisma) {
    this.prisma = prisma;
  }
  async recordActivity(userId, tenantId) {
    const record = await this.prisma.userPoints.findUnique({
      where: {
        userId
      }
    });
    const todayUtc = this.startOfDayUtc(new Date());
    const yesterdayUtc = new Date(todayUtc);
    yesterdayUtc.setUTCDate(yesterdayUtc.getUTCDate() - 1);
    if (!record) {
      // First ever activity
      await this.prisma.userPoints.create({
        data: {
          userId,
          total: 0,
          level: 1,
          streak: 1,
          longestStreak: 1,
          lastActivityDate: todayUtc
        }
      });
      return {
        streak: 1,
        isNewDay: true,
        streakBroken: false
      };
    }
    const lastActivity = record.lastActivityDate ? this.startOfDayUtc(record.lastActivityDate) : null;
    // Same day — no change
    if (lastActivity && lastActivity.getTime() === todayUtc.getTime()) {
      return {
        streak: record.streak,
        isNewDay: false,
        streakBroken: false
      };
    }
    let newStreak;
    let streakBroken = false;
    if (!lastActivity) {
      // No previous activity
      newStreak = 1;
    } else if (lastActivity.getTime() === yesterdayUtc.getTime()) {
      // Consecutive day
      newStreak = record.streak + 1;
    } else {
      // Gap in activity — streak broken
      newStreak = 1;
      streakBroken = true;
    }
    const newLongest = Math.max(newStreak, record.longestStreak);
    await this.prisma.userPoints.update({
      where: {
        userId
      },
      data: {
        streak: newStreak,
        longestStreak: newLongest,
        lastActivityDate: todayUtc
      }
    });
    return {
      streak: newStreak,
      isNewDay: true,
      streakBroken
    };
  }
  async getStreak(userId) {
    const record = await this.prisma.userPoints.findUnique({
      where: {
        userId
      }
    });
    return {
      currentStreak: record?.streak ?? 0,
      longestStreak: record?.longestStreak ?? 0,
      lastActivityDate: record?.lastActivityDate?.toISOString() ?? null
    };
  }
  startOfDayUtc(date) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
};
exports.StreakService = StreakService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], StreakService);