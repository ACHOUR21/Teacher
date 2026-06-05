import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../../cache/redis.service';
import { Request } from 'express';

const DEFAULT_TTL = 60; // seconds

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);

  constructor(private readonly redis: RedisService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request & { user?: { tenantId?: string } }>();

    if (request.method !== 'GET') return next.handle();

    const ttl = Reflect.getMetadata('cache_ttl', context.getHandler()) ?? DEFAULT_TTL;
    if (ttl === 0) return next.handle();

    const tenantId = (request as any).tenantId ?? request.user?.tenantId ?? 'global';
    const cacheKey = `http:${tenantId}:${request.url}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache HIT: ${cacheKey}`);
        return of(JSON.parse(cached));
      }
    } catch {
      // cache miss, fall through
    }

    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.redis.set(cacheKey, JSON.stringify(data), ttl);
        } catch {
          // non-fatal
        }
      }),
    );
  }
}
