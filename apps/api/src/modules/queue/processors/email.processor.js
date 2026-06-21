"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EmailProcessor = void 0;
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
var EmailProcessor_1;
var _a, _b;
let EmailProcessor = exports.EmailProcessor = EmailProcessor_1 = class EmailProcessor {
  logger = new _common.Logger(EmailProcessor_1.name);
  constructor(notificationsService) {
    this.notificationsService = notificationsService;
  }
  async handleSend(job) {
    const {
      to,
      subject,
      html,
      text
    } = job.data;
    this.logger.log(`Sending email to ${to}: ${subject}`);
    await this.notificationsService.sendEmail(to, subject, html, text);
  }
  async handleBulk(job) {
    const {
      recipients
    } = job.data;
    this.logger.log(`Sending bulk email to ${recipients.length} recipients`);
    await Promise.allSettled(recipients.map(r => this.notificationsService.sendEmail(r.to, r.subject, r.html, r.text)));
  }
};
__decorate([(0, _bull.Process)('send'), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_a = typeof _bull2.Job !== "undefined" && _bull2.Job) === "function" ? _a : Object]), __metadata("design:returntype", Promise)], EmailProcessor.prototype, "handleSend", null);
__decorate([(0, _bull.Process)('bulk'), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_b = typeof _bull2.Job !== "undefined" && _bull2.Job) === "function" ? _b : Object]), __metadata("design:returntype", Promise)], EmailProcessor.prototype, "handleBulk", null);
exports.EmailProcessor = EmailProcessor = EmailProcessor_1 = __decorate([(0, _bull.Processor)(_queue.QUEUE_EMAIL), __param(0, (0, _common.Inject)(_notifications.NotificationsService)), __metadata("design:paramtypes", [Object])], EmailProcessor);