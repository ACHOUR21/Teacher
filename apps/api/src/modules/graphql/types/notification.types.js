"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NotificationPage = exports.Notification = void 0;
var _graphql = require("@nestjs/graphql");
var _common = require("./common.types");
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
var _a, _b, _c;
let Notification = exports.Notification = class Notification {
  id;
  type;
  title;
  body;
  isRead;
  createdAt;
  readAt;
};
__decorate([(0, _graphql.Field)(() => _graphql.ID), __metadata("design:type", String)], Notification.prototype, "id", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], Notification.prototype, "type", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], Notification.prototype, "title", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", String)], Notification.prototype, "body", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", Boolean)], Notification.prototype, "isRead", void 0);
__decorate([(0, _graphql.Field)(), __metadata("design:type", typeof (_a = typeof Date !== "undefined" && Date) === "function" ? _a : Object)], Notification.prototype, "createdAt", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", typeof (_b = typeof Date !== "undefined" && Date) === "function" ? _b : Object)], Notification.prototype, "readAt", void 0);
exports.Notification = Notification = __decorate([(0, _graphql.ObjectType)()], Notification);
let NotificationPage = exports.NotificationPage = class NotificationPage {
  data;
  meta;
};
__decorate([(0, _graphql.Field)(() => [Notification]), __metadata("design:type", Array)], NotificationPage.prototype, "data", void 0);
__decorate([(0, _graphql.Field)(() => _common.PaginationMeta), __metadata("design:type", typeof (_c = typeof _common.PaginationMeta !== "undefined" && _common.PaginationMeta) === "function" ? _c : Object)], NotificationPage.prototype, "meta", void 0);
exports.NotificationPage = NotificationPage = __decorate([(0, _graphql.ObjectType)()], NotificationPage);