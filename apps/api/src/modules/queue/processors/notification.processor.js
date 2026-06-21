"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NotificationProcessor = void 0;
var _bull = require("@nestjs/bull");
var _common = require("@nestjs/common");
var _bull2 = require("bull");
var _notifications = require("../../notifications/notifications.service");
var _queue = require("../queue.module");
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
var NotificationProcessor_1;
var _a, _b, _c;
let NotificationProcessor = exports.NotificationProcessor = NotificationProcessor_1 = class NotificationProcessor {
  logger = new _common.Logger(NotificationProcessor_1.name);
  constructor(notificationsService) {
    this.notificationsService = notificationsService;
  }
  async handleNotifyUser(job) {
    const {
      userId,
      title,
      body,
      data
    } = job.data;
    this.logger.log(`Notifying user ${userId}: ${title}`);
    await this.notificationsService.notifyUser(userId, title, body, data);
  }
  async handlePush(job) {
    const {
      fcmToken,
      title,
      body,
      data
    } = job.data;
    this.logger.log(`Sending push to token: ${fcmToken.substring(0, 8)}...`);
    await this.notificationsService.sendPush(fcmToken, title, body, data);
  }
  async handleSms(job) {
    const {
      to,
      body
    } = job.data;
    this.logger.log(`Sending SMS to ${to}`);
    await this.notificationsService.sendSms(to, body);
  }
};
__decorate([(0, _bull.Process)('notify-user'), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_a = typeof _bull2.Job !== "undefined" && _bull2.Job) === "function" ? _a : Object]), __metadata("design:returntype", Promise)], NotificationProcessor.prototype, "handleNotifyUser", null);
__decorate([(0, _bull.Process)('push'), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_b = typeof _bull2.Job !== "undefined" && _bull2.Job) === "function" ? _b : Object]), __metadata("design:returntype", Promise)], NotificationProcessor.prototype, "handlePush", null);
__decorate([(0, _bull.Process)('sms'), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_c = typeof _bull2.Job !== "undefined" && _bull2.Job) === "function" ? _c : Object]), __metadata("design:returntype", Promise)], NotificationProcessor.prototype, "handleSms", null);
exports.NotificationProcessor = NotificationProcessor = NotificationProcessor_1 = __decorate([(0, _bull.Processor)(_queue.QUEUE_NOTIFICATION), __param(0, (0, _common.Inject)(_notifications.NotificationsService)), __metadata("design:paramtypes", [Object])], NotificationProcessor);