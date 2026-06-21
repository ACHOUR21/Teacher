"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MetricsMiddleware = void 0;
var _common = require("@nestjs/common");
var _metrics = require("./metrics.service");
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
const SKIP_PATHS = new Set(['/health', '/health/ping', '/metrics', '/favicon.ico']);
function normalizePath(path) {
  // Replace UUIDs, cuid, and numeric IDs with placeholders to keep cardinality low
  return path.replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id').replace(/\/c[a-z0-9]{24,}/gi, '/:id').replace(/\/\d+/g, '/:id');
}
let MetricsMiddleware = exports.MetricsMiddleware = class MetricsMiddleware {
  constructor(metrics) {
    this.metrics = metrics;
  }
  use(req, res, next) {
    const startTime = Date.now();
    const path = normalizePath(req.path);
    if (SKIP_PATHS.has(req.path)) {
      return next();
    }
    const reqSize = parseInt(req.headers['content-length'] ?? '0', 10);
    if (reqSize > 0) {
      this.metrics.httpRequestSizeBytes.observe({
        method: req.method,
        path
      }, reqSize);
    }
    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      const status = String(res.statusCode);
      const labels = {
        method: req.method,
        path,
        status
      };
      this.metrics.httpRequestsTotal.inc(labels);
      this.metrics.httpRequestDurationSeconds.observe(labels, duration);
      const resSize = parseInt(res.getHeader('content-length') ?? '0', 10);
      if (resSize > 0) {
        this.metrics.httpResponseSizeBytes.observe({
          method: req.method,
          path
        }, resSize);
      }
    });
    next();
  }
};
exports.MetricsMiddleware = MetricsMiddleware = __decorate([(0, _common.Injectable)(), __param(0, (0, _common.Inject)(_metrics.MetricsService)), __metadata("design:paramtypes", [Object])], MetricsMiddleware);