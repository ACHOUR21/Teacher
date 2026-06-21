"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TenantId = exports.TenantContext = void 0;
var _common = require("@nestjs/common");
const TenantId = exports.TenantId = (0, _common.createParamDecorator)((_data, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  return request.tenantId;
});
const TenantContext = exports.TenantContext = (0, _common.createParamDecorator)((_data, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  return request.tenant;
});