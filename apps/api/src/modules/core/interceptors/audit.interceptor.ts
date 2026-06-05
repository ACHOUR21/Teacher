import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';
import { AuditAction } from '@prisma/client';
import { Request } from 'express';

const METHOD_ACTION: Record<string, AuditAction> = {
  POST: AuditAction.CREATE,
  PUT: AuditAction.UPDATE,
  PATCH: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: any; tenantId?: string }>();
    const action = METHOD_ACTION[req.method];

    if (!action || !req.user) return next.handle();

    const segments = req.path.split('/').filter(Boolean);
    const resource = segments[0] ?? 'unknown';
    const resourceId = segments[1] ?? undefined;

    return next.handle().pipe(
      tap(() => {
        this.auditService
          .log({
            tenantId: req.tenantId ?? req.user?.tenantId ?? 'unknown',
            userId: req.user?.id,
            action,
            resource,
            resourceId,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            after: req.body,
          })
          .catch(() => undefined);
      }),
    );
  }
}
