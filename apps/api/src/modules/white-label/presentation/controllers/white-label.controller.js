"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WhiteLabelController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _express = require("express");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _public = require("../../../core/decorators/public.decorator");
var _roles = require("../../../core/decorators/roles.decorator");
var _tenant = require("../../../core/decorators/tenant.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _roles2 = require("../../../core/guards/roles.guard");
var _customDomain = require("../../dto/custom-domain.dto");
var _updateBranding = require("../../dto/update-branding.dto");
var _whiteLabel = require("../../white-label.service");
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
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access */

let WhiteLabelController = exports.WhiteLabelController = class WhiteLabelController {
  constructor(whiteLabelService) {
    this.whiteLabelService = whiteLabelService;
  }
  // ─── Branding ───────────────────────────────────────────────────────────────
  getBranding(tenantId) {
    return this.whiteLabelService.getBranding(tenantId);
  }
  updateBranding(tenantId, dto) {
    return this.whiteLabelService.updateBranding(tenantId, dto);
  }
  async getBrandingCss(tenantId, res) {
    const branding = await this.whiteLabelService.getBranding(tenantId);
    const css = this.whiteLabelService.generateCssVariables(branding);
    const customCss = branding.customCss ? `\n\n/* Custom CSS */\n${branding.customCss}` : '';
    res.setHeader('Content-Type', 'text/css');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(`${css}${customCss}`);
  }
  // ─── Custom Domain ──────────────────────────────────────────────────────────
  validateDomain(tenantId, dto) {
    return this.whiteLabelService.validateCustomDomain(tenantId, dto.domain);
  }
  async registerDomain(tenantId, dto) {
    await this.whiteLabelService.registerCustomDomain(tenantId, dto.domain);
  }
  // ─── Legacy endpoints (kept for backward compatibility) ─────────────────────
  getSettings(req) {
    return this.whiteLabelService.getSettings(req.tenant?.id ?? req.tenantId);
  }
  updateSettings(req, body) {
    return this.whiteLabelService.upsertSettings(req.tenant?.id ?? req.tenantId, body);
  }
  async getThemeCSS(req) {
    const css = await this.whiteLabelService.generateThemeCSS(req.tenant?.id ?? req.tenantId);
    return css;
  }
  getByDomain(domain) {
    return this.whiteLabelService.getByDomain(domain);
  }
  // ─── Additional endpoints ───────────────────────────────────────────────────
  getCustomDomain(tenantId) {
    return this.whiteLabelService.getCustomDomain(tenantId);
  }
  resetToDefaults(tenantId) {
    return this.whiteLabelService.resetToDefaults(tenantId);
  }
  exportBrandingConfig(tenantId) {
    return this.whiteLabelService.exportBrandingConfig(tenantId);
  }
  importBrandingConfig(tenantId, body) {
    return this.whiteLabelService.importBrandingConfig(tenantId, body);
  }
  // ─── Phase-7a endpoints ──────────────────────────────────────────────────
  getConfig(tenantId) {
    return this.whiteLabelService.getConfig(tenantId);
  }
  patchBranding(tenantId, body) {
    return this.whiteLabelService.updateBrandingV2(tenantId, body);
  }
  async patchDomain(tenantId, domain) {
    await this.whiteLabelService.updateCustomDomainV2(tenantId, domain);
  }
  getPublicBranding(tenantId) {
    return this.whiteLabelService.getPublicBranding(tenantId);
  }
  async getCssByTenant(tenantId, res) {
    const config = await this.whiteLabelService.getConfig(tenantId);
    const css = this.whiteLabelService.generateCssVariablesV2(config);
    res.setHeader('Content-Type', 'application/css');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(css);
  }
};
__decorate([(0, _common.Get)('branding'), (0, _public.Public)(), (0, _swagger.ApiOperation)({
  summary: 'Get resolved branding for the current tenant (with defaults fallback)'
}), (0, _swagger.ApiResponse)({
  status: 200,
  description: 'TenantBranding object'
}), __param(0, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], WhiteLabelController.prototype, "getBranding", null);
__decorate([(0, _common.Put)('branding'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.UNIVERSITY_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Update branding settings for the current tenant'
}), (0, _swagger.ApiResponse)({
  status: 200,
  description: 'Updated TenantBranding object'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_a = typeof _updateBranding.UpdateBrandingDto !== "undefined" && _updateBranding.UpdateBrandingDto) === "function" ? _a : Object]), __metadata("design:returntype", void 0)], WhiteLabelController.prototype, "updateBranding", null);
__decorate([(0, _common.Get)('branding/css'), (0, _public.Public)(), (0, _swagger.ApiOperation)({
  summary: 'Returns a text/css stylesheet with CSS custom properties for the tenant brand'
}), (0, _swagger.ApiResponse)({
  status: 200,
  description: 'CSS string',
  content: {
    'text/css': {}
  }
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Res)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_b = typeof _express.Response !== "undefined" && _express.Response) === "function" ? _b : Object]), __metadata("design:returntype", Promise)], WhiteLabelController.prototype, "getBrandingCss", null);
__decorate([(0, _common.Post)('domain/validate'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.UNIVERSITY_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Check DNS TXT record to validate custom domain ownership'
}), (0, _swagger.ApiResponse)({
  status: 200,
  description: '{ valid: boolean; txtRecord: string }'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_c = typeof _customDomain.CustomDomainDto !== "undefined" && _customDomain.CustomDomainDto) === "function" ? _c : Object]), __metadata("design:returntype", void 0)], WhiteLabelController.prototype, "validateDomain", null);
