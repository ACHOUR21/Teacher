"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComplianceController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _currentUser = require("../core/decorators/current-user.decorator");
var _jwtAuth = require("../core/guards/jwt-auth.guard");
var _tenant = require("../core/decorators/tenant.decorator");
var _compliance = require("./compliance.service");
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
let ComplianceController = exports.ComplianceController = class ComplianceController {
  constructor(complianceService) {
    this.complianceService = complianceService;
  }
  // ── COPPA ──────────────────────────────────────────────────────────────────
  async getCoppaStatus(userId) {
    return this.complianceService.getCoppaStatus(userId);
  }
  async grantParentalConsent(body) {
    await this.complianceService.grantParentalConsent(body.minorUserId, body.parentEmail, body.token);
    return {
      message: 'Parental consent granted successfully'
    };
  }
  // ── FERPA ──────────────────────────────────────────────────────────────────
  async setDirectoryRestriction(userId, body) {
    await this.complianceService.setDirectoryRestriction(userId, body.restricted);
    return {
      message: `FERPA directory restriction ${body.restricted ? 'enabled' : 'disabled'}`
    };
  }
  async getFerpaAudit(tenantId, limit) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.complianceService.getFerpaAuditLog(tenantId, isNaN(parsedLimit) ? 50 : parsedLimit);
  }
};
__decorate([(0, _common.Get)('coppa/status'), (0, _swagger.ApiOperation)({
  summary: 'Get COPPA compliance status for the current user'
}), (0, _swagger.ApiResponse)({
  status: 200,
  description: 'COPPA status returned'
}), __param(0, (0, _currentUser.CurrentUser)('id')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", Promise)], ComplianceController.prototype, "getCoppaStatus", null);
__decorate([(0, _common.Post)('coppa/consent'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Grant parental consent for a minor (COPPA)'
}), (0, _swagger.ApiResponse)({
  status: 200,
  description: 'Parental consent recorded'
}), __param(0, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [Object]), __metadata("design:returntype", Promise)], ComplianceController.prototype, "grantParentalConsent", null);
__decorate([(0, _common.Put)('ferpa/directory-restriction'), (0, _common.HttpCode)(_common.HttpStatus.OK), (0, _swagger.ApiOperation)({
  summary: 'Enable or disable FERPA directory restriction for the current user'
}), (0, _swagger.ApiResponse)({
  status: 200,
  description: 'Directory restriction updated'
}), __param(0, (0, _currentUser.CurrentUser)('id')), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, Object]), __metadata("design:returntype", Promise)], ComplianceController.prototype, "setDirectoryRestriction", null);
__decorate([(0, _common.Get)('ferpa/audit'), (0, _swagger.ApiOperation)({
  summary: 'List FERPA-sensitive student-record access entries from audit logs'
}), (0, _swagger.ApiResponse)({
  status: 200,
  description: 'FERPA audit log entries'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Query)('limit')), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", Promise)], ComplianceController.prototype, "getFerpaAudit", null);
exports.ComplianceController = ComplianceController = __decorate([(0, _swagger.ApiTags)('Compliance'), (0, _common.Controller)('compliance'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard), (0, _swagger.ApiBearerAuth)('JWT-auth'), __param(0, (0, _common.Inject)(_compliance.ComplianceService)), __metadata("design:paramtypes", [Object])], ComplianceController);