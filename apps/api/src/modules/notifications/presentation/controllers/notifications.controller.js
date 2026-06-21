"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NotificationsController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _classValidator = require("class-validator");
var _classTransformer = require("class-transformer");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _notifications = require("../../notifications.service");
var _notificationPreferences = require("../../notification-preferences.service");
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
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

class RegisterFcmTokenDto {
  token;
  platform;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], RegisterFcmTokenDto.prototype, "token", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], RegisterFcmTokenDto.prototype, "platform", void 0);
class RemoveFcmTokenDto {
  token;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], RemoveFcmTokenDto.prototype, "token", void 0);
class ChannelPreferenceDto {
  inApp;
  email;
  push;
}
__decorate([(0, _classValidator.IsBoolean)(), __metadata("design:type", Boolean)], ChannelPreferenceDto.prototype, "inApp", void 0);
__decorate([(0, _classValidator.IsBoolean)(), __metadata("design:type", Boolean)], ChannelPreferenceDto.prototype, "email", void 0);
__decorate([(0, _classValidator.IsBoolean)(), __metadata("design:type", Boolean)], ChannelPreferenceDto.prototype, "push", void 0);
class UpdatePreferencesDto {
  courseEnrollment;
  assignmentGraded;
  liveSessionStarting;
  newMessage;
  achievementUnlocked;
  paymentSucceeded;
  paymentFailed;
  weeklyDigest;
  systemAnnouncements;
  aiUsageThreshold;
}
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.ValidateNested)(), (0, _classTransformer.Type)(() => ChannelPreferenceDto), __metadata("design:type", ChannelPreferenceDto)], UpdatePreferencesDto.prototype, "courseEnrollment", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.ValidateNested)(), (0, _classTransformer.Type)(() => ChannelPreferenceDto), __metadata("design:type", ChannelPreferenceDto)], UpdatePreferencesDto.prototype, "assignmentGraded", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.ValidateNested)(), (0, _classTransformer.Type)(() => ChannelPreferenceDto), __metadata("design:type", ChannelPreferenceDto)], UpdatePreferencesDto.prototype, "liveSessionStarting", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.ValidateNested)(), (0, _classTransformer.Type)(() => ChannelPreferenceDto), __metadata("design:type", ChannelPreferenceDto)], UpdatePreferencesDto.prototype, "newMessage", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.ValidateNested)(), (0, _classTransformer.Type)(() => ChannelPreferenceDto), __metadata("design:type", ChannelPreferenceDto)], UpdatePreferencesDto.prototype, "achievementUnlocked", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.ValidateNested)(), (0, _classTransformer.Type)(() => ChannelPreferenceDto), __metadata("design:type", ChannelPreferenceDto)], UpdatePreferencesDto.prototype, "paymentSucceeded", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.ValidateNested)(), (0, _classTransformer.Type)(() => ChannelPreferenceDto), __metadata("design:type", ChannelPreferenceDto)], UpdatePreferencesDto.prototype, "paymentFailed", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.ValidateNested)(), (0, _classTransformer.Type)(() => ChannelPreferenceDto), __metadata("design:type", ChannelPreferenceDto)], UpdatePreferencesDto.prototype, "weeklyDigest", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.ValidateNested)(), (0, _classTransformer.Type)(() => ChannelPreferenceDto), __metadata("design:type", ChannelPreferenceDto)], UpdatePreferencesDto.prototype, "systemAnnouncements", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.ValidateNested)(), (0, _classTransformer.Type)(() => ChannelPreferenceDto), __metadata("design:type", ChannelPreferenceDto)], UpdatePreferencesDto.prototype, "aiUsageThreshold", void 0);
class SendTestNotificationDto {
  title;
  message;
}
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], SendTestNotificationDto.prototype, "title", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], SendTestNotificationDto.prototype, "message", void 0);
let NotificationsController = exports.NotificationsController = class NotificationsController {
  constructor(notificationsService, preferencesService) {
    this.notificationsService = notificationsService;
    this.preferencesService = preferencesService;
  }
  // ── Push token management ─────────────────────────────────────────────────
  registerFcmToken(user, dto) {
    return this.notificationsService.registerFcmToken(user.id, dto.token, dto.platform ?? 'WEB');
  }
  removeFcmToken(user, dto) {
    return this.notificationsService.removeFcmToken(user.id, dto.token);
  }
  // ── Preferences (must be before :id routes) ───────────────────────────────
  getPreferences(user) {
    return this.preferencesService.getPreferences(user.id);
  }
  updatePreferences(user, dto) {
    return this.preferencesService.updatePreferences(user.id, dto);
  }
  // ── Notification list & counts ────────────────────────────────────────────
  findAll(user, page = 1, limit = 20) {
    return this.notificationsService.getUserNotifications(user.id, +page, +limit);
  }
  async unreadCount(user) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return {
      count
    };
  }
  // ── Bulk actions ──────────────────────────────────────────────────────────
  markAllReadPost(user) {
    return this.notificationsService.markAllRead(user.id);
  }
  markAllRead(user) {
    return this.notificationsService.markAllRead(user.id);
  }
  // ── Dev / testing ─────────────────────────────────────────────────────────
  async sendTest(user, dto) {
    await this.notificationsService.notifyUser(user.id, dto.title ?? 'Test Notification', dto.message ?? 'This is a test notification from EduAI.', {
      type: 'GENERAL'
    });
    return {
      sent: true
    };
  }
  // ── Single notification ───────────────────────────────────────────────────
  markReadPost(id, user) {
    return this.notificationsService.markRead(user.id, id);
  }
  markRead(id, user) {
    return this.notificationsService.markRead(user.id, id);
  }
  deleteNotification(id, user) {
    return this.notificationsService.deleteNotification(user.id, id);
  }
};
__decorate([(0, _common.Post)('fcm-token'), (0, _swagger.ApiOperation)({
  summary: 'Register FCM device token for push notifications'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, RegisterFcmTokenDto]), __metadata("design:returntype", void 0)], NotificationsController.prototype, "registerFcmToken", null);
