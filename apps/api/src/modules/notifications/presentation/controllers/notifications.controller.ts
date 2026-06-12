/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Post, Delete, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { NotificationsService } from '../../notifications.service';
import { NotificationPreferencesService, ChannelPreference, NotificationPreferences } from '../../notification-preferences.service';

class RegisterFcmTokenDto {
  @IsString() token: string;
  @IsOptional() @IsString() platform?: string;
}

class RemoveFcmTokenDto {
  @IsString() token: string;
}

class ChannelPreferenceDto implements ChannelPreference {
  @IsBoolean() inApp: boolean;
  @IsBoolean() email: boolean;
  @IsBoolean() push: boolean;
}

class UpdatePreferencesDto implements Partial<NotificationPreferences> {
  @IsOptional() @ValidateNested() @Type(() => ChannelPreferenceDto) courseEnrollment?: ChannelPreferenceDto;
  @IsOptional() @ValidateNested() @Type(() => ChannelPreferenceDto) assignmentGraded?: ChannelPreferenceDto;
  @IsOptional() @ValidateNested() @Type(() => ChannelPreferenceDto) liveSessionStarting?: ChannelPreferenceDto;
  @IsOptional() @ValidateNested() @Type(() => ChannelPreferenceDto) newMessage?: ChannelPreferenceDto;
  @IsOptional() @ValidateNested() @Type(() => ChannelPreferenceDto) achievementUnlocked?: ChannelPreferenceDto;
  @IsOptional() @ValidateNested() @Type(() => ChannelPreferenceDto) paymentSucceeded?: ChannelPreferenceDto;
  @IsOptional() @ValidateNested() @Type(() => ChannelPreferenceDto) paymentFailed?: ChannelPreferenceDto;
  @IsOptional() @ValidateNested() @Type(() => ChannelPreferenceDto) weeklyDigest?: ChannelPreferenceDto;
  @IsOptional() @ValidateNested() @Type(() => ChannelPreferenceDto) systemAnnouncements?: ChannelPreferenceDto;
  @IsOptional() @ValidateNested() @Type(() => ChannelPreferenceDto) aiUsageThreshold?: ChannelPreferenceDto;
}

class SendTestNotificationDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() message?: string;
}

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly preferencesService: NotificationPreferencesService,
  ) {}

  // ── Push token management ─────────────────────────────────────────────────

  @Post('fcm-token')
  @ApiOperation({ summary: 'Register FCM device token for push notifications' })
  registerFcmToken(@CurrentUser() user: any, @Body() dto: RegisterFcmTokenDto) {
    return this.notificationsService.registerFcmToken(user.id, dto.token, dto.platform ?? 'WEB');
  }

  @Delete('fcm-token')
  @ApiOperation({ summary: 'Remove FCM token (on logout)' })
  removeFcmToken(@CurrentUser() user: any, @Body() dto: RemoveFcmTokenDto) {
    return this.notificationsService.removeFcmToken(user.id, dto.token);
  }

  // ── Preferences (must be before :id routes) ───────────────────────────────

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  getPreferences(@CurrentUser() user: any) {
    return this.preferencesService.getPreferences(user.id);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  updatePreferences(@CurrentUser() user: any, @Body() dto: UpdatePreferencesDto) {
    return this.preferencesService.updatePreferences(user.id, dto);
  }

  // ── Notification list & counts ────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get user notifications (paginated)' })
  findAll(@CurrentUser() user: any, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.notificationsService.getUserNotifications(user.id, +page, +limit);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async unreadCount(@CurrentUser() user: any) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────

  @Post('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllReadPost(@CurrentUser() user: any) {
    return this.notificationsService.markAllRead(user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read (PATCH alias)' })
  markAllRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllRead(user.id);
  }

  // ── Dev / testing ─────────────────────────────────────────────────────────

  @Post('test')
  @ApiOperation({ summary: 'Send a test notification to the current user (dev only)' })
  async sendTest(@CurrentUser() user: any, @Body() dto: SendTestNotificationDto) {
    await this.notificationsService.notifyUser(
      user.id,
      dto.title ?? 'Test Notification',
      dto.message ?? 'This is a test notification from EduAI.',
      { type: 'GENERAL' },
    );
    return { sent: true };
  }

  // ── Single notification ───────────────────────────────────────────────────

  @Post('mark-read/:id')
  @ApiOperation({ summary: 'Mark single notification as read (POST)' })
  markReadPost(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read (PATCH)' })
  markRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.markRead(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  deleteNotification(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.deleteNotification(user.id, id);
  }
}
