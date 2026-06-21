"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MessagingController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
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
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

let MessagingController = exports.MessagingController = class MessagingController {
  constructor(messagingService) {
    this.messagingService = messagingService;
  }
  getConversations(user) {
    return this.messagingService.getConversations(user.id);
  }
  startDirect(user, body) {
    return this.messagingService.createDirectConversation(user.id, body.userId);
  }
  createGroup(body) {
    return this.messagingService.createGroupConversation(body.name, body.participantIds);
  }
  getMessages(id, user, page = 1, limit = 50) {
    return this.messagingService.getMessages(id, user.id, +page, +limit);
  }
  sendMessage(conversationId, user, body) {
    return this.messagingService.sendMessage(conversationId, user.id, body.content, body.type, body.attachments);
  }
};
__decorate([(0, _common.Get)('conversations'), (0, _swagger.ApiOperation)({
  summary: 'Get user conversations'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], MessagingController.prototype, "getConversations", null);
__decorate([(0, _common.Post)('conversations/direct'), (0, _swagger.ApiOperation)({
  summary: 'Start or get direct conversation'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], MessagingController.prototype, "startDirect", null);
__decorate([(0, _common.Post)('conversations/group'), (0, _swagger.ApiOperation)({
  summary: 'Create a group conversation'
}), __param(0, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], MessagingController.prototype, "createGroup", null);
__decorate([(0, _common.Get)('conversations/:id/messages'), (0, _swagger.ApiOperation)({
  summary: 'Get conversation messages'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Query)('page')), __param(3, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object, Object, Object]), __metadata("design:returntype", void 0)], MessagingController.prototype, "getMessages", null);
__decorate([(0, _common.Post)('conversations/:id/messages'), (0, _swagger.ApiOperation)({
  summary: 'Send a message'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object, Object]), __metadata("design:returntype", void 0)], MessagingController.prototype, "sendMessage", null);
exports.MessagingController = MessagingController = __decorate([(0, _swagger.ApiTags)('Messaging'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _common.Controller)('messaging'), __param(0, (0, _common.Inject)(_messaging.MessagingService)), __metadata("design:paramtypes", [Object])], MessagingController);