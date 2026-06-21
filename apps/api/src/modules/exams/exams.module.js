"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ExamsModule = void 0;
var _common = require("@nestjs/common");
var _certificates = require("../certificates/certificates.module");
var _database = require("../database/database.module");
var _search = require("../search/search.module");
var _exams = require("./exams.service");
var _exams2 = require("./presentation/controllers/exams.controller");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let ExamsModule = exports.ExamsModule = class ExamsModule {};
exports.ExamsModule = ExamsModule = __decorate([(0, _common.Module)({
  imports: [_database.DatabaseModule, _certificates.CertificatesModule, _search.SearchModule],
  controllers: [_exams2.ExamsController],
  providers: [_exams.ExamsService],
  exports: [_exams.ExamsService]
})], ExamsModule);