__decorate([(0, _common.Delete)('fcm-token'), (0, _swagger.ApiOperation)({
  summary: 'Remove FCM token (on logout)'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, RemoveFcmTokenDto]), __metadata("design:returntype", void 0)], NotificationsController.prototype, "removeFcmToken", null);
__decorate([(0, _common.Get)('preferences'), (0, _swagger.ApiOperation)({
  summary: 'Get notification preferences'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], NotificationsController.prototype, "getPreferences", null);
__decorate([(0, _common.Patch)('preferences'), (0, _swagger.ApiOperation)({
  summary: 'Update notification preferences'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, UpdatePreferencesDto]), __metadata("design:returntype", void 0)], NotificationsController.prototype, "updatePreferences", null);
__decorate([(0, _common.Get)(), (0, _swagger.ApiOperation)({
  summary: 'Get user notifications (paginated)'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Query)('page')), __param(2, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, Object]), __metadata("design:returntype", void 0)], NotificationsController.prototype, "findAll", null);
__decorate([(0, _common.Get)('unread-count'), (0, _swagger.ApiOperation)({
  summary: 'Get unread notification count'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", Promise)], NotificationsController.prototype, "unreadCount", null);
__decorate([(0, _common.Post)('mark-all-read'), (0, _swagger.ApiOperation)({
  summary: 'Mark all notifications as read'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], NotificationsController.prototype, "markAllReadPost", null);
__decorate([(0, _common.Patch)('read-all'), (0, _swagger.ApiOperation)({
  summary: 'Mark all notifications as read (PATCH alias)'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], NotificationsController.prototype, "markAllRead", null);
__decorate([(0, _common.Post)('test'), (0, _swagger.ApiOperation)({
  summary: 'Send a test notification to the current user (dev only)'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, SendTestNotificationDto]), __metadata("design:returntype", Promise)], NotificationsController.prototype, "sendTest", null);
__decorate([(0, _common.Post)('mark-read/:id'), (0, _swagger.ApiOperation)({
  summary: 'Mark single notification as read (POST)'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], NotificationsController.prototype, "markReadPost", null);
__decorate([(0, _common.Patch)(':id/read'), (0, _swagger.ApiOperation)({
  summary: 'Mark notification as read (PATCH)'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], NotificationsController.prototype, "markRead", null);
__decorate([(0, _common.Delete)(':id'), (0, _swagger.ApiOperation)({
  summary: 'Delete a notification'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], NotificationsController.prototype, "deleteNotification", null);
exports.NotificationsController = NotificationsController = __decorate([(0, _swagger.ApiTags)('Notifications'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Controller)('notifications'), __param(0, (0, _common.Inject)(_notifications.NotificationsService)), __param(1, (0, _common.Inject)(_notificationPreferences.NotificationPreferencesService)), __metadata("design:paramtypes", [Object, Object])], NotificationsController);