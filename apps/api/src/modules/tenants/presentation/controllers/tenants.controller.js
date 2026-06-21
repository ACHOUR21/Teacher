"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TenantsController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _classValidator = require("class-validator");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _roles = require("../../../core/decorators/roles.decorator");
var _tenant = require("../../../core/decorators/tenant.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _roles2 = require("../../../core/guards/roles.guard");
var _pagination = require("../../../core/pagination/pagination.dto");
var _tenants = require("../../tenants.service");
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
var _a, _b, _c, _d, _e;
class UpdateSettingsDto {
  settings;
}
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), __metadata("design:type", typeof (_a = typeof Record !== "undefined" && Record) === "function" ? _a : Object)], UpdateSettingsDto.prototype, "settings", void 0);
class UpdateOnboardingDto {
  completedSteps;
  completed;
}
__decorate([(0, _classValidator.IsArray)(), __metadata("design:type", Array)], UpdateOnboardingDto.prototype, "completedSteps", void 0);
__decorate([(0, _classValidator.IsBoolean)(), __metadata("design:type", Boolean)], UpdateOnboardingDto.prototype, "completed", void 0);
class UpdateTenantProfileDto {
  name;
  logoUrl;
  description;
  website;
}
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], UpdateTenantProfileDto.prototype, "name", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], UpdateTenantProfileDto.prototype, "logoUrl", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], UpdateTenantProfileDto.prototype, "description", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], UpdateTenantProfileDto.prototype, "website", void 0);
let TenantsController = exports.TenantsController = class TenantsController {
  constructor(tenantsService) {
    this.tenantsService = tenantsService;
  }
  findAll(pagination) {
    return this.tenantsService.findAll(pagination);
  }
  findById(id) {
    return this.tenantsService.findById(id);
  }
  getCurrentTenant(tenantId) {
    return this.tenantsService.findById(tenantId);
  }
  getStats(tenantId) {
    return this.tenantsService.getStats(tenantId);
  }
  create(dto) {
    return this.tenantsService.create(dto);
  }
  update(id, dto) {
    return this.tenantsService.update(id, dto);
  }
  updateSettings(tenantId, dto) {
    return this.tenantsService.updateSettings(tenantId, dto.settings);
  }
  getOnboarding(tenantId) {
    return this.tenantsService.getOnboardingStatus(tenantId);
  }
  updateOnboarding(tenantId, dto) {
    return this.tenantsService.updateOnboarding(tenantId, dto.completedSteps, dto.completed);
  }
  updateProfile(tenantId, dto) {
    return this.tenantsService.updateTenantProfile(tenantId, dto);
  }
  delete(id, user) {
    return this.tenantsService.delete(id, user.id);
  }
};
__decorate([(0, _common.Get)(), (0, _roles.Roles)(_client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'List all tenants (Super Admin only)'
}), __param(0, (0, _common.Query)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_b = typeof _pagination.PaginationDto !== "undefined" && _pagination.PaginationDto) === "function" ? _b : Object]), __metadata("design:returntype", void 0)], TenantsController.prototype, "findAll", null);
__decorate([(0, _common.Get)(':id'), (0, _roles.Roles)(_client.UserRole.SUPER_ADMIN, _client.UserRole.ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Get tenant by ID'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], TenantsController.prototype, "findById", null);
__decorate([(0, _common.Get)('me/details'), (0, _swagger.ApiOperation)({
  summary: 'Get current tenant details'
}), __param(0, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], TenantsController.prototype, "getCurrentTenant", null);
__decorate([(0, _common.Get)('me/stats'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.UNIVERSITY_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Get current tenant statistics'
}), __param(0, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], TenantsController.prototype, "getStats", null);
__decorate([(0, _common.Post)(), (0, _roles.Roles)(_client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Create new tenant (Super Admin only)'
}), __param(0, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_c = typeof _tenants.CreateTenantDto !== "undefined" && _tenants.CreateTenantDto) === "function" ? _c : Object]), __metadata("design:returntype", void 0)], TenantsController.prototype, "create", null);
__decorate([(0, _common.Put)(':id'), (0, _roles.Roles)(_client.UserRole.SUPER_ADMIN, _client.UserRole.ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Update tenant'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_d = typeof _tenants.UpdateTenantDto !== "undefined" && _tenants.UpdateTenantDto) === "function" ? _d : Object]), __metadata("design:returntype", void 0)], TenantsController.prototype, "update", null);
__decorate([(0, _common.Put)('me/settings'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.UNIVERSITY_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Update current tenant settings'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, UpdateSettingsDto]), __metadata("design:returntype", void 0)], TenantsController.prototype, "updateSettings", null);
__decorate([(0, _common.Get)('me/onboarding'), (0, _swagger.ApiOperation)({
  summary: 'Get onboarding status for current tenant'
}), __param(0, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], TenantsController.prototype, "getOnboarding", null);
__decorate([(0, _common.Patch)('me/onboarding'), (0, _swagger.ApiOperation)({
  summary: 'Update onboarding progress'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, UpdateOnboardingDto]), __metadata("design:returntype", void 0)], TenantsController.prototype, "updateOnboarding", null);
__decorate([(0, _common.Patch)('me/profile'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.UNIVERSITY_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Update tenant profile (logo, description, website)'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, UpdateTenantProfileDto]), __metadata("design:returntype", void 0)], TenantsController.prototype, "updateProfile", null);
__decorate([(0, _common.Delete)(':id'), (0, _roles.Roles)(_client.UserRole.SUPER_ADMIN), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Delete tenant (Super Admin only)'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_e = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _e : Object]), __metadata("design:returntype", void 0)], TenantsController.prototype, "delete", null);
exports.TenantsController = TenantsController = __decorate([(0, _swagger.ApiTags)('Tenants'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _common.Controller)('tenants'), __param(0, (0, _common.Inject)(_tenants.TenantsService)), __metadata("design:paramtypes", [Object])], TenantsController);