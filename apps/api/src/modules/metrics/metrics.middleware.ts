import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

const SKIP_PATHS = new Set(['/health', '/health/ping', '/metrics', '/favicon.ico']);

function normalizePath(path: string): string {
  // Replace UUIDs, cuid, and numeric IDs with placeholders to keep cardinality low
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/c[a-z0-9]{24,}/gi, '/:id')
    .replace(/\/\d+/g, '/:id');
}

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const path = normalizePath(req.path);

    if (SKIP_PATHS.has(req.path)) return next();

    const reqSize = parseInt(req.headers['content-length'] ?? '0', 10);
    if (reqSize > 0) {
      this.metrics.httpRequestSizeBytes.observe({ method: req.method, path }, reqSize);
    }

    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      const status = String(res.statusCode);
      const labels = { method: req.method, path, status };

      this.metrics.httpRequestsTotal.inc(labels);
      this.metrics.httpRequestDurationSeconds.observe(labels, duration);

      const resSize = parseInt(res.getHeader('content-length') as string ?? '0', 10);
      if (resSize > 0) {
        this.metrics.httpResponseSizeBytes.observe({ method: req.method, path }, resSize);
      }
    });

    next();
  }
}
