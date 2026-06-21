"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SuperAdminController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _currentUser = require("../core/decorators/current-user.decorator");
var _roles = require("../core/decorators/roles.decorator");
var _jwtAuth = require("../core/guards/jwt-auth.guard");
var _roles2 = require("../core/guards/roles.guard");
var _superAdmin = require("./super-admin.service");
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
let SuperAdminController = exports.SuperAdminController = class SuperAdminController {
  constructor(superAdminService) {
    this.superAdminService = superAdminService;
  }
  // ─── Platform Overview ──────────────────────────────────────────────────────
  overview() {
    return this.superAdminService.getPlatformOverview();
  }
  systemHealth() {
    return this.superAdminService.getSystemHealth();
  }
  /** Legacy alias kept for backwards compat with existing frontend */
  health() {
    return this.superAdminService.getSystemHealth();
  }
  // ─── Tenants ────────────────────────────────────────────────────────────────
  tenants(page = 1, limit = 50, search, plan, status) {
    return this.superAdminService.getTenants(+page, +limit, search, plan, status);
  }
  tenantDetails(id) {
    return this.superAdminService.getTenantDetails(id);
  }
  updateTenantStatus(id, dto, admin, req) {
    return this.superAdminService.updateTenantStatus(id, dto.isActive, admin.id, req.ip);
  }
  overrideTenantPlan(id, dto, admin, req) {
    return this.superAdminService.overrideTenantPlan(id, dto.plan, admin.id, req.ip);
  }
  /** Legacy PATCH — kept for existing frontend usage */
  updateTenant(id, dto, admin, req) {
    return this.superAdminService.updateTenantLegacy(id, dto, admin.id, req.ip);
  }
  deleteTenant(id, admin, req) {
    return this.superAdminService.deleteTenant(id, admin.id, req.ip);
  }
  impersonateTenantAdmin(tenantId, admin, req) {
    return this.superAdminService.impersonateTenantAdmin(tenantId, admin.id, req.ip);
  }
  // ─── Users ──────────────────────────────────────────────────────────────────
  users(page = 1, limit = 50, search, role, tenantId, status) {
    return this.superAdminService.getUsers(+page, +limit, search, role, tenantId, status);
  }
  changeUserRole(id, dto, admin, req) {
    return this.superAdminService.changeUserRole(id, dto.role, admin.id, req.ip);
  }
  deleteUser(id, admin, req) {
    return this.superAdminService.deleteUser(id, admin.id, req.ip);
  }
  /** Legacy PATCH — kept for existing frontend usage */
  updateUser(id, dto, admin, req) {
    return this.superAdminService.updateUserLegacy(id, dto, admin.id, req.ip);
  }
  // ─── AI Usage ───────────────────────────────────────────────────────────────
  aiUsage(from, to) {
    return this.superAdminService.getAiUsage(from ? new Date(from) : undefined, to ? new Date(to) : undefined);
  }
  // ─── Audit Log ──────────────────────────────────────────────────────────────
  auditLog(page = 1, limit = 50, tenantId, userId, action, from, to) {
    return this.superAdminService.getPlatformAuditLog(+page, +limit, {
      tenantId,
      userId,
      action,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined
    });
  }
  // ─── Billing (legacy endpoint) ──────────────────────────────────────────────
  billing() {
    return this.superAdminService.getBillingOverview();
  }
  // ─── Impersonate (legacy endpoint) ─────────────────────────────────────────
  impersonate(userId, admin, req) {
    return this.superAdminService.impersonateUser(userId, admin.id, req.ip);
  }
};
__decorate([(0, _common.Get)('overview'), (0, _swagger.ApiOperation)({
  summary: 'Platform KPIs: total tenants, users, MRR, AI cost/day, uptime'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "overview", null);
__decorate([(0, _common.Get)('system-health'), (0, _swagger.ApiOperation)({
  summary: 'Service health status (DB, Redis, queues)'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "systemHealth", null);
__decorate([(0, _common.Get)('health'), (0, _swagger.ApiOperation)({
  summary: 'System health check (alias)'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "health", null);
__decorate([(0, _common.Get)('tenants'), (0, _swagger.ApiOperation)({
  summary: 'Paginated tenant list with search, plan filter, status filter'
}), (0, _swagger.ApiQuery)({
  name: 'page',
  required: false,
  type: Number
}), (0, _swagger.ApiQuery)({
  name: 'limit',
  required: false,
  type: Number
}), (0, _swagger.ApiQuery)({
  name: 'search',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'plan',
  required: false,
  enum: _client.SubscriptionPlan
}), (0, _swagger.ApiQuery)({
  name: 'status',
  required: false,
  enum: ['active', 'suspended']
}), __param(0, (0, _common.Query)('page')), __param(1, (0, _common.Query)('limit')), __param(2, (0, _common.Query)('search')), __param(3, (0, _common.Query)('plan')), __param(4, (0, _common.Query)('status')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, String, typeof (_a = typeof _client.SubscriptionPlan !== "undefined" && _client.SubscriptionPlan) === "function" ? _a : Object, String]), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "tenants", null);
__decorate([(0, _common.Get)('tenants/:id'), (0, _swagger.ApiOperation)({
  summary: 'Tenant details: users, subscription, usage, feature flags'
}), __param(0, (0, _common.Param)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "tenantDetails", null);
__decorate([(0, _common.Put)('tenants/:id/status'), (0, _swagger.ApiOperation)({
  summary: 'Activate or suspend a tenant'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Body)()), __param(2, (0, _currentUser.CurrentUser)()), __param(3, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object, typeof (_b = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _b : Object, Object]), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "updateTenantStatus", null);
__decorate([(0, _common.Put)('tenants/:id/plan'), (0, _swagger.ApiOperation)({
  summary: 'Override subscription plan for a tenant'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Body)()), __param(2, (0, _currentUser.CurrentUser)()), __param(3, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object, typeof (_c = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _c : Object, Object]), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "overrideTenantPlan", null);
__decorate([(0, _common.Patch)('tenants/:id'), (0, _swagger.ApiOperation)({
  summary: 'Update tenant plan, status, or details (legacy)'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Body)()), __param(2, (0, _currentUser.CurrentUser)()), __param(3, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object, typeof (_d = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _d : Object, Object]), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "updateTenant", null);
__decorate([(0, _common.Delete)('tenants/:id'), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Delete a tenant and all its data'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_e = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _e : Object, Object]), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "deleteTenant", null);
__decorate([(0, _common.Post)('tenants/:id/impersonate'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Generate short-lived impersonation token for a tenant admin'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_f = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _f : Object, Object]), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "impersonateTenantAdmin", null);
__decorate([(0, _common.Get)('users'), (0, _swagger.ApiOperation)({
  summary: 'Paginated user list across all tenants'
}), (0, _swagger.ApiQuery)({
  name: 'page',
  required: false,
  type: Number
}), (0, _swagger.ApiQuery)({
  name: 'limit',
  required: false,
  type: Number
}), (0, _swagger.ApiQuery)({
  name: 'search',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'role',
  required: false,
  enum: _client.UserRole
}), (0, _swagger.ApiQuery)({
  name: 'tenantId',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'status',
  required: false,
  enum: ['active', 'inactive']
}), __param(0, (0, _common.Query)('page')), __param(1, (0, _common.Query)('limit')), __param(2, (0, _common.Query)('search')), __param(3, (0, _common.Query)('role')), __param(4, (0, _common.Query)('tenantId')), __param(5, (0, _common.Query)('status')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, String, typeof (_g = typeof _client.UserRole !== "undefined" && _client.UserRole) === "function" ? _g : Object, String, String]), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "users", null);
__decorate([(0, _common.Put)('users/:id/role'), (0, _swagger.ApiOperation)({
  summary: 'Change user role'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Body)()), __param(2, (0, _currentUser.CurrentUser)()), __param(3, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object, typeof (_h = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _h : Object, Object]), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "changeUserRole", null);
__decorate([(0, _common.Delete)('users/:id'), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Permanently delete a user (GDPR)'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_j = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _j : Object, Object]), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "deleteUser", null);
__decorate([(0, _common.Patch)('users/:id'), (0, _swagger.ApiOperation)({
  summary: 'Update any user role or active status (legacy)'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Body)()), __param(2, (0, _currentUser.CurrentUser)()), __param(3, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object, typeof (_k = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _k : Object, Object]), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "updateUser", null);
__decorate([(0, _common.Get)('ai-usage'), (0, _swagger.ApiOperation)({
  summary: 'AI usage and cost breakdown by tenant and model'
}), (0, _swagger.ApiQuery)({
  name: 'from',
  required: false,
  description: 'ISO date string'
}), (0, _swagger.ApiQuery)({
  name: 'to',
  required: false,
  description: 'ISO date string'
}), __param(0, (0, _common.Query)('from')), __param(1, (0, _common.Query)('to')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "aiUsage", null);
__decorate([(0, _common.Get)('audit-log'), (0, _swagger.ApiOperation)({
  summary: 'Platform-wide audit log with tenant/user filter'
}), (0, _swagger.ApiQuery)({
  name: 'page',
  required: false,
  type: Number
}), (0, _swagger.ApiQuery)({
  name: 'limit',
  required: false,
  type: Number
}), (0, _swagger.ApiQuery)({
  name: 'tenantId',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'userId',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'action',
  required: false,
  enum: _client.AuditAction
}), (0, _swagger.ApiQuery)({
  name: 'from',
  required: false,
  description: 'ISO date string'
}), (0, _swagger.ApiQuery)({
  name: 'to',
  required: false,
  description: 'ISO date string'
}), __param(0, (0, _common.Query)('page')), __param(1, (0, _common.Query)('limit')), __param(2, (0, _common.Query)('tenantId')), __param(3, (0, _common.Query)('userId')), __param(4, (0, _common.Query)('action')), __param(5, (0, _common.Query)('from')), __param(6, (0, _common.Query)('to')), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object, String, String, typeof (_l = typeof _client.AuditAction !== "undefined" && _client.AuditAction) === "function" ? _l : Object, String, String]), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "auditLog", null);
__decorate([(0, _common.Get)('billing'), (0, _swagger.ApiOperation)({
  summary: 'Platform-wide billing and revenue overview'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "billing", null);
__decorate([(0, _common.Post)('impersonate/:userId'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Generate a short-lived token to impersonate any user (legacy)'
}), __param(0, (0, _common.Param)('userId')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_m = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _m : Object, Object]), __metadata("design:returntype", void 0)], SuperAdminController.prototype, "impersonate", null);
exports.SuperAdminController = SuperAdminController = __decorate([(0, _swagger.ApiTags)('Super Admin'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.SUPER_ADMIN), (0, _common.Controller)('super-admin'), __param(0, (0, _common.Inject)(_superAdmin.SuperAdminService)), __metadata("design:paramtypes", [Object])], SuperAdminController);