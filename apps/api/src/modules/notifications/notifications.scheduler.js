"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NotificationsScheduler = void 0;
var _common = require("@nestjs/common");
var _schedule = require("@nestjs/schedule");
var _prisma = require("../database/prisma.service");
var _notifications = require("./notifications.service");
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
var NotificationsScheduler_1;
/* eslint-disable @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */

let NotificationsScheduler = exports.NotificationsScheduler = NotificationsScheduler_1 = class NotificationsScheduler {
  logger = new _common.Logger(NotificationsScheduler_1.name);
  constructor(prisma, notificationsService) {
    this.prisma = prisma;
    this.notificationsService = notificationsService;
  }
  async cleanupOldNotifications() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const {
      count
    } = await this.prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: {
          lt: cutoff
        }
      }
    });
    if (count > 0) {
      this.logger.log(`Cleaned up ${count} old read notifications`);
    }
  }
  async sendAssignmentDueReminders() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    // Find assignments due in the next 24 hours
    const assignments = await this.prisma.assignment.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: in24h
        }
      },
      include: {
        lesson: {
          include: {
            section: {
              include: {
                course: {
                  include: {
                    progress: {
                      where: {
                        completedAt: null
                      },
                      include: {
                        student: {
                          select: {
                            userId: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    for (const assignment of assignments) {
      const enrolledUserIds = assignment.lesson?.section?.course?.progress?.map(p => p.student?.userId).filter(Boolean) ?? [];
      for (const userId of enrolledUserIds) {
        const alreadySubmitted = await this.prisma.submission.findFirst({
          where: {
            assignmentId: assignment.id,
            student: {
              userId
            }
          }
        });
        if (!alreadySubmitted) {
          await this.notificationsService.notifyUser(userId, 'Assignment Due Tomorrow', `"${assignment.title}" is due within 24 hours. Don't forget to submit!`, {
            type: 'ASSIGNMENT_DUE',
            assignmentId: assignment.id
          }).catch(() => {});
        }
      }
    }
  }
};
__decorate([(0, _schedule.Cron)(_schedule.CronExpression.EVERY_DAY_AT_3AM), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", Promise)], NotificationsScheduler.prototype, "cleanupOldNotifications", null);
__decorate([(0, _schedule.Cron)('0 8 * * *'), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", Promise)], NotificationsScheduler.prototype, "sendAssignmentDueReminders", null);
exports.NotificationsScheduler = NotificationsScheduler = NotificationsScheduler_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_notifications.NotificationsService)), __metadata("design:paramtypes", [Object, Object])], NotificationsScheduler);