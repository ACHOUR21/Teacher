"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NotificationsModule = void 0;
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _jwt = require("@nestjs/jwt");
var _database = require("../database/database.module");
var _email = require("../queue/processors/email.processor");
var _notification = require("../queue/processors/notification.processor");
var _queue = require("../queue/queue.module");
var _emailPreview = require("./email/email-preview.controller");
var _email2 = require("./email/email.service");
var _notificationDigest = require("./notification-digest.service");
var _notificationPreferences = require("./notification-preferences.service");
var _notifications = require("./notifications.gateway");
var _notifications2 = require("./notifications.scheduler");
var _notifications3 = require("./notifications.service");
var _parentNotifications = require("./parent-notifications.service");
var _notifications4 = require("./presentation/controllers/notifications.controller");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let NotificationsModule = exports.NotificationsModule = class NotificationsModule {};
exports.NotificationsModule = NotificationsModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _queue.QueueModule, _jwt.JwtModule.registerAsync({
    imports: [_config.ConfigModule],
    useFactory: config => ({
      secret: config.get('JWT_SECRET', 'secret')
    }),
    inject: [_config.ConfigService]
  })],
  controllers: [_notifications4.NotificationsController, _emailPreview.EmailPreviewController],
  providers: [_notifications3.NotificationsService, _notifications2.NotificationsScheduler, _notifications.NotificationsGateway, _parentNotifications.ParentNotificationsService, _email.EmailProcessor, _notification.NotificationProcessor, _email2.EmailService, _notificationPreferences.NotificationPreferencesService, _notificationDigest.NotificationDigestService],
  exports: [_notifications3.NotificationsService, _notifications.NotificationsGateway, _parentNotifications.ParentNotificationsService, _email2.EmailService, _notificationPreferences.NotificationPreferencesService]
})], NotificationsModule);