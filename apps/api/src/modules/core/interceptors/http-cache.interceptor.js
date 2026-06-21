"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HttpCacheInterceptor = void 0;
var _common = require("@nestjs/common");
var _rxjs = require("rxjs");
var _operators = require("rxjs/operators");
var _redis = require("../../cache/redis.service");
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
var HttpCacheInterceptor_1;
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-misused-promises */

const DEFAULT_TTL = 60; // seconds
let HttpCacheInterceptor = exports.HttpCacheInterceptor = HttpCacheInterceptor_1 = class HttpCacheInterceptor {
  logger = new _common.Logger(HttpCacheInterceptor_1.name);
  constructor(redis) {
    this.redis = redis;
  }
  async intercept(context, next) {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    if (request.method !== 'GET') {
      return next.handle();
    }
    const ttl = Reflect.getMetadata('cache_ttl', context.getHandler()) ?? DEFAULT_TTL;
    if (ttl === 0) {
      return next.handle();
    }
    const tenantId = request.tenantId ?? request.user?.tenantId ?? 'global';
    const cacheKey = `http:${tenantId}:${request.url}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache HIT: ${cacheKey}`);
        return (0, _rxjs.of)(JSON.parse(cached));
      }
    } catch {
      // cache miss, fall through
    }
    return next.handle().pipe((0, _operators.tap)(async data => {
      try {
        await this.redis.set(cacheKey, JSON.stringify(data), ttl);
      } catch {
        // non-fatal
      }
    }));
  }
};
exports.HttpCacheInterceptor = HttpCacheInterceptor = HttpCacheInterceptor_1 = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_redis.RedisService)), __metadata("design:paramtypes", [Object])], HttpCacheInterceptor);