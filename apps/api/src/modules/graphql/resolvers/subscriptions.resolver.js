"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pubSub = exports.SubscriptionsResolver = exports.GQL_EVENTS = void 0;
var _common = require("@nestjs/common");
var _graphql = require("@nestjs/graphql");
var _graphqlSubscriptions = require("graphql-subscriptions");
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
const pubSub = exports.pubSub = new _graphqlSubscriptions.PubSub();
const GQL_EVENTS = exports.GQL_EVENTS = {
  NOTIFICATION_ADDED: 'notificationAdded',
  MESSAGE_RECEIVED: 'messageReceived',
  ASSIGNMENT_GRADED: 'assignmentGraded',
  LIVE_SESSION_STARTED: 'liveSessionStarted'
};
let ChatMessage = class ChatMessage {
  id;
  content;
  senderName;
  conversationId;
  createdAt;
};
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], ChatMessage.prototype, "id", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], ChatMessage.prototype, "content", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], ChatMessage.prototype, "senderName", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], ChatMessage.prototype, "conversationId", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)], ChatMessage.prototype, "createdAt", void 0);
ChatMessage = __decorate([(0, _graphql.ObjectType)()], ChatMessage);
let LiveSessionEvent = class LiveSessionEvent {
  sessionId;
  title;
  event;
  timestamp;
};
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], LiveSessionEvent.prototype, "sessionId", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], LiveSessionEvent.prototype, "title", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], LiveSessionEvent.prototype, "event", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)], LiveSessionEvent.prototype, "timestamp", void 0);
LiveSessionEvent = __decorate([(0, _graphql.ObjectType)()], LiveSessionEvent);
let AssignmentGradedEvent = class AssignmentGradedEvent {
  submissionId;
  assignmentId;
  score;
  feedback;
};
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], AssignmentGradedEvent.prototype, "submissionId", void 0);
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], AssignmentGradedEvent.prototype, "assignmentId", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", Number)], AssignmentGradedEvent.prototype, "score", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], AssignmentGradedEvent.prototype, "feedback", void 0);
AssignmentGradedEvent = __decorate([(0, _graphql.ObjectType)()], AssignmentGradedEvent);
let SubscriptionsResolver = exports.SubscriptionsResolver = class SubscriptionsResolver {
  notificationAdded() {
    return pubSub.asyncIterator(GQL_EVENTS.NOTIFICATION_ADDED);
  }
  messageReceived(_conversationId) {
    return pubSub.asyncIterator(GQL_EVENTS.MESSAGE_RECEIVED);
  }
  assignmentGraded() {
    return pubSub.asyncIterator(GQL_EVENTS.ASSIGNMENT_GRADED);
  }
  liveSessionStarted() {
    return pubSub.asyncIterator(GQL_EVENTS.LIVE_SESSION_STARTED);
  }
};
__decorate([(0, _graphql.Subscription)(() => _notification.Notification, {
  name: GQL_EVENTS.NOTIFICATION_ADDED,
  description: 'Receive real-time notifications for the authenticated user',
  filter: (payload, _args, context) => {
    return payload.notificationAdded.userId === context.req?.user?.id;
  },
  resolve: payload => payload.notificationAdded
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], SubscriptionsResolver.prototype, "notificationAdded", null);
__decorate([(0, _graphql.Subscription)(() => ChatMessage, {
  name: GQL_EVENTS.MESSAGE_RECEIVED,
  description: 'Receive new messages in a conversation',
  filter: (payload, args) => {
    return payload.messageReceived.conversationId === args.conversationId;
  },
  resolve: payload => payload.messageReceived
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('conversationId', {
  type: () => _graphql.ID
})), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], SubscriptionsResolver.prototype, "messageReceived", null);
__decorate([(0, _graphql.Subscription)(() => AssignmentGradedEvent, {
  name: GQL_EVENTS.ASSIGNMENT_GRADED,
  description: 'Notified when one of your assignment submissions is graded',
  filter: (payload, _args, context) => {
    return payload.assignmentGraded.studentId === context.req?.user?.id;
  },
  resolve: payload => payload.assignmentGraded
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], SubscriptionsResolver.prototype, "assignmentGraded", null);
__decorate([(0, _graphql.Subscription)(() => LiveSessionEvent, {
  name: GQL_EVENTS.LIVE_SESSION_STARTED,
  description: 'Notified when a live session starts for your enrolled courses',
  resolve: payload => payload.liveSessionStarted
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], SubscriptionsResolver.prototype, "liveSessionStarted", null);
exports.SubscriptionsResolver = SubscriptionsResolver = __decorate([(0, _graphql.Resolver)()], SubscriptionsResolver);