"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NotificationsGateway = void 0;
var _common = require("@nestjs/common");
var _jwt = require("@nestjs/jwt");
var _websockets = require("@nestjs/websockets");
var _socket = require("socket.io");
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
var NotificationsGateway_1;
var _a, _b;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

let NotificationsGateway = exports.NotificationsGateway = NotificationsGateway_1 = class NotificationsGateway {
  server;
  logger = new _common.Logger(NotificationsGateway_1.name);
  constructor(jwtService) {
    this.jwtService = jwtService;
  }
  async handleConnection(client) {
    try {
      const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token, {
        secret: process.env['JWT_SECRET'] ?? 'secret'
      });
      const userId = payload.id ?? payload.sub;
      if (!userId) {
        client.disconnect();
        return;
      }
      client.data['userId'] = userId;
      // Each user has a personal room for targeted delivery
      await client.join(`user:${userId}`);
      this.logger.debug(`Client connected: ${userId}`);
    } catch {
      client.disconnect();
    }
  }
  handleDisconnect(client) {
    this.logger.debug(`Client disconnected: ${client.data?.['userId']}`);
  }
  async handleSubscribe(client) {
    const userId = client.data?.['userId'];
    if (userId) {
      await client.join(`user:${userId}`);
    }
  }
  /** Emit a real-time notification to a specific user across all their sessions. */
  sendToUser(userId, payload) {
    this.server.to(`user:${userId}`).emit('notification', payload);
  }
  /** Emit the current unread count to a specific user so the bell badge stays accurate. */
  sendUnreadCount(userId, count) {
    this.server.to(`user:${userId}`).emit('unread_count', count);
  }
};
__decorate([(0, _websockets.WebSocketServer)(), __metadata("design:type", typeof (_a = typeof _socket.Server !== "undefined" && _socket.Server) === "function" ? _a : Object)], NotificationsGateway.prototype, "server", void 0);
__decorate([(0, _websockets.SubscribeMessage)('subscribe'), __param(0, (0, _websockets.ConnectedSocket)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_b = typeof _socket.Socket !== "undefined" && _socket.Socket) === "function" ? _b : Object]), __metadata("design:returntype", Promise)], NotificationsGateway.prototype, "handleSubscribe", null);
exports.NotificationsGateway = NotificationsGateway = NotificationsGateway_1 = __decorate([(0, _websockets.WebSocketGateway)({
  cors: {
    origin: process.env['ALLOWED_ORIGINS']?.split(',') ?? '*',
    credentials: true
  },
  namespace: '/'
}), __param(0, (0, _common.Inject)(_jwt.JwtService)), __metadata("design:paramtypes", [Object])], NotificationsGateway);