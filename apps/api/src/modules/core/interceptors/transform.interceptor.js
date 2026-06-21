"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TransformInterceptor = void 0;
var _common = require("@nestjs/common");
var _operators = require("rxjs/operators");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let TransformInterceptor = exports.TransformInterceptor = class TransformInterceptor {
  intercept(context, next) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    return next.handle().pipe((0, _operators.map)(data => ({
      success: true,
      statusCode: response.statusCode,
      message: 'Success',
      data,
      timestamp: new Date().toISOString(),
      requestId: request.headers['x-request-id']
    })));
  }
};
exports.TransformInterceptor = TransformInterceptor = __decorate([(0, _common.Injectable)()], TransformInterceptor);