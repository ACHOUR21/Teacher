"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ApiEcosystemController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _classValidator = require("class-validator");
var _roles = require("../../../core/decorators/roles.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _roles2 = require("../../../core/guards/roles.guard");
var _apiEcosystem = require("../../api-ecosystem.service");
var _apiKeys = require("../../api-keys.service");
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
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

// ─── DTOs ─────────────────────────────────────────────────────────────────────
class CreateApiKeyBodyDto {
  name;
  scopes;
  rateLimit;
  expiresInDays;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], CreateApiKeyBodyDto.prototype, "name", void 0);
__decorate([(0, _classValidator.IsArray)(), (0, _classValidator.IsString)({
  each: true
}), __metadata("design:type", Array)], CreateApiKeyBodyDto.prototype, "scopes", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsInt)(), (0, _classValidator.Min)(100), __metadata("design:type", Number)], CreateApiKeyBodyDto.prototype, "rateLimit", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsNumber)(), __metadata("design:type", Number)], CreateApiKeyBodyDto.prototype, "expiresInDays", void 0);
class LegacyCreateApiKeyDto {
  name;
  scopes;
  rateLimit;
  expiresAt;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], LegacyCreateApiKeyDto.prototype, "name", void 0);
__decorate([(0, _classValidator.IsArray)(), (0, _classValidator.IsString)({
  each: true
}), __metadata("design:type", Array)], LegacyCreateApiKeyDto.prototype, "scopes", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsInt)(), (0, _classValidator.Min)(100), __metadata("design:type", Number)], LegacyCreateApiKeyDto.prototype, "rateLimit", void 0);
__decorate([(0, _classValidator.IsOptional)(), (0, _classValidator.IsDateString)(), __metadata("design:type", String)], LegacyCreateApiKeyDto.prototype, "expiresAt", void 0);
class CreateWebhookDto {
  url;
  events;
}
__decorate([(0, _classValidator.IsString)(), __metadata("design:type", String)], CreateWebhookDto.prototype, "url", void 0);
__decorate([(0, _classValidator.IsArray)(), (0, _classValidator.IsString)({
  each: true
}), __metadata("design:type", Array)], CreateWebhookDto.prototype, "events", void 0);
class ToggleApiKeyDto {
  isActive;
}
__decorate([(0, _classValidator.IsBoolean)(), __metadata("design:type", Boolean)], ToggleApiKeyDto.prototype, "isActive", void 0);
// ─── Controller ───────────────────────────────────────────────────────────────
let ApiEcosystemController = exports.ApiEcosystemController = class ApiEcosystemController {
  constructor(apiEcosystemService, apiKeysService) {
    this.apiEcosystemService = apiEcosystemService;
    this.apiKeysService = apiKeysService;
  }
  // ── Usage Stats ──────────────────────────────────────────────────────────────
  getStats(req) {
    return this.apiEcosystemService.getUsageStats(req.tenant?.id);
  }
  // ── Legacy tenant-scoped key routes ─────────────────────────────────────────
  listKeys(req) {
    return this.apiEcosystemService.listApiKeys(req.tenant?.id);
  }
  createKey(req, dto) {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    return this.apiEcosystemService.createApiKey(req.tenant?.id, dto.name, dto.scopes, dto.rateLimit, expiresAt);
  }
  revokeKey(id, req) {
    return this.apiEcosystemService.revokeApiKey(id, req.tenant?.id);
  }
  toggleKey(id, req, dto) {
    return this.apiEcosystemService.toggleApiKey(id, req.tenant?.id, dto.isActive);
  }
  // ── User-scoped API key routes (/api-keys) ───────────────────────────────────
  async createUserApiKey(req, dto) {
    const userId = req.user?.id ?? req.user?.sub;
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    return this.apiKeysService.createApiKey(userId, tenantId, dto);
  }
  listUserApiKeys(req) {
    const userId = req.user?.id ?? req.user?.sub;
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    return this.apiKeysService.listApiKeys(userId, tenantId);
  }
  async revokeUserApiKey(id, req) {
    const userId = req.user?.id ?? req.user?.sub;
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    await this.apiKeysService.revokeApiKey(userId, tenantId, id);
  }
  getUserApiKeyUsage(req) {
    const userId = req.user?.id ?? req.user?.sub;
    const tenantId = req.tenant?.id ?? req.user?.tenantId;
    return this.apiKeysService.getUsageStats(userId, tenantId);
  }
  // ── Webhooks ─────────────────────────────────────────────────────────────────
  listWebhooks(req) {
    return this.apiEcosystemService.listWebhooks(req.tenant?.id);
  }
  createWebhook(req, dto) {
    return this.apiEcosystemService.createWebhook(req.tenant?.id, dto.url, dto.events);
  }
  deleteWebhook(id, req) {
    return this.apiEcosystemService.deleteWebhook(id, req.tenant?.id);
  }
};
__decorate([(0, _common.Get)('stats'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN, _client.UserRole.SCHOOL_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Get API ecosystem usage statistics'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], ApiEcosystemController.prototype, "getStats", null);
__decorate([(0, _common.Get)('keys'), (0, _swagger.ApiOperation)({
  summary: 'List API keys (tenant scope)'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], ApiEcosystemController.prototype, "listKeys", null);
__decorate([(0, _common.Post)('keys'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Create API key (legacy tenant scope)'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, LegacyCreateApiKeyDto]), __metadata("design:returntype", void 0)], ApiEcosystemController.prototype, "createKey", null);
__decorate([(0, _common.Delete)('keys/:id'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Revoke API key (legacy)'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], ApiEcosystemController.prototype, "revokeKey", null);
__decorate([(0, _common.Patch)('keys/:id/toggle'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Enable or disable an API key'
}), (0, _swagger.ApiBody)({
  type: ToggleApiKeyDto
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Request)()), __param(2, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object, ToggleApiKeyDto]), __metadata("design:returntype", void 0)], ApiEcosystemController.prototype, "toggleKey", null);
__decorate([(0, _common.Post)('api-keys'), (0, _swagger.ApiOperation)({
  summary: 'Create API key for the authenticated user'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, CreateApiKeyBodyDto]), __metadata("design:returntype", Promise)], ApiEcosystemController.prototype, "createUserApiKey", null);
__decorate([(0, _common.Get)('api-keys'), (0, _swagger.ApiOperation)({
  summary: 'List API keys for the authenticated user'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], ApiEcosystemController.prototype, "listUserApiKeys", null);
__decorate([(0, _common.Delete)('api-keys/:id'), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Revoke a user API key'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", Promise)], ApiEcosystemController.prototype, "revokeUserApiKey", null);
__decorate([(0, _common.Get)('api-keys/usage'), (0, _swagger.ApiOperation)({
  summary: 'Get per-key usage stats for the authenticated user'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], ApiEcosystemController.prototype, "getUserApiKeyUsage", null);
__decorate([(0, _common.Get)('webhooks'), (0, _swagger.ApiOperation)({
  summary: 'List webhook endpoints'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], ApiEcosystemController.prototype, "listWebhooks", null);
__decorate([(0, _common.Post)('webhooks'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Create webhook endpoint'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, CreateWebhookDto]), __metadata("design:returntype", void 0)], ApiEcosystemController.prototype, "createWebhook", null);
__decorate([(0, _common.Delete)('webhooks/:id'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Disable (soft-delete) a webhook endpoint'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], ApiEcosystemController.prototype, "deleteWebhook", null);
exports.ApiEcosystemController = ApiEcosystemController = __decorate([(0, _swagger.ApiTags)('API Ecosystem'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _common.Controller)('api-ecosystem'), __param(0, (0, _common.Inject)(_apiEcosystem.ApiEcosystemService)), __param(1, (0, _common.Inject)(_apiKeys.ApiKeysService)), __metadata("design:paramtypes", [Object, Object])], ApiEcosystemController);