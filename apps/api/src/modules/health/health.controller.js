"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HealthController = void 0;
var _common = require("@nestjs/common");
var _swagger = require("@nestjs/swagger");
var _terminus = require("@nestjs/terminus");
var _redis = require("../cache/redis.service");
var _public = require("../core/decorators/public.decorator");
var _resilience = require("../core/services/resilience.service");
var _prisma = require("../database/prisma.service");
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
let HealthController = exports.HealthController = class HealthController {
  constructor(health, prisma, redis, resilience) {
    this.health = health;
    this.prisma = prisma;
    this.redis = redis;
    this.resilience = resilience;
  }
  async check() {
    return this.health.check([async () => {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        return {
          database: {
            status: 'up'
          }
        };
      } catch (err) {
        return {
          database: {
            status: 'down',
            message: err.message
          }
        };
      }
    }, async () => {
      try {
        const result = await this.redis.ping();
        return {
          redis: {
            status: result === 'PONG' ? 'up' : 'down'
          }
        };
      } catch (err) {
        return {
          redis: {
            status: 'down',
            message: err.message
          }
        };
      }
    }, () => {
      const used = process.memoryUsage();
      return Promise.resolve({
        memory: {
          status: 'up',
          heapUsedMb: Math.round(used.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(used.heapTotal / 1024 / 1024),
          rssMb: Math.round(used.rss / 1024 / 1024)
        }
      });
    }]);
  }
  live() {
    return {
      status: 'ok'
    };
  }
  ping() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] ?? '1.0.0',
      uptime: Math.round(process.uptime()),
      environment: process.env['NODE_ENV'] ?? 'development'
    };
  }
  backup() {
    const s3Bucket = process.env['S3_BUCKET'];
    const configured = typeof s3Bucket === 'string' && s3Bucket.trim().length > 0;
    return {
      timestamp: new Date().toISOString(),
      backup: {
        s3_configured: configured,
        s3_bucket: configured ? s3Bucket : null,
        schedule: {
          postgres_daily: '0 2 * * *',
          postgres_weekly: '0 3 * * 0',
          redis_daily: '30 2 * * *'
        },
        retention: {
          postgres_daily_days: 30,
          postgres_weekly_days: 90,
          redis_daily_days: 7
        }
      }
    };
  }
  circuits() {
    const status = this.resilience.getCircuitStatus();
    const circuits = Object.entries(status).map(([name, state]) => ({
      name,
      state: state.state,
      failures: state.failures,
      lastFailureTime: state.lastFailureTime > 0 ? new Date(state.lastFailureTime).toISOString() : null
    }));
    return {
      timestamp: new Date().toISOString(),
      circuits,
      summary: {
        total: circuits.length,
        open: circuits.filter(c => c.state === 'OPEN').length,
        halfOpen: circuits.filter(c => c.state === 'HALF_OPEN').length,
        closed: circuits.filter(c => c.state === 'CLOSED').length
      }
    };
  }
};
__decorate([(0, _common.Get)(), (0, _public.Public)(), (0, _terminus.HealthCheck)(), (0, _swagger.ApiOperation)({
  summary: 'Readiness probe — DB, Redis, memory'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", typeof (_a = typeof Promise !== "undefined" && Promise) === "function" ? _a : Object)], HealthController.prototype, "check", null);
__decorate([(0, _common.Get)('live'), (0, _public.Public)(), (0, _common.HttpCode)(200), (0, _swagger.ApiOperation)({
  summary: 'Kubernetes liveness probe — always 200 if process is up'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], HealthController.prototype, "live", null);
__decorate([(0, _common.Get)('ping'), (0, _public.Public)(), (0, _swagger.ApiOperation)({
  summary: 'Detailed liveness ping with uptime and version'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], HealthController.prototype, "ping", null);
__decorate([(0, _common.Get)('backup'), (0, _public.Public)(), (0, _swagger.ApiOperation)({
  summary: 'Backup configuration status — confirms S3 backup target is set'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], HealthController.prototype, "backup", null);
__decorate([(0, _common.Get)('circuits'), (0, _public.Public)(), (0, _swagger.ApiOperation)({
  summary: 'Circuit breaker status for all external service integrations'
}), __metadata("design:type", Function), __metadata("design:paramtypes", []), __metadata("design:returntype", void 0)], HealthController.prototype, "circuits", null);
exports.HealthController = HealthController = __decorate([(0, _swagger.ApiTags)('Health'), (0, _common.Controller)('health'), __param(0, (0, _common.Inject)(_terminus.HealthCheckService)), __param(1, (0, _common.Inject)(_prisma.PrismaService)), __param(2, (0, _common.Inject)(_redis.RedisService)), __param(3, (0, _common.Inject)(_resilience.ResilienceService)), __metadata("design:paramtypes", [Object, Object, Object, Object])], HealthController);