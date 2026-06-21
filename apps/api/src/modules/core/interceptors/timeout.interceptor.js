"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TimeoutInterceptor = void 0;
var _common = require("@nestjs/common");
var _rxjs = require("rxjs");
var _operators = require("rxjs/operators");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
let TimeoutInterceptor = exports.TimeoutInterceptor = class TimeoutInterceptor {
  TIMEOUT_MS = 30000;
  intercept(_context, next) {
    return next.handle().pipe((0, _operators.timeout)(this.TIMEOUT_MS), (0, _operators.catchError)(err => {
      if (err instanceof _rxjs.TimeoutError) {
        return (0, _rxjs.throwError)(() => new _common.RequestTimeoutException('Request timed out after 30 seconds'));
      }
      return (0, _rxjs.throwError)(() => err);
    }));
  }
};
exports.TimeoutInterceptor = TimeoutInterceptor = __decorate([(0, _common.Injectable)()], TimeoutInterceptor);