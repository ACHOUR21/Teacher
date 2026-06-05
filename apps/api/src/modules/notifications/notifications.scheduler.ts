import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(private readonly prisma: PrismaService) {}

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
}
