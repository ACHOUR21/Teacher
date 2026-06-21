"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SuperAdminResolver = void 0;
var _common = require("@nestjs/common");
var _graphql = require("@nestjs/graphql");
var _client = require("@prisma/client");
var _roles = require("../../core/decorators/roles.decorator");
var _roles2 = require("../../core/guards/roles.guard");
var _superAdmin = require("../../super-admin/super-admin.service");
var _gqlAuth = require("../guards/gql-auth.guard");
var _superAdmin2 = require("../types/super-admin.types");
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
var _a, _b, _c, _d, _e, _f;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */

let UpdateTenantInput = class UpdateTenantInput {
  name;
  plan;
  isActive;
  domain;
};
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], UpdateTenantInput.prototype, "name", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], UpdateTenantInput.prototype, "plan", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", Boolean)], UpdateTenantInput.prototype, "isActive", void 0);
__decorate([(0, _graphql.Field)({
  nullable: true
}), __metadata("design:type", String)], UpdateTenantInput.prototype, "domain", void 0);
UpdateTenantInput = __decorate([(0, _graphql.InputType)()], UpdateTenantInput);
let SuperAdminResolver = exports.SuperAdminResolver = class SuperAdminResolver {
  constructor(superAdminService) {
    this.superAdminService = superAdminService;
  }
  async getPlatformOverview() {
    const data = await this.superAdminService.getPlatformOverview();
    return {
      kpis: {
        totalTenants: data.kpis.totalTenants,
        totalUsers: data.kpis.totalUsers,
        totalCourses: data.kpis.totalCourses,
        totalEnrollments: data.kpis.totalEnrollments,
        totalRevenue: data.kpis.totalRevenue ?? 0,
        activeTenants: data.kpis.activeTenants
      },
      recentTenants: data.recentTenants.map(t => ({
        ...t,
        userCount: t._count?.users ?? 0,
        courseCount: t._count?.courses ?? 0
      }))
    };
  }
  async getTenants(page, limit, search) {
    const result = await this.superAdminService.getTenants(page, limit, search);
    return {
      items: result.items.map(t => ({
        ...t,
        userCount: t._count?.users ?? 0,
        courseCount: t._count?.courses ?? 0
      })),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    };
  }
  async getBillingOverview() {
    const data = await this.superAdminService.getBillingOverview();
    return {
      totalRevenue: data.totalRevenue ?? 0,
      totalInvoices: data.subscriptionStats?.total ?? 0
    };
  }
  async updateTenant(id, input) {
    const result = await this.superAdminService.updateTenantLegacy(id, input, 'system');
    return {
      ...result,
      userCount: 0,
      courseCount: 0
    };
  }
  async deleteTenant(id) {
    await this.superAdminService.deleteTenant(id, 'system');
    return true;
  }
  async impersonateUser(userId) {
    const result = await this.superAdminService.impersonate(userId);
    return result.token;
  }
};
__decorate([(0, _graphql.Query)(() => _superAdmin2.PlatformOverview, {
  name: 'platformOverview',
  description: 'Platform-wide KPIs and recent tenants'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.SUPER_ADMIN), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", typeof (_a = typeof Promise !== "undefined" && Promise) === "function" ? _a : Object)], SuperAdminResolver.prototype, "getPlatformOverview", null);
__decorate([(0, _graphql.Query)(() => _superAdmin2.TenantPage, {
  name: 'tenants',
  description: 'List all tenants (SUPER_ADMIN only)'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.SUPER_ADMIN), __param(0, (0, _graphql.Args)('page', {
  type: () => _graphql.Int,
  nullable: true,
  defaultValue: 1
})), __param(1, (0, _graphql.Args)('limit', {
  type: () => _graphql.Int,
  nullable: true,
  defaultValue: 20
})), __param(2, (0, _graphql.Args)('search', {
  nullable: true
})), __metadata("design:type", Function), __metadata("design:paramtypes", [Number, Number, String]), __metadata("design:returntype", typeof (_b = typeof Promise !== "undefined" && Promise) === "function" ? _b : Object)], SuperAdminResolver.prototype, "getTenants", null);
__decorate([(0, _graphql.Query)(() => _superAdmin2.BillingOverview, {
  name: 'platformBilling',
  description: 'Platform-wide billing overview (SUPER_ADMIN only)'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.SUPER_ADMIN), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)], SuperAdminResolver.prototype, "getBillingOverview", null);
__decorate([(0, _graphql.Mutation)(() => _superAdmin2.TenantSummary, {
  name: 'updateTenant',
  description: 'Update tenant details (SUPER_ADMIN only)'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.SUPER_ADMIN), __param(0, (0, _graphql.Args)('id', {
  type: () => _graphql.ID
})), __param(1, (0, _graphql.Args)('input')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, UpdateTenantInput]), __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)], SuperAdminResolver.prototype, "updateTenant", null);
__decorate([(0, _graphql.Mutation)(() => Boolean, {
  name: 'deleteTenant',
  description: 'Delete a tenant and all its data (SUPER_ADMIN only)'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.SUPER_ADMIN), __param(0, (0, _graphql.Args)('id', {
  type: () => _graphql.ID
})), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)], SuperAdminResolver.prototype, "deleteTenant", null);
__decorate([(0, _graphql.Mutation)(() => String, {
  name: 'impersonateUser',
  description: 'Get impersonation token for a user (SUPER_ADMIN only)'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.SUPER_ADMIN), __param(0, (0, _graphql.Args)('userId', {
  type: () => _graphql.ID
})), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)], SuperAdminResolver.prototype, "impersonateUser", null);
exports.SuperAdminResolver = SuperAdminResolver = __decorate([(0, _graphql.Resolver)(), __param(0, (0, _common.Inject)(_superAdmin.SuperAdminService)), __metadata("design:paramtypes", [Object])], SuperAdminResolver);