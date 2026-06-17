import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  requestId?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<{ statusCode: number }>();
    const request = ctx.getRequest<{ headers: Record<string, string> }>();

    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        statusCode: response.statusCode,
        message: 'Success',
        data,
        timestamp: new Date().toISOString(),
        requestId: request.headers['x-request-id'],
      })),
    );
  }
}
