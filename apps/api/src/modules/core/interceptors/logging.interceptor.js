"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LoggingInterceptor = void 0;
var _crypto = require("crypto");
var _common = require("@nestjs/common");
var _operators = require("rxjs/operators");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let LoggingInterceptor = exports.LoggingInterceptor = class LoggingInterceptor {
  logger = new _common.Logger('HTTP');
  intercept(context, next) {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const requestId = request.headers['x-request-id'] || (0, _crypto.randomUUID)();
    request.headers['x-request-id'] = requestId;
    response.setHeader('X-Request-ID', requestId);
    const {
      method,
      url,
      ip
    } = request;
    const userAgent = request.headers['user-agent'] || '';
    const tenantId = request.tenantId;
    const startTime = Date.now();
    this.logger.log(`→ ${method} ${url} | IP: ${ip} | UA: ${userAgent.substring(0, 50)} | Tenant: ${tenantId || 'none'} | ReqID: ${requestId}`);
    return next.handle().pipe((0, _operators.tap)({
      next: () => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;
        this.logger.log(`← ${method} ${url} | ${statusCode} | ${duration}ms | ReqID: ${requestId}`);
      },
      error: error => {
        const duration = Date.now() - startTime;
        this.logger.error(`← ${method} ${url} | ERROR | ${duration}ms | ReqID: ${requestId} | ${error.message}`);
      }
    }));
  }
};
exports.LoggingInterceptor = LoggingInterceptor = __decorate([(0, _common.Injectable)()], LoggingInterceptor);