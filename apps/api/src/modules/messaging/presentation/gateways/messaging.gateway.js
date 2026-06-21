"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MessagingGateway = void 0;
var _common = require("@nestjs/common");
var _jwt = require("@nestjs/jwt");
var _websockets = require("@nestjs/websockets");
var _socket = require("socket.io");
var _messaging = require("../../messaging.service");
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
var MessagingGateway_1;
var _a;
/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-floating-promises */

let MessagingGateway = exports.MessagingGateway = MessagingGateway_1 = class MessagingGateway {
  server;
  logger = new _common.Logger(MessagingGateway_1.name);
  constructor(jwtService, messagingService) {
    this.jwtService = jwtService;
    this.messagingService = messagingService;
  }
  async handleConnection(client) {
    try {
      const token = client.handshake.auth?.token ?? client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.join(`user:${client.userId}`);
    } catch {
      client.disconnect();
    }
  }
  handleDisconnect(client) {
    this.logger.log(`Messaging client disconnected: ${client.id}`);
  }
  handleJoin(client, data) {
    client.join(`conv:${data.conversationId}`);
    return {
      success: true
    };
  }
  async handleMessage(client, data) {
    if (!client.userId) {
      return;
    }
    const message = await this.messagingService.sendMessage(data.conversationId, client.userId, data.content, data.type);
    this.server.to(`conv:${data.conversationId}`).emit('new-message', message);
    return message;
  }
  handleTyping(client, data) {
    client.to(`conv:${data.conversationId}`).emit('user-typing', {
      userId: client.userId,
      isTyping: data.isTyping
    });
  }
};
__decorate([(0, _websockets.WebSocketServer)(), __metadata("design:type", typeof (_a = typeof _socket.Server !== "undefined" && _socket.Server) === "function" ? _a : Object)], MessagingGateway.prototype, "server", void 0);
__decorate([(0, _websockets.SubscribeMessage)('join-conversation'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], MessagingGateway.prototype, "handleJoin", null);
__decorate([(0, _websockets.SubscribeMessage)('send-message'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", Promise)], MessagingGateway.prototype, "handleMessage", null);
__decorate([(0, _websockets.SubscribeMessage)('typing'), __param(0, (0, _websockets.ConnectedSocket)()), __param(1, (0, _websockets.MessageBody)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], MessagingGateway.prototype, "handleTyping", null);
exports.MessagingGateway = MessagingGateway = MessagingGateway_1 = __decorate([(0, _websockets.WebSocketGateway)({
  cors: {
    origin: '*'
  },
  namespace: '/messaging'
}), __param(0, (0, _common.Inject)(_jwt.JwtService)), __param(1, (0, _common.Inject)(_messaging.MessagingService)), __metadata("design:paramtypes", [Object, Object])], MessagingGateway);