__decorate([(0, _common.Post)('domain/register'), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.UNIVERSITY_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Register a custom domain and trigger cert provisioning (pending DNS verification)'
}), (0, _swagger.ApiResponse)({
  status: 204,
  description: 'Domain registered successfully'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_d = typeof _customDomain.CustomDomainDto !== "undefined" && _customDomain.CustomDomainDto) === "function" ? _d : Object]), __metadata("design:returntype", Promise)], WhiteLabelController.prototype, "registerDomain", null);
__decorate([(0, _common.Get)('settings'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _swagger.ApiOperation)({
  summary: '[Deprecated] Get tenant white-label settings — use GET /branding instead'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", void 0)], WhiteLabelController.prototype, "getSettings", null);
__decorate([(0, _common.Put)('settings'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.UNIVERSITY_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: '[Deprecated] Update white-label settings — use PUT /branding instead'
}), __param(0, (0, _common.Request)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object, Object]), __metadata("design:returntype", void 0)], WhiteLabelController.prototype, "updateSettings", null);
__decorate([(0, _common.Get)('theme.css'), (0, _public.Public)(), (0, _swagger.ApiOperation)({
  summary: '[Deprecated] Get generated CSS theme — use GET /branding/css instead'
}), __param(0, (0, _common.Request)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", Promise)], WhiteLabelController.prototype, "getThemeCSS", null);
__decorate([(0, _common.Get)('by-domain/:domain'), (0, _public.Public)(), (0, _swagger.ApiOperation)({
  summary: 'Resolve tenant by custom domain'
}), __param(0, (0, _common.Param)('domain')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], WhiteLabelController.prototype, "getByDomain", null);
__decorate([(0, _common.Get)('domain'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.UNIVERSITY_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Get custom domain configuration for tenant'
}), __param(0, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], WhiteLabelController.prototype, "getCustomDomain", null);
__decorate([(0, _common.Post)('reset'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Reset all white-label customizations to platform defaults'
}), __param(0, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], WhiteLabelController.prototype, "resetToDefaults", null);
__decorate([(0, _common.Post)('export'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Export full branding configuration as JSON snapshot'
}), __param(0, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], WhiteLabelController.prototype, "exportBrandingConfig", null);
__decorate([(0, _common.Post)('import'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Import branding from a JSON snapshot'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", void 0)], WhiteLabelController.prototype, "importBrandingConfig", null);
__decorate([(0, _common.Get)('config'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.UNIVERSITY_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Get full white-label config for the current tenant (ADMIN only)'
}), (0, _swagger.ApiResponse)({
  status: 200,
  description: 'WhiteLabelConfig object'
}), __param(0, (0, _currentUser.CurrentUser)('tenantId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], WhiteLabelController.prototype, "getConfig", null);
__decorate([(0, _common.Patch)('branding'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.UNIVERSITY_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Update branding config (ADMIN only)'
}), (0, _swagger.ApiResponse)({
  status: 200,
  description: 'Updated WhiteLabelConfig'
}), __param(0, (0, _currentUser.CurrentUser)('tenantId')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_e = typeof Partial !== "undefined" && Partial) === "function" ? _e : Object]), __metadata("design:returntype", void 0)], WhiteLabelController.prototype, "patchBranding", null);
__decorate([(0, _common.Patch)('domain'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SCHOOL_ADMIN, _client.UserRole.UNIVERSITY_ADMIN, _client.UserRole.SUPER_ADMIN), (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT), (0, _swagger.ApiOperation)({
  summary: 'Set custom domain for tenant (ADMIN only)'
}), (0, _swagger.ApiResponse)({
  status: 204,
  description: 'Domain updated'
}), __param(0, (0, _currentUser.CurrentUser)('tenantId')), __param(1, (0, _common.Body)('domain')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", Promise)], WhiteLabelController.prototype, "patchDomain", null);
__decorate([(0, _common.Get)('public/:tenantId'), (0, _public.Public)(), (0, _swagger.ApiOperation)({
  summary: 'Get public branding for login page bootstrap (no auth)'
}), (0, _swagger.ApiResponse)({
  status: 200,
  description: 'Public branding payload'
}), __param(0, (0, _common.Param)('tenantId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], WhiteLabelController.prototype, "getPublicBranding", null);
__decorate([(0, _common.Get)('css/:tenantId'), (0, _public.Public)(), (0, _swagger.ApiOperation)({
  summary: 'Get CSS variables for tenant branding (no auth, text/css)'
}), (0, _swagger.ApiResponse)({
  status: 200,
  description: 'CSS variables :root block',
  content: {
    'application/css': {}
  }
}), __param(0, (0, _common.Param)('tenantId')), __param(1, (0, _common.Res)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_f = typeof _express.Response !== "undefined" && _express.Response) === "function" ? _f : Object]), __metadata("design:returntype", Promise)], WhiteLabelController.prototype, "getCssByTenant", null);
exports.WhiteLabelController = WhiteLabelController = __decorate([(0, _swagger.ApiTags)('White Label'), (0, _common.Controller)('white-label'), __param(0, (0, _common.Inject)(_whiteLabel.WhiteLabelService)), __metadata("design:paramtypes", [Object])], WhiteLabelController);