"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RequireFeature = exports.FeatureFlagGuard = exports.FEATURE_FLAG_KEY = void 0;
var _common = require("@nestjs/common");
var _core = require("@nestjs/core");
var _featureFlags = require("./feature-flags.service");
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
const FEATURE_FLAG_KEY = exports.FEATURE_FLAG_KEY = 'feature_flag';
const RequireFeature = flag => (0, _common.SetMetadata)(FEATURE_FLAG_KEY, flag);
exports.RequireFeature = RequireFeature;
let FeatureFlagGuard = exports.FeatureFlagGuard = class FeatureFlagGuard {
  constructor(reflector, flags) {
    this.reflector = reflector;
    this.flags = flags;
  }
  async canActivate(context) {
    const flag = this.reflector.getAllAndOverride(FEATURE_FLAG_KEY, [context.getHandler(), context.getClass()]);
    if (!flag) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const enabled = await this.flags.isEnabled(flag, {
      tenantId: request.user?.tenantId,
      userId: request.user?.id
    });
    if (!enabled) {
      throw new _common.ForbiddenException(`Feature '${flag}' is not enabled for your account`);
    }
    return true;
  }
};
exports.FeatureFlagGuard = FeatureFlagGuard = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_core.Reflector)), __param(1, (0, _common.Inject)(_featureFlags.FeatureFlagsService)), __metadata("design:paramtypes", [Object, Object])], FeatureFlagGuard);