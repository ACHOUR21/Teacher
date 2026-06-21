"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FeatureFlagsController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _currentUser = require("../core/decorators/current-user.decorator");
var _roles = require("../core/decorators/roles.decorator");
var _tenant = require("../core/decorators/tenant.decorator");
var _jwtAuth = require("../core/guards/jwt-auth.guard");
var _roles2 = require("../core/guards/roles.guard");
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
let FeatureFlagsController = exports.FeatureFlagsController = class FeatureFlagsController {
  constructor(flagsService) {
    this.flagsService = flagsService;
  }
  getAllFlags(tenantId, user) {
    return this.flagsService.getAllFlags({
      tenantId,
      userId: user.id
    });
  }
  async getFlag(flag, tenantId, user) {
    const enabled = await this.flagsService.isEnabled(flag, {
      tenantId,
      userId: user.id
    });
    return {
      flag,
      enabled
    };
  }
  setGlobalFlag(flag, body, user) {
    return this.flagsService.setGlobalFlag(flag, body.enabled, user.id);
  }
  setTenantFlag(flag, body, tenantId, user) {
    return this.flagsService.setTenantFlag(flag, tenantId, body.enabled, user.id);
  }
  resetGlobalFlag(flag) {
    return this.flagsService.resetFlag(flag);
  }
  resetTenantFlag(flag, tenantId) {
    return this.flagsService.resetFlag(flag, tenantId);
  }
};
__decorate([(0, _common.Get)(), (0, _roles.Roles)(_client.UserRole.STUDENT, _client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Get all feature flags for current tenant context'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], FeatureFlagsController.prototype, "getAllFlags", null);
__decorate([(0, _common.Get)(':flag'), (0, _roles.Roles)(_client.UserRole.STUDENT, _client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Check if a specific feature flag is enabled'
}), __param(0, (0, _common.Param)('flag')), __param(1, (0, _tenant.TenantId)()), __param(2, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, Object]), __metadata("design:returntype", Promise)], FeatureFlagsController.prototype, "getFlag", null);
__decorate([(0, _common.Put)('global/:flag'), (0, _roles.Roles)(_client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Set global flag override (super admin)'
}), __param(0, (0, _common.Param)('flag')), __param(1, (0, _common.Body)()), __param(2, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object, Object]), __metadata("design:returntype", void 0)], FeatureFlagsController.prototype, "setGlobalFlag", null);
__decorate([(0, _common.Put)('tenant/:flag'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Set tenant-level flag override (admin)'
}), __param(0, (0, _common.Param)('flag')), __param(1, (0, _common.Body)()), __param(2, (0, _tenant.TenantId)()), __param(3, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object, String, Object]), __metadata("design:returntype", void 0)], FeatureFlagsController.prototype, "setTenantFlag", null);
__decorate([(0, _common.Delete)('global/:flag'), (0, _roles.Roles)(_client.UserRole.SUPER_ADMIN), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Reset global flag to default'
}), __param(0, (0, _common.Param)('flag')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], FeatureFlagsController.prototype, "resetGlobalFlag", null);
__decorate([(0, _common.Delete)('tenant/:flag'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Reset tenant flag to default'
}), __param(0, (0, _common.Param)('flag')), __param(1, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], FeatureFlagsController.prototype, "resetTenantFlag", null);
exports.FeatureFlagsController = FeatureFlagsController = __decorate([(0, _swagger.ApiTags)('Feature Flags'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _common.Controller)('feature-flags'), __param(0, (0, _common.Inject)(_featureFlags.FeatureFlagsService)), __metadata("design:paramtypes", [Object])], FeatureFlagsController);