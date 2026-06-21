"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.correlationStorage = exports.CorrelationMiddleware = void 0;
var _common = require("@nestjs/common");
var _crypto = require("crypto");
var _async_hooks = require("async_hooks");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const correlationStorage = exports.correlationStorage = new _async_hooks.AsyncLocalStorage();
let CorrelationMiddleware = exports.CorrelationMiddleware = class CorrelationMiddleware {
  use(req, res, next) {
    const correlationId = req.headers['x-correlation-id'] ?? (0, _crypto.randomUUID)();
    const tenantId = req.headers['x-tenant-id'] ?? 'system';
    res.setHeader('x-correlation-id', correlationId);
    correlationStorage.run({
      correlationId,
      tenantId
    }, next);
  }
};
exports.CorrelationMiddleware = CorrelationMiddleware = __decorate([(0, _common.Injectable)()], CorrelationMiddleware);