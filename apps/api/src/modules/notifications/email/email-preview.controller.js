"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EmailPreviewController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _express = require("express");
var _public = require("../../core/decorators/public.decorator");
var _email = require("./email.service");
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
var _a;
/**
 * Development-only controller for previewing HTML email templates.
 * All routes are guarded with a NODE_ENV check — returning 404 in production.
 */
let EmailPreviewController = exports.EmailPreviewController = class EmailPreviewController {
  constructor(emailService) {
    this.emailService = emailService;
  }
  preview(template, res) {
    if (process.env['NODE_ENV'] === 'production') {
      throw new _common.NotFoundException('Not found');
    }
    const html = this.emailService.previewTemplate(template);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
};
__decorate([(0, _public.Public)(), (0, _common.Get)(':template'), __param(0, (0, _common.Param)('template')), __param(1, (0, _common.Res)()), __metadata("design:type", Function), __metadata("design:paramtypes", [String, typeof (_a = typeof _express.Response !== "undefined" && _express.Response) === "function" ? _a : Object]), __metadata("design:returntype", void 0)], EmailPreviewController.prototype, "preview", null);
exports.EmailPreviewController = EmailPreviewController = __decorate([(0, _swagger.ApiExcludeController)(), (0, _common.Controller)('dev/email-preview'), __param(0, (0, _common.Inject)(_email.EmailService)), __metadata("design:paramtypes", [Object])], EmailPreviewController);