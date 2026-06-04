import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from '../../notifications.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  findAll(@CurrentUser() user: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.notificationsService.getUserNotifications(user.id, +page, +limit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  unreadCount(@CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllRead(user.id);
  }
}
