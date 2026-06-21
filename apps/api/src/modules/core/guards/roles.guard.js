"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RolesGuard = void 0;
var _common = require("@nestjs/common");
var _core = require("@nestjs/core");
var _client = require("@prisma/client");
var _roles = require("../decorators/roles.decorator");
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
let RolesGuard = exports.RolesGuard = class RolesGuard {
  constructor(reflector) {
    this.reflector = reflector;
  }
  canActivate(context) {
    const requiredRoles = this.reflector.getAllAndOverride(_roles.ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const {
      user
    } = context.switchToHttp().getRequest();
    if (!user) {
      throw new _common.ForbiddenException('No user context');
    }
    // SUPER_ADMIN bypasses all role checks
    if (user.role === _client.UserRole.SUPER_ADMIN) {
      return true;
    }
    if (!requiredRoles.includes(user.role)) {
      throw new _common.ForbiddenException(`Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`);
    }
    return true;
  }
};
exports.RolesGuard = RolesGuard = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_core.Reflector)), __metadata("design:paramtypes", [Object])], RolesGuard);