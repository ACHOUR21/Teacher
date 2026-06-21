"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CurrentUser = void 0;
var _common = require("@nestjs/common");
const CurrentUser = exports.CurrentUser = (0, _common.createParamDecorator)((data, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  return data ? user?.[data] : user;
});