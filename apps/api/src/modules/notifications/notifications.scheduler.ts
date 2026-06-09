import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../database/prisma.service';

import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupOldNotifications() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const { count } = await this.prisma.notification.deleteMany({
      where: { isRead: true, createdAt: { lt: cutoff } },
    });

    if (count > 0) {
      this.logger.log(`Cleaned up ${count} old read notifications`);
    }
  }

  @Cron('0 8 * * *')
  async sendAssignmentDueReminders() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find assignments due in the next 24 hours
    const assignments = await this.prisma.assignment.findMany({
      where: {
        dueDate: { gte: now, lte: in24h },
      },
      include: {
        lesson: {
          include: {
            section: {
              include: {
                course: {
                  include: {
                    progress: {
                      where: { completedAt: null },
                      include: { student: { select: { userId: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const assignment of assignments) {
      const enrolledUserIds = assignment.lesson?.section?.course?.progress
        ?.map((p: any) => p.student?.userId)
        .filter(Boolean) as string[] ?? [];

      for (const userId of enrolledUserIds) {
        const alreadySubmitted = await this.prisma.submission.findFirst({
          where: { assignmentId: assignment.id, student: { userId } },
        });
        if (!alreadySubmitted) {
          await this.notificationsService.notifyUser(
            userId,
            'Assignment Due Tomorrow',
            `"${assignment.title}" is due within 24 hours. Don't forget to submit!`,
            { type: 'ASSIGNMENT_DUE', assignmentId: assignment.id }
          ).catch(() => {});
        }
      }
    }
  }
}
