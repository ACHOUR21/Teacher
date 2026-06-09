import { randomUUID } from 'crypto';

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const requestId = (request.headers['x-request-id'] as string) || randomUUID();
    request.headers['x-request-id'] = requestId;
    response.setHeader('X-Request-ID', requestId);

    const { method, url, ip } = request;
    const userAgent = request.headers['user-agent'] || '';
    const tenantId = (request as Request & { tenantId?: string }).tenantId;
    const startTime = Date.now();

    this.logger.log(
      `→ ${method} ${url} | IP: ${ip} | UA: ${userAgent.substring(0, 50)} | Tenant: ${tenantId || 'none'} | ReqID: ${requestId}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          this.logger.log(
            `← ${method} ${url} | ${statusCode} | ${duration}ms | ReqID: ${requestId}`,
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `← ${method} ${url} | ERROR | ${duration}ms | ReqID: ${requestId} | ${error.message}`,
          );
        },
      }),
    );
  }
}
