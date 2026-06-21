"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UsersController = void 0;
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
var _users = require("../../users.service");
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
class AssignRoleDto {
  role;
}
__decorate([(0, _swagger.ApiPropertyOptional)({
  enum: _client.UserRole
}), (0, _classValidator.IsEnum)(_client.UserRole), __metadata("design:type", typeof (_a = typeof _client.UserRole !== "undefined" && _client.UserRole) === "function" ? _a : Object)], AssignRoleDto.prototype, "role", void 0);
let UsersController = exports.UsersController = class UsersController {
  constructor(usersService) {
    this.usersService = usersService;
  }
  findAll(tenantId, pagination, roleFilter) {
    return this.usersService.findAll(tenantId, pagination, roleFilter);
  }
  getMe(user, tenantId) {
    return this.usersService.findById(user.id, tenantId);
  }
  updateMe(user, tenantId, dto) {
    return this.usersService.updateMe(user.id, tenantId, dto);
  }
  getMyDevices(user) {
    return this.usersService.getUserDevices(user.id);
  }
  revokeDevice(user, deviceId) {
    return this.usersService.revokeDevice(user.id, deviceId);
  }
  getProfile(user, tenantId) {
    return this.usersService.findById(user.id, tenantId);
  }
  exportMyData(user, tenantId) {
    return this.usersService.exportUserData(user.id, tenantId);
  }
  findById(id, tenantId) {
    return this.usersService.findById(id, tenantId);
  }
  update(id, tenantId, dto) {
    return this.usersService.update(id, tenantId, dto);
  }
  partialUpdate(id, tenantId, dto) {
    return this.usersService.update(id, tenantId, dto);
  }
  updateProfile(id, tenantId, dto) {
    return this.usersService.updateProfile(id, tenantId, dto);
  }
  delete(id, tenantId, currentUser) {
    return this.usersService.delete(id, tenantId, currentUser);
  }
  assignRole(id, tenantId, dto, currentUser) {
    return this.usersService.assignRole(id, tenantId, dto.role, currentUser);
  }
  getActivity(id, tenantId) {
    return this.usersService.getUserActivity(id, tenantId);
  }
};
__decorate([(0, _common.Get)(), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.UNIVERSITY_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'List users in current tenant (paginated)'
}), (0, _swagger.ApiQuery)({
  name: 'role',
  enum: _client.UserRole,
  required: false
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Query)()), __param(2, (0, _common.Query)('role')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_b = typeof _pagination.PaginationDto !== "undefined" && _pagination.PaginationDto) === "function" ? _b : Object, typeof (_c = typeof _client.UserRole !== "undefined" && _client.UserRole) === "function" ? _c : Object]), __metadata("design:returntype", void 0)], UsersController.prototype, "findAll", null);
__decorate([(0, _common.Get)('me'), (0, _swagger.ApiOperation)({
  summary: 'Get current user full profile'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_d = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _d : Object, String]), __metadata("design:returntype", void 0)], UsersController.prototype, "getMe", null);
__decorate([(0, _common.Patch)('me'), (0, _swagger.ApiOperation)({
  summary: 'Update current user profile'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _tenant.TenantId)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_e = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _e : Object, String, Object]), __metadata("design:returntype", void 0)], UsersController.prototype, "updateMe", null);
__decorate([(0, _common.Get)('me/devices'), (0, _swagger.ApiOperation)({
  summary: 'List current user devices'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_h = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _h : Object]), __metadata("design:returntype", void 0)], UsersController.prototype, "getMyDevices", null);
__decorate([(0, _common.Delete)('me/devices/:deviceId'), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Revoke a device session'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _common.Param)('deviceId')), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_j = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _j : Object, String]), __metadata("design:returntype", void 0)], UsersController.prototype, "revokeDevice", null);
__decorate([(0, _common.Get)('profile'), (0, _swagger.ApiOperation)({
  summary: 'Get own profile (legacy)'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_k = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _k : Object, String]), __metadata("design:returntype", void 0)], UsersController.prototype, "getProfile", null);
__decorate([(0, _common.Get)('me/export'), (0, _swagger.ApiOperation)({
  summary: 'Export all personal data (GDPR)'
}), __param(0, (0, _currentUser.CurrentUser)()), __param(1, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_l = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _l : Object, String]), __metadata("design:returntype", void 0)], UsersController.prototype, "exportMyData", null);
__decorate([(0, _common.Get)(':id'), (0, _swagger.ApiOperation)({
  summary: 'Get user by ID'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], UsersController.prototype, "findById", null);
__decorate([(0, _common.Put)(':id'), (0, _swagger.ApiOperation)({
  summary: 'Update user details'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _tenant.TenantId)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, typeof (_m = typeof _users.UpdateUserDto !== "undefined" && _users.UpdateUserDto) === "function" ? _m : Object]), __metadata("design:returntype", void 0)], UsersController.prototype, "update", null);
__decorate([(0, _common.Patch)(':id'), (0, _swagger.ApiOperation)({
  summary: 'Partial update user details'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _tenant.TenantId)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, typeof (_o = typeof _users.UpdateUserDto !== "undefined" && _users.UpdateUserDto) === "function" ? _o : Object]), __metadata("design:returntype", void 0)], UsersController.prototype, "partialUpdate", null);
__decorate([(0, _common.Put)(':id/profile'), (0, _swagger.ApiOperation)({
  summary: 'Update user extended profile'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _tenant.TenantId)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, typeof (_p = typeof _users.UpdateUserProfileDto !== "undefined" && _users.UpdateUserProfileDto) === "function" ? _p : Object]), __metadata("design:returntype", void 0)], UsersController.prototype, "updateProfile", null);
__decorate([(0, _common.Delete)(':id'), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Deactivate user'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _tenant.TenantId)()), __param(2, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, typeof (_q = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _q : Object]), __metadata("design:returntype", void 0)], UsersController.prototype, "delete", null);
__decorate([(0, _common.Post)(':id/roles'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Assign role to user'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _tenant.TenantId)()), __param(2, (0, _common.Body)()), __param(3, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, AssignRoleDto, typeof (_r = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _r : Object]), __metadata("design:returntype", void 0)], UsersController.prototype, "assignRole", null);
__decorate([(0, _common.Get)(':id/activity'), (0, _swagger.ApiOperation)({
  summary: 'Get user activity log'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], UsersController.prototype, "getActivity", null);
exports.UsersController = UsersController = __decorate([(0, _swagger.ApiTags)('Users'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _common.Controller)('users'), __param(0, (0, _common.Inject)(_users.UsersService)), __metadata("design:paramtypes", [Object])], UsersController);