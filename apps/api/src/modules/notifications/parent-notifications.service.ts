import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

import { NotificationsService } from './notifications.service';

@Injectable()
export class ParentNotificationsService {
  private readonly logger = new Logger(ParentNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Resolve all linked parent userIds for a given studentId. */
  private async getParentUserIds(studentId: string): Promise<string[]> {
    const links = await this.prisma.parentStudent.findMany({
      where: { studentId },
      include: { parent: { select: { userId: true } } },
    });
    return links.map(l => l.parent.userId);
  }

  private studentName(first?: string | null, last?: string | null) {
    return [first, last].filter(Boolean).join(' ') || 'Your child';
  }

  /**
   * Notify linked parents when a student's assignment submission is graded.
   */
  async notifyParentsOfGradedSubmission(params: {
    studentId: string;
    studentFirstName?: string;
    studentLastName?: string;
    assignmentTitle: string;
    score: number;
    maxScore: number;
  }) {
    const parentIds = await this.getParentUserIds(params.studentId);
    if (!parentIds.length) {return;}

    const name = this.studentName(params.studentFirstName, params.studentLastName);
    const pct = Math.round((params.score / params.maxScore) * 100);
    const title = `${name}'s assignment has been graded`;
    const body = `"${params.assignmentTitle}" — ${params.score}/${params.maxScore} (${pct}%)`;

    await Promise.all(
      parentIds.map(uid =>
        this.notifications.notifyUser(uid, title, body, {
          type: 'GRADE',
          studentId: params.studentId,
          assignmentTitle: params.assignmentTitle,
          score: params.score,
          maxScore: params.maxScore,
          href: '/parents',
        }),
      ),
    );
    this.logger.log(`Notified ${parentIds.length} parent(s) of graded submission for student ${params.studentId}`);
  }

  /**
   * Notify linked parents when a student is marked absent.
   */
  async notifyParentsOfAbsence(params: {
    studentId: string;
    studentFirstName?: string;
    studentLastName?: string;
    sessionTitle: string;
    date: Date;
  }) {
    const parentIds = await this.getParentUserIds(params.studentId);
    if (!parentIds.length) {return;}

    const name = this.studentName(params.studentFirstName, params.studentLastName);
    const dateStr = params.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const title = `Attendance alert for ${name}`;
    const body = `${name} was marked absent from "${params.sessionTitle}" on ${dateStr}.`;

    await Promise.all(
      parentIds.map(uid =>
        this.notifications.notifyUser(uid, title, body, {
          type: 'ABSENCE',
          studentId: params.studentId,
          sessionTitle: params.sessionTitle,
          date: params.date.toISOString(),
          href: '/parents',
        }),
      ),
    );
    this.logger.log(`Notified ${parentIds.length} parent(s) of absence for student ${params.studentId}`);
  }

  /**
   * Notify linked parents when a student reaches a course progress milestone
   * (25%, 50%, 75%, 100%).
   */
  async notifyParentsOfProgressMilestone(params: {
    studentId: string;
    studentFirstName?: string;
    studentLastName?: string;
    courseTitle: string;
    percent: number;
  }) {
    const MILESTONES = [25, 50, 75, 100];
    if (!MILESTONES.includes(params.percent)) {return;}

    const parentIds = await this.getParentUserIds(params.studentId);
    if (!parentIds.length) {return;}

    const name = this.studentName(params.studentFirstName, params.studentLastName);
    const emoji = params.percent === 100 ? '🎉' : '📈';
    const title = `${emoji} ${name} reached ${params.percent}% in a course`;
    const body = `${name} has completed ${params.percent}% of "${params.courseTitle}".`;

    await Promise.all(
      parentIds.map(uid =>
        this.notifications.notifyUser(uid, title, body, {
          type: 'PROGRESS',
          studentId: params.studentId,
          courseTitle: params.courseTitle,
          percent: params.percent,
          href: '/parents',
        }),
      ),
    );
    this.logger.log(`Notified ${parentIds.length} parent(s) of ${params.percent}% milestone for student ${params.studentId}`);
  }

  /**
   * Notify linked parents when an assignment is due in 24 hours for their child.
   */
  async notifyParentsOfUpcomingDue(params: {
    studentId: string;
    studentFirstName?: string;
    studentLastName?: string;
    assignmentTitle: string;
    dueDate: Date;
  }) {
    const parentIds = await this.getParentUserIds(params.studentId);
    if (!parentIds.length) {return;}

    const name = this.studentName(params.studentFirstName, params.studentLastName);
    const dateStr = params.dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const title = `Assignment due tomorrow for ${name}`;
    const body = `"${params.assignmentTitle}" is due on ${dateStr}.`;

    await Promise.all(
      parentIds.map(uid =>
        this.notifications.notifyUser(uid, title, body, {
          type: 'DUE_REMINDER',
          studentId: params.studentId,
          assignmentTitle: params.assignmentTitle,
          dueDate: params.dueDate.toISOString(),
          href: '/parents',
        }),
      ),
    );
  }
}
