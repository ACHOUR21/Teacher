"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TenantGuard = void 0;
var _common = require("@nestjs/common");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let TenantGuard = exports.TenantGuard = class TenantGuard {
  canActivate(context) {
    const request = context.switchToHttp().getRequest();
    if (!request.tenantId) {
      throw new _common.ForbiddenException('Tenant context is required');
    }
    if (request.tenant && !request.tenant.isActive) {
      throw new _common.ForbiddenException('Tenant account is inactive');
    }
    return true;
  }
};
exports.TenantGuard = TenantGuard = __decorate([(0, _common.Injectable)()], TenantGuard);