import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

export const correlationStorage = new AsyncLocalStorage<{ correlationId: string; tenantId: string }>();

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = (req.headers['x-correlation-id'] as string) ?? randomUUID();
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'system';
    res.setHeader('x-correlation-id', correlationId);
    correlationStorage.run({ correlationId, tenantId }, next);
  }
}
