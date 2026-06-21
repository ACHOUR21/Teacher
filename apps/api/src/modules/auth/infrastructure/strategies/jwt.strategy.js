"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.JwtStrategy = void 0;
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _passport = require("@nestjs/passport");
var _passportJwt = require("passport-jwt");
var _prisma = require("../../../database/prisma.service");
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
let JwtStrategy = exports.JwtStrategy = class JwtStrategy extends (0, _passport.PassportStrategy)(_passportJwt.Strategy, 'jwt') {
  constructor(configService, prisma) {
    super({
      jwtFromRequest: _passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET')
    });
    this.configService = configService;
    this.prisma = prisma;
  }
  async validate(payload) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub
      },
      select: {
        id: true,
        isActive: true,
        tenantId: true
      }
    });
    if (!user || !user.isActive) {
      throw new _common.UnauthorizedException('User not found or inactive');
    }
    return {
      ...payload,
      id: payload.sub
    };
  }
};
exports.JwtStrategy = JwtStrategy = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_config.ConfigService)), __param(1, (0, _common.Inject)(_prisma.PrismaService)), __metadata("design:paramtypes", [Object, Object])], JwtStrategy);