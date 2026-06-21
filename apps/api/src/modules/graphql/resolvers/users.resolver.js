"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.UsersResolver = void 0;
var _common = require("@nestjs/common");
var _graphql = require("@nestjs/graphql");
var _currentUser = require("../../core/decorators/current-user.decorator");
var _users = require("../../users/users.service");
var _gqlAuth = require("../guards/gql-auth.guard");
var _user = require("../types/user.types");
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
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */

let UsersResolver = exports.UsersResolver = class UsersResolver {
  constructor(usersService) {
    this.usersService = usersService;
  }
  async getMe(user) {
    return this.usersService.findById(user.id, user.tenantId);
  }
  async getUsers(page, limit, search, role, user) {
    const result = await this.usersService.findAll(user.tenantId, {
      page,
      limit,
      skip: (page - 1) * limit,
      search,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }, role);
    return {
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit
      }
    };
  }
  async getUser(id, user) {
    return this.usersService.findById(id, user.tenantId);
  }
  async assignRole(userId, role, user) {
    return this.usersService.assignRole(userId, user.tenantId, role, {
      role: user.role
    });
  }
  async deactivateUser(id, user) {
    await this.usersService.delete(id, user.tenantId, {
      id: user.id,
      role: user.role
    });
    return true;
  }
};
__decorate([(0, _graphql.Query)(() => _user.User, {
  name: 'me',
  description: 'Get current authenticated user'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", typeof (_a = typeof Promise !== "undefined" && Promise) === "function" ? _a : Object)], UsersResolver.prototype, "getMe", null);
__decorate([(0, _graphql.Query)(() => _user.UserPage, {
  name: 'users',
  description: 'List users in the tenant'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('page', {
  type: () => _graphql.Int,
  nullable: true,
  defaultValue: 1
})), __param(1, (0, _graphql.Args)('limit', {
  type: () => _graphql.Int,
  nullable: true,
  defaultValue: 20
})), __param(2, (0, _graphql.Args)('search', {
  type: () => String,
  nullable: true
})), __param(3, (0, _graphql.Args)('role', {
  type: () => String,
  nullable: true
})), __param(4, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Number, Number, String, String, Object]), __metadata("design:returntype", typeof (_b = typeof Promise !== "undefined" && Promise) === "function" ? _b : Object)], UsersResolver.prototype, "getUsers", null);
__decorate([(0, _graphql.Query)(() => _user.User, {
  name: 'user',
  description: 'Get a user by ID'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('id', {
  type: () => _graphql.ID
})), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)], UsersResolver.prototype, "getUser", null);
__decorate([(0, _graphql.Mutation)(() => _user.User, {
  name: 'assignRole',
  description: 'Assign a role to a user (ADMIN+)'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('userId', {
  type: () => _graphql.ID
})), __param(1, (0, _graphql.Args)('role')), __param(2, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, Object]), __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)], UsersResolver.prototype, "assignRole", null);
__decorate([(0, _graphql.Mutation)(() => Boolean, {
  name: 'deactivateUser',
  description: 'Deactivate a user account'
}), (0, _common.UseGuards)(_gqlAuth.GqlAuthGuard), __param(0, (0, _graphql.Args)('id', {
  type: () => _graphql.ID
})), __param(1, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)], UsersResolver.prototype, "deactivateUser", null);
exports.UsersResolver = UsersResolver = __decorate([(0, _graphql.Resolver)(() => _user.User), __param(0, (0, _common.Inject)(_users.UsersService)), __metadata("design:paramtypes", [Object])], UsersResolver);