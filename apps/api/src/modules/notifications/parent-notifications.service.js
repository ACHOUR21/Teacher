"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ParentNotificationsService = void 0;
var _common = require("@nestjs/common");
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
var ParentNotificationsService_1;
let ParentNotificationsService = exports.ParentNotificationsService = ParentNotificationsService_1 = class ParentNotificationsService {
  logger = new _common.Logger(ParentNotificationsService_1.name);
  constructor(prisma, notifications) {
    this.prisma = prisma;
    this.notifications = notifications;
  }
  /** Resolve all linked parent userIds for a given studentId. */
  async getParentUserIds(studentId) {
    const links = await this.prisma.parentStudent.findMany({
      where: {
        studentId
      },
      include: {
        parent: {
          select: {
            userId: true
          }
        }
      }
    });
    return links.map(l => l.parent.userId);
  }
  studentName(first, last) {
    return [first, last].filter(Boolean).join(' ') || 'Your child';
  }
  /**
   * Notify linked parents when a student's assignment submission is graded.
   */
  async notifyParentsOfGradedSubmission(params) {
    const parentIds = await this.getParentUserIds(params.studentId);
    if (!parentIds.length) {
      return;
    }
    const name = this.studentName(params.studentFirstName, params.studentLastName);
    const pct = Math.round(params.score / params.maxScore * 100);
    const title = `${name}'s assignment has been graded`;
    const body = `"${params.assignmentTitle}" — ${params.score}/${params.maxScore} (${pct}%)`;
    await Promise.all(parentIds.map(uid => this.notifications.notifyUser(uid, title, body, {
      type: 'GRADE',
      studentId: params.studentId,
      assignmentTitle: params.assignmentTitle,
      score: params.score,
      maxScore: params.maxScore,
      href: '/parents'
    })));
    this.logger.log(`Notified ${parentIds.length} parent(s) of graded submission for student ${params.studentId}`);
  }
  /**
   * Notify linked parents when a student is marked absent.
   */
  async notifyParentsOfAbsence(params) {
    const parentIds = await this.getParentUserIds(params.studentId);
    if (!parentIds.length) {
      return;
    }
    const name = this.studentName(params.studentFirstName, params.studentLastName);
    const dateStr = params.date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    const title = `Attendance alert for ${name}`;
    const body = `${name} was marked absent from "${params.sessionTitle}" on ${dateStr}.`;
    await Promise.all(parentIds.map(uid => this.notifications.notifyUser(uid, title, body, {
      type: 'ABSENCE',
      studentId: params.studentId,
      sessionTitle: params.sessionTitle,
      date: params.date.toISOString(),
      href: '/parents'
    })));
    this.logger.log(`Notified ${parentIds.length} parent(s) of absence for student ${params.studentId}`);
  }
  /**
   * Notify linked parents when a student reaches a course progress milestone
   * (25%, 50%, 75%, 100%).
   */
  async notifyParentsOfProgressMilestone(params) {
    const MILESTONES = [25, 50, 75, 100];
    if (!MILESTONES.includes(params.percent)) {
      return;
    }
    const parentIds = await this.getParentUserIds(params.studentId);
    if (!parentIds.length) {
      return;
    }
    const name = this.studentName(params.studentFirstName, params.studentLastName);
    const emoji = params.percent === 100 ? '🎉' : '📈';
    const title = `${emoji} ${name} reached ${params.percent}% in a course`;
    const body = `${name} has completed ${params.percent}% of "${params.courseTitle}".`;
    await Promise.all(parentIds.map(uid => this.notifications.notifyUser(uid, title, body, {
      type: 'PROGRESS',
      studentId: params.studentId,
      courseTitle: params.courseTitle,
      percent: params.percent,
      href: '/parents'
    })));
    this.logger.log(`Notified ${parentIds.length} parent(s) of ${params.percent}% milestone for student ${params.studentId}`);
  }
  /**
   * Notify linked parents when an assignment is due in 24 hours for their child.
   */
  async notifyParentsOfUpcomingDue(params) {
    const parentIds = await this.getParentUserIds(params.studentId);
    if (!parentIds.length) {
      return;
    }
    const name = this.studentName(params.studentFirstName, params.studentLastName);
    const dateStr = params.dueDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const title = `Assignment due tomorrow for ${name}`;
    const body = `"${params.assignmentTitle}" is due on ${dateStr}.`;
    await Promise.all(parentIds.map(uid => this.notifications.notifyUser(uid, title, body, {
      type: 'DUE_REMINDER',
      studentId: params.studentId,
      assignmentTitle: params.assignmentTitle,
      dueDate: params.dueDate.toISOString(),
      href: '/parents'
    })));
  }
};
exports.ParentNotificationsService = ParentNotificationsService = ParentNotificationsService_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_prisma.PrismaService)), __param(1, (0, _common.Inject)(_notifications.NotificationsService)), __metadata("design:paramtypes", [Object, Object])], ParentNotificationsService);