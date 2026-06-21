"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AuditInterceptor = void 0;
var _common = require("@nestjs/common");
var _client = require("@prisma/client");
var _operators = require("rxjs/operators");
var _audit = require("../../audit/audit.service");
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
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

const METHOD_ACTION = {
  POST: _client.AuditAction.CREATE,
  PUT: _client.AuditAction.UPDATE,
  PATCH: _client.AuditAction.UPDATE,
  DELETE: _client.AuditAction.DELETE
};
let AuditInterceptor = exports.AuditInterceptor = class AuditInterceptor {
  constructor(auditService) {
    this.auditService = auditService;
  }
  intercept(context, next) {
    const req = context.switchToHttp().getRequest();
    const action = METHOD_ACTION[req.method];
    if (!action || !req.user) {
      return next.handle();
    }
    const segments = req.path.split('/').filter(Boolean);
    const resource = segments[0] ?? 'unknown';
    const resourceId = segments[1] ?? undefined;
    return next.handle().pipe((0, _operators.tap)(() => {
      this.auditService.log({
        tenantId: req.tenantId ?? req.user?.tenantId ?? 'unknown',
        userId: req.user?.id,
        action,
        resource,
        resourceId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        after: req.body
      }).catch(() => undefined);
    }));
  }
};
exports.AuditInterceptor = AuditInterceptor = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_audit.AuditService)), __metadata("design:paramtypes", [Object])], AuditInterceptor);