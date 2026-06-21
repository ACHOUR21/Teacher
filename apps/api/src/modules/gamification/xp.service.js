"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.XpService = void 0;
var _common = require("@nestjs/common");
var _prisma = require("../database/prisma.service");
var _levelCalculator = require("./domain/level-calculator");
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
let XpService = exports.XpService = class XpService {
  XP_AWARDS = {
    LESSON_COMPLETED: 10,
    COURSE_COMPLETED: 100,
    QUIZ_PASSED: 25,
    QUIZ_PERFECT: 50,
    FLASHCARD_REVIEWED: 2,
    AI_TUTOR_SESSION: 5,
    DAILY_LOGIN: 15,
    ASSIGNMENT_SUBMITTED: 20,
    COMMENT_POSTED: 3,
    PEER_HELPED: 10
  };
  constructor(prisma) {
    this.prisma = prisma;
  }
  getLevel(totalXp) {
    return (0, _levelCalculator.calculateLevel)(totalXp);
  }
  getXpForNextLevel(currentLevel) {
    // Using the formula: level*(level-1)*50 = xp threshold for that level
    return (currentLevel + 1) * currentLevel * 50;
  }
  getProgressToNextLevel(totalXp) {
    const level = this.getLevel(totalXp);
    const currentLevelXp = level <= 1 ? 0 : level * (level - 1) * 50;
    const nextLevelXp = (level + 1) * level * 50;
    const xpIntoLevel = totalXp - currentLevelXp;
    const xpNeededForLevel = nextLevelXp - currentLevelXp;
    const progress = xpNeededForLevel > 0 ? Math.min(100, Math.round(xpIntoLevel / xpNeededForLevel * 100)) : 100;
    return {
      level,
      currentXp: xpIntoLevel,
      nextLevelXp: xpNeededForLevel,
      progress
    };
  }
  async awardXp(userId, tenantId, action, multiplier = 1) {
    const xp = (this.XP_AWARDS[action] ?? 0) * multiplier;
    if (xp <= 0) {
      const current = await this.prisma.userPoints.findUnique({
        where: {
          userId
        }
      });
      const totalXp = current?.total ?? 0;
      return {
        xp: 0,
        totalXp,
        levelUp: false
      };
    }
    // Get current state before awarding
    const before = await this.prisma.userPoints.findUnique({
      where: {
        userId
      }
    });
    const oldLevel = (0, _levelCalculator.calculateLevel)(before?.total ?? 0);
    // Upsert user points
    const updated = await this.prisma.userPoints.upsert({
      where: {
        userId
      },
      update: {
        total: {
          increment: xp
        }
      },
      create: {
        userId,
        total: xp,
        level: 1
      }
    });
    const totalXp = updated.total;
    const newLevel = (0, _levelCalculator.calculateLevel)(totalXp);
    const levelUp = newLevel > oldLevel;
    // Record gamification event
    await this.prisma.gamificationEvent.create({
      data: {
        userId,
        eventType: action.toLowerCase(),
        xpAwarded: xp,
        metadata: {
          action,
          multiplier,
          tenantId
        }
      }
    });
    // Persist the updated level
    if (levelUp) {
      await this.prisma.userPoints.update({
        where: {
          userId
        },
        data: {
          level: newLevel
        }
      });
    }
    return {
      xp,
      totalXp,
      levelUp,
      ...(levelUp ? {
        newLevel
      } : {})
    };
  }
  getXpAwards() {
    return {
      ...this.XP_AWARDS
    };
  }
};
exports.XpService = XpService = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object])], XpService);