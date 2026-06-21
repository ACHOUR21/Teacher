"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CertificatesController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _client = require("@prisma/client");
var _classValidator = require("class-validator");
var _express = require("express");
var _currentUser = require("../../../core/decorators/current-user.decorator");
var _public = require("../../../core/decorators/public.decorator");
var _roles = require("../../../core/decorators/roles.decorator");
var _tenant = require("../../../core/decorators/tenant.decorator");
var _jwtAuth = require("../../../core/guards/jwt-auth.guard");
var _roles2 = require("../../../core/guards/roles.guard");
var _certificateGenerator = require("../../certificate-generator.service");
var _certificates = require("../../certificates.service");
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
class IssueCertificateDto {
  studentId;
  templateId;
}
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], IssueCertificateDto.prototype, "studentId", void 0);
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], IssueCertificateDto.prototype, "templateId", void 0);
class IssueToUserDto {
  userId;
  templateId;
}
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], IssueToUserDto.prototype, "userId", void 0);
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], IssueToUserDto.prototype, "templateId", void 0);
class IssueCertificateByTemplateDto {
  templateId;
  courseId;
  recipientId;
}
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], IssueCertificateByTemplateDto.prototype, "templateId", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], IssueCertificateByTemplateDto.prototype, "courseId", void 0);
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], IssueCertificateByTemplateDto.prototype, "recipientId", void 0);
class CreateTemplateDto {
  name;
  title;
  bodyText;
  backgroundColor;
  textColor;
  borderStyle;
  showSignature;
  courseId;
}
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateTemplateDto.prototype, "name", void 0);
__decorate([(0, _swagger.ApiProperty)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateTemplateDto.prototype, "title", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateTemplateDto.prototype, "bodyText", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateTemplateDto.prototype, "backgroundColor", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateTemplateDto.prototype, "textColor", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateTemplateDto.prototype, "borderStyle", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsBoolean)(), __metadata("design:type", Boolean)], CreateTemplateDto.prototype, "showSignature", void 0);
__decorate([(0, _swagger.ApiPropertyOptional)(), (0, _classValidator.IsOptional)(), (0, _classValidator.IsString)(), __metadata("design:type", String)], CreateTemplateDto.prototype, "courseId", void 0);
let CertificatesController = exports.CertificatesController = class CertificatesController {
  constructor(certificatesService, certificateGeneratorService) {
    this.certificatesService = certificatesService;
    this.certificateGeneratorService = certificateGeneratorService;
  }
  // ---- Generator endpoints (enrollment/progress-based) ---------------------
  async generate(progressId, tenantId) {
    const {
      certificateId,
      verificationHash
    } = await this.certificateGeneratorService.generateCertificate(progressId, tenantId);
    return {
      certificateId,
      verificationHash
    };
  }
  verifyById(certificateId) {
    return this.certificateGeneratorService.verifyCertificate(certificateId);
  }
  myGeneratedCertificates(user) {
    return this.certificateGeneratorService.getCertificates(user.id);
  }
  async downloadById(certificateId, user, res) {
    const buffer = await this.certificateGeneratorService.downloadCertificate(certificateId, user.id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate-${certificateId}.pdf"`,
      'Content-Length': buffer.length
    });
    res.send(buffer);
  }
  // ---- Templates -----------------------------------------------------------
  getTemplates(tenantId) {
    return this.certificatesService.getTemplates(tenantId);
  }
  createTemplate(tenantId, dto) {
    return this.certificatesService.createTemplate({
      ...dto,
      tenantId
    });
  }
  // ---- Issuance ------------------------------------------------------------
  issue(dto) {
    return this.certificatesService.issueCertificate(dto.studentId, dto.templateId);
  }
  issueToUser(dto) {
    return this.certificatesService.issueToUser(dto.userId, dto.templateId);
  }
  issueByTemplate(dto) {
    return this.certificatesService.issueCertificateByTemplate(dto);
  }
  // ---- Listing -------------------------------------------------------------
  myCertificates(user) {
    return this.certificatesService.getUserCertificates(user.id);
  }
  tenantCertificates(tenantId) {
    return this.certificatesService.getTenantCertificates(tenantId);
  }
  // ---- Verification (public) -----------------------------------------------
  verify(code) {
    return this.certificatesService.verifyCertificate(code);
  }
  // ---- Download ------------------------------------------------------------
  async download(id, res) {
    const buffer = await this.certificatesService.downloadCertificate(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate-${id}.pdf"`,
      'Content-Length': buffer.length
    });
    res.end(buffer);
  }
};
__decorate([(0, _common.Post)('generate/:progressId'), (0, _roles.Roles)(_client.UserRole.STUDENT, _client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Generate a certificate from a completed CourseProgress record'
}), __param(0, (0, _common.Param)('progressId')), __param(1, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, String]), __metadata("design:returntype", Promise)], CertificatesController.prototype, "generate", null);
__decorate([(0, _public.Public)(), (0, _common.Get)('verify/:certificateId'), (0, _swagger.ApiOperation)({
  summary: 'Publicly verify a certificate by UUID (generator path)'
}), __param(0, (0, _common.Param)('certificateId')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], CertificatesController.prototype, "verifyById", null);
__decorate([(0, _common.Get)('my-generated'), (0, _roles.Roles)(_client.UserRole.STUDENT, _client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'List all generated certificates for the current user'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_a = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _a : Object]), __metadata("design:returntype", void 0)], CertificatesController.prototype, "myGeneratedCertificates", null);
__decorate([(0, _common.Get)('download/:certificateId'), (0, _roles.Roles)(_client.UserRole.STUDENT, _client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Download a generated certificate PDF by certificateId'
}), __param(0, (0, _common.Param)('certificateId')), __param(1, (0, _currentUser.CurrentUser)()), __param(2, (0, _common.Res)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_b = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _b : Object, typeof (_c = typeof _express.Response !== "undefined" && _express.Response) === "function" ? _c : Object]), __metadata("design:returntype", Promise)], CertificatesController.prototype, "downloadById", null);
__decorate([(0, _common.Get)('templates'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'List certificate templates for this tenant'
}), __param(0, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], CertificatesController.prototype, "getTemplates", null);
__decorate([(0, _common.Post)('templates'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Create a certificate template'
}), __param(0, (0, _tenant.TenantId)()), __param(1, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, CreateTemplateDto]), __metadata("design:returntype", void 0)], CertificatesController.prototype, "createTemplate", null);
__decorate([(0, _common.Post)('issue'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Issue a certificate to a student (by studentId)'
}), __param(0, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [IssueCertificateDto]), __metadata("design:returntype", void 0)], CertificatesController.prototype, "issue", null);
__decorate([(0, _common.Post)('issue-to-user'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Issue a certificate to any user (by userId)'
}), __param(0, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [IssueToUserDto]), __metadata("design:returntype", void 0)], CertificatesController.prototype, "issueToUser", null);
__decorate([(0, _common.Post)('issue-by-template'), (0, _roles.Roles)(_client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Issue a certificate by template with course and recipient'
}), __param(0, (0, _common.Body)()), __metadata("design:type", Function), __metadata("design:paramtypes", [IssueCertificateByTemplateDto]), __metadata("design:returntype", void 0)], CertificatesController.prototype, "issueByTemplate", null);
__decorate([(0, _common.Get)('my'), (0, _roles.Roles)(_client.UserRole.STUDENT, _client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Get my certificates'
}), __param(0, (0, _currentUser.CurrentUser)()), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_d = typeof _currentUser.CurrentUserPayload !== "undefined" && _currentUser.CurrentUserPayload) === "function" ? _d : Object]), __metadata("design:returntype", void 0)], CertificatesController.prototype, "myCertificates", null);
__decorate([(0, _common.Get)('tenant'), (0, _roles.Roles)(_client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Get all certificates issued in this tenant (admin view)'
}), __param(0, (0, _tenant.TenantId)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], CertificatesController.prototype, "tenantCertificates", null);
__decorate([(0, _public.Public)(), (0, _common.Get)('verify/:code'), (0, _swagger.ApiOperation)({
  summary: 'Publicly verify a certificate by code'
}), __param(0, (0, _common.Param)('code')), __metadata("design:type", Function), __metadata("design:paramtypes", [String]), __metadata("design:returntype", void 0)], CertificatesController.prototype, "verify", null);
__decorate([(0, _common.Get)(':id/download'), (0, _roles.Roles)(_client.UserRole.STUDENT, _client.UserRole.TEACHER, _client.UserRole.ADMIN, _client.UserRole.SUPER_ADMIN), (0, _swagger.ApiOperation)({
  summary: 'Download a certificate as PDF'
}), __param(0, (0, _common.Param)('id')), __param(1, (0, _common.Res)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_e = typeof _express.Response !== "undefined" && _express.Response) === "function" ? _e : Object]), __metadata("design:returntype", Promise)], CertificatesController.prototype, "download", null);
exports.CertificatesController = CertificatesController = __decorate([(0, _swagger.ApiTags)('Certificates'), (0, _swagger.ApiBearerAuth)('JWT-auth'), (0, _common.UseGuards)(_jwtAuth.JwtAuthGuard, _roles2.RolesGuard), (0, _common.Controller)('certificates'), __param(0, (0, _common.Inject)(_certificates.CertificatesService)), __param(1, (0, _common.Inject)(_certificateGenerator.CertificateGeneratorService)), __metadata("design:paramtypes", [Object, Object])], CertificatesController);