"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JwtAuthGuard = void 0;
var _common = require("@nestjs/common");
var _core = require("@nestjs/core");
var _passport = require("@nestjs/passport");
var _public = require("../decorators/public.decorator");
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
let JwtAuthGuard = exports.JwtAuthGuard = class JwtAuthGuard extends (0, _passport.AuthGuard)('jwt') {
  constructor(reflector) {
    super();
    this.reflector = reflector;
  }
  canActivate(context) {
    const isPublic = this.reflector.getAllAndOverride(_public.IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
  handleRequest(err, user, _info) {
    if (err || !user) {
      throw err || new _common.UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
};
exports.JwtAuthGuard = JwtAuthGuard = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_core.Reflector)), __metadata("design:paramtypes", [Object])], JwtAuthGuard);