"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LocalStrategy = void 0;
var _common = require("@nestjs/common");
var _passport = require("@nestjs/passport");
var _passportLocal = require("passport-local");
var _auth = require("../../auth.service");
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
let LocalStrategy = exports.LocalStrategy = class LocalStrategy extends (0, _passport.PassportStrategy)(_passportLocal.Strategy, 'local') {
  constructor(authService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true
    });
    this.authService = authService;
  }
  async validate(req, email, password) {
    const tenantId = req.tenantId;
    if (!tenantId) {
      throw new _common.UnauthorizedException('Tenant context required');
    }
    const user = await this.authService.validateUser(email, password, tenantId);
    if (!user) {
      throw new _common.UnauthorizedException('Invalid credentials');
    }
    return user;
  }
};
exports.LocalStrategy = LocalStrategy = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_auth.AuthService)), __metadata("design:paramtypes", [Object])], LocalStrategy);