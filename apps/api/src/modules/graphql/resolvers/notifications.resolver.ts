/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';

import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { NotificationsService } from '../../notifications/notifications.service';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { Notification, NotificationPage } from '../types/notification.types';

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => NotificationPage, { name: 'myNotifications' })
  @UseGuards(GqlAuthGuard)
  async getNotifications(
    @CurrentUser() user: { id: string },
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ) {
    const result = await this.notificationsService.getUserNotifications(user.id, page, limit);
    return {
      data: (result as any).data,
      meta: {
        total: (result as any).total,
        page: (result as any).page,
        totalPages: (result as any).totalPages,
        limit,
      },
    };
  }

  @Query(() => Int, { name: 'unreadNotificationCount' })
  @UseGuards(GqlAuthGuard)
  async getUnreadCount(@CurrentUser() user: { id: string }): Promise<number> {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Mutation(() => Notification, { name: 'markNotificationRead' })
  @UseGuards(GqlAuthGuard)
  async markRead(
    @Args('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Mutation(() => Boolean, { name: 'markAllNotificationsRead' })
  @UseGuards(GqlAuthGuard)
  async markAllRead(@CurrentUser() user: { id: string }): Promise<boolean> {
    await this.notificationsService.markAllRead(user.id);
    return true;
  }
}
