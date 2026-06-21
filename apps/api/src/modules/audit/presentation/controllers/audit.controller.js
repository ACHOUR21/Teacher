"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AuditController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _express = require("express");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _roles = require("../../../core/decorators/roles.decorator");
var _tenant = require("../../../core/decorators/tenant.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _roles2 = require("../../../core/guards/roles.guard");
var _audit = require("../../audit.service");
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
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

let AuditController = exports.AuditController = class AuditController {
  constructor(auditService) {
    this.auditService = auditService;
  }
  query(tenantId, userId, action, resource, from, to, page, limit) {
    return this.auditService.query(tenantId, {
      userId,
      action,
      resource,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined
    });
  }
  export(tenantId, userId, action, resource, from, to) {
    return this.auditService.query(tenantId, {
      userId,
      action,
      resource,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: 1,
      limit: 1000
    });
  }
  async exportCsv(res, user, startDate, endDate, action) {
    const result = await this.auditService.query(user.tenantId, {
      from: startDate ? new Date(startDate) : undefined,
      to: endDate ? new Date(endDate) : undefined,
      action,
      limit: 10000
    });
    const header = 'Timestamp,User,Action,Resource,Resource ID,IP Address,Details\n';
    const rows = result.data.map(log => [new Date(log.createdAt).toISOString(), log.userId || '', log.action || '', log.resource || '', log.resourceId || '', log.ipAddress || '', JSON.stringify(log.details || {}).replace(/"/g, '""')].map(v => `"${v}"`).join(','));
    res.send(header + rows.join('\n'));
  }
};
__decorate([(0, _common.Get)('logs'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.SCHOOL_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Query audit logs'
}), (0, _swagger.ApiQuery)({
  name: 'userId',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'action',
  required: false,
  enum: _client.AuditAction
}), (0, _swagger.ApiQuery)({
  name: 'resource',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'from',
  required: false,
  description: 'ISO date string'
}), (0, _swagger.ApiQuery)({
  name: 'to',
  required: false,
  description: 'ISO date string'
}), (0, _swagger.ApiQuery)({
  name: 'page',
  required: false,
  type: Number
}), (0, _swagger.ApiQuery)({
  name: 'limit',
  required: false,
  type: Number
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Query)('userId')), __param(2, (0, _common.Query)('action')), __param(3, (0, _common.Query)('resource')), __param(4, (0, _common.Query)('from')), __param(5, (0, _common.Query)('to')), __param(6, (0, _common.Query)('page')), __param(7, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, typeof (_a = typeof _client.AuditAction !== "undefined" && _client.AuditAction) === "function" ? _a : Object, String, String, String, String, String]), __metadata("design:returntype", void 0)], AuditController.prototype, "query", null);
__decorate([(0, _common.Get)('logs/export'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Export audit logs (up to 1000 records for CSV)'
}), (0, _swagger.ApiQuery)({
  name: 'userId',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'action',
  required: false,
  enum: _client.AuditAction
}), (0, _swagger.ApiQuery)({
  name: 'resource',
  required: false
}), (0, _swagger.ApiQuery)({
  name: 'from',
  required: false,
  description: 'ISO date string'
}), (0, _swagger.ApiQuery)({
  name: 'to',
  required: false,
  description: 'ISO date string'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Query)('userId')), __param(2, (0, _common.Query)('action')), __param(3, (0, _common.Query)('resource')), __param(4, (0, _common.Query)('from')), __param(5, (0, _common.Query)('to')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String, typeof (_b = typeof _client.AuditAction !== "undefined" && _client.AuditAction) === "function" ? _b : Object, String, String, String]), __metadata("design:returntype", void 0)], AuditController.prototype, "export", null);
__decorate([(0, _common.Get)('export/csv'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Export audit logs as CSV'
}), (0, _swagger.ApiQuery)({
  name: 'startDate',
  required: false,
  description: 'ISO date string'
}), (0, _swagger.ApiQuery)({
  name: 'endDate',
  required: false,
  description: 'ISO date string'
}), (0, _swagger.ApiQuery)({
  name: 'action',
  required: false,
  enum: _client.AuditAction
}), (0, _common.Header)('Content-Type', 'text/csv'), (0, _common.Header)('Content-Disposition', 'attachment; filename="audit-logs.csv"'), __param(0, (0, _common.Res)()), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Query)('startDate')), __param(3, (0, _common.Query)('endDate')), __param(4, (0, _common.Query)('action')), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_c = typeof _express.Response !== "undefined" && _express.Response) === "function" ? _c : Object, typeof (_d = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _d : Object, String, String, typeof (_e = typeof _client.AuditAction !== "undefined" && _client.AuditAction) === "function" ? _e : Object]), __metadata("design:returntype", Promise)], AuditController.prototype, "exportCsv", null);
exports.AuditController = AuditController = __decorate([(0, _swagger.ApiTags)('Audit'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _common.Controller)('audit'), __param(0, (0, _common.Inject)(_audit.AuditService)), __metadata("design:paramtypes", [Object])], AuditController);