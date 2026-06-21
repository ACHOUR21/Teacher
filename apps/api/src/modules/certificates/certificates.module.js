"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CertificatesModule = void 0;
var _common = require("@nestjs/common");
var _config = require("@nestjs/config");
var _database = require("../database/database.module");
var _certificate = require("../queue/processors/certificate.processor");
var _storage = require("../storage/storage.module");
var _certificateGenerator = require("./certificate-generator.service");
var _certificates = require("./certificates.service");
var _certificates2 = require("./presentation/controllers/certificates.controller");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let CertificatesModule = exports.CertificatesModule = class CertificatesModule {};
exports.CertificatesModule = CertificatesModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _storage.StorageModule, _config.ConfigModule],
  controllers: [_certificates2.CertificatesController],
  providers: [_certificates.CertificatesService, _certificateGenerator.CertificateGeneratorService, _certificate.CertificateProcessor],
  exports: [_certificates.CertificatesService, _certificateGenerator.CertificateGeneratorService]
})], CertificatesModule);