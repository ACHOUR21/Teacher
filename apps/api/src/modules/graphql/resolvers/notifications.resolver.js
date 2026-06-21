"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NotificationsResolver = void 0;
var _common = require("@nestjs/common");
var _graphql = require("@nestjs/graphql");
var _currentUser = require("../../core/decorators/current-user.decorator");
var _notifications = require("../../notifications/notifications.service");
var _gqlAuth = require("../guards/gql-auth.guard");
var _notification = require("../types/notification.types");
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
var _a, _b;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */

let NotificationsResolver = exports.NotificationsResolver = class NotificationsResolver {
  constructor(notificationsService) {
    this.notificationsService = notificationsService;
  }
  async getNotifications(user, page, limit) {
    const result = await this.notificationsService.getUserNotifications(user.id, page, limit);
    return {
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit
      }
    };
  }
  async getUnreadCount(user) {
    return this.notificationsService.getUnreadCount(user.id);
  }
  async markRead(id, user) {
    return this.notificationsService.markRead(user.id, id);
  }
  async markAllRead(user) {
    await this.notificationsService.markAllRead(user.id);
    return true;
  }
};
__decorate([(0, _graphql.Query)(() => _notification.NotificationPage, {
  name: 'myNotifications'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _graphql.Args)('page', {
  type: () => _graphql.Int,
  nullable: true,
  defaultValue: 1
})), __param(2, (0, _graphql.Args)('limit', {
  type: () => _graphql.Int,
  nullable: true,
  defaultValue: 20
})), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Number, Number]), __metadata("design:returntype", Promise)], NotificationsResolver.prototype, "getNotifications", null);
__decorate([(0, _graphql.Query)(() => _graphql.Int, {
  name: 'unreadNotificationCount'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", typeof (_a = typeof Promise !== "undefined" && Promise) === "function" ? _a : Object)], NotificationsResolver.prototype, "getUnreadCount", null);
__decorate([(0, _graphql.Mutation)(() => _notification.Notification, {
  name: 'markNotificationRead'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('id')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", Promise)], NotificationsResolver.prototype, "markRead", null);
__decorate([(0, _graphql.Mutation)(() => Boolean, {
  name: 'markAllNotificationsRead'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", typeof (_b = typeof Promise !== "undefined" && Promise) === "function" ? _b : Object)], NotificationsResolver.prototype, "markAllRead", null);
exports.NotificationsResolver = NotificationsResolver = __decorate([(0, _graphql.Resolver)(() => _notification.Notification), __param(0, (0, _common.Inject)(_notifications.NotificationsService)), __metadata("design:paramtypes", [Object])], NotificationsResolver);