"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CertificateProcessor = void 0;
var _bull = require("@nestjs/bull");
var _common = require("@nestjs/common");
var _bull2 = require("bull");
var _certificates = require("../../certificates/certificates.service");
var _queue = require("../queue.module");
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
var CertificateProcessor_1;
var _a, _b;
let CertificateProcessor = exports.CertificateProcessor = CertificateProcessor_1 = class CertificateProcessor {
  logger = new _common.Logger(CertificateProcessor_1.name);
  constructor(certificatesService) {
    this.certificatesService = certificatesService;
  }
  async handleIssue(job) {
    const {
      studentId,
      templateId,
      metadata
    } = job.data;
    this.logger.log(`Issuing certificate for student ${studentId} with template ${templateId}`);
    return this.certificatesService.issueCertificate(studentId, templateId, metadata ?? {});
  }
  async handleBulkIssue(job) {
    const {
      certificates
    } = job.data;
    this.logger.log(`Bulk issuing ${certificates.length} certificates`);
    const results = await Promise.allSettled(certificates.map(c => this.certificatesService.issueCertificate(c.studentId, c.templateId, c.metadata ?? {})));
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    this.logger.log(`Bulk issue complete: ${succeeded} succeeded, ${failed} failed`);
    return {
      succeeded,
      failed
    };
  }
};
__decorate([(0, _bull.Process)('issue'), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_a = typeof _bull2.Job !== "undefined" && _bull2.Job) === "function" ? _a : Object]), __metadata("design:returntype", Promise)], CertificateProcessor.prototype, "handleIssue", null);
__decorate([(0, _bull.Process)('bulk-issue'), __metadata("design:type", Function), __metadata("design:paramtypes", [typeof (_b = typeof _bull2.Job !== "undefined" && _bull2.Job) === "function" ? _b : Object]), __metadata("design:returntype", Promise)], CertificateProcessor.prototype, "handleBulkIssue", null);
exports.CertificateProcessor = CertificateProcessor = CertificateProcessor_1 = __decorate([(0, _bull.Processor)(_queue.QUEUE_CERTIFICATE), __param(0, (0, _common.Inject)(_certificates.CertificatesService)), __metadata("design:paramtypes", [Object])], CertificateProcessor);