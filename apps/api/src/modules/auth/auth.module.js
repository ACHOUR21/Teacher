"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AuthModule = void 0;
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _core = require("@nestjs/core");
var _jwt = require("@nestjs/jwt");
var _passport = require("@nestjs/passport");
var _jwtAuth = require("../core/guards/jwt-auth.guard");
var _plan = require("../core/guards/plan.guard");
var _roles = require("../core/guards/roles.guard");
var _notifications = require("../notifications/notifications.module");
var _tenants = require("../tenants/tenants.module");
var _auth = require("./auth.service");
var _google = require("./infrastructure/strategies/google.strategy");
var _jwtRefresh = require("./infrastructure/strategies/jwt-refresh.strategy");
var _jwt2 = require("./infrastructure/strategies/jwt.strategy");
var _local = require("./infrastructure/strategies/local.strategy");
var _microsoft = require("./infrastructure/strategies/microsoft.strategy");
var _auth2 = require("./presentation/controllers/auth.controller");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let AuthModule = exports.AuthModule = class AuthModule {};
exports.AuthModule = AuthModule = __decorate([(0, _common.Module)({
  imports: [_passport.PassportModule.register({
    defaultStrategy: 'jwt'
  }), _jwt.JwtModule.registerAsync({
    imports: [_config.ConfigModule],
    useFactory: configService => ({
      secret: configService.get('JWT_SECRET'),
      signOptions: {
        expiresIn: configService.get('JWT_EXPIRES_IN', '15m')
      }
    }),
    inject: [_config.ConfigService]
  }), _notifications.NotificationsModule, _tenants.TenantsModule],
  controllers: [_auth2.AuthController],
  providers: [_auth.AuthService, _jwt2.JwtStrategy, _local.LocalStrategy, _jwtRefresh.JwtRefreshStrategy, _google.GoogleStrategy, _microsoft.MicrosoftStrategy, _core.Reflector, {
    provide: _core.APP_GUARD,
    useClass: _jwtAuth.JwtAuthGuard
  }, {
    provide: _core.APP_GUARD,
    useClass: _roles.RolesGuard
  }, {
    provide: _core.APP_GUARD,
    useClass: _plan.PlanGuard
  }],
  exports: [_auth.AuthService]
})], AuthModule);