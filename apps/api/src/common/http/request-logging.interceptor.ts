import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import { createLogger } from '@repo/logger';
import type { Request, Response } from 'express';
import { tap, type Observable } from 'rxjs';
import { getUserIdFromRequest } from '@/common/request-user';

const logger = createLogger('APIHttp');

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<object> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();

    const method = request.method;
    const path = request.originalUrl ?? request.url;
    const userId = getUserIdFromRequest(request);

    return next.handle().pipe(
      tap({
        next: () => {
          logger.info('Request completed', {
            method,
            path,
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
            userId,
            correlationId: this.getCorrelationId(response),
          });
        },
        error: (error: Error) => {
          logger.error('Request failed', {
            method,
            path,
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
            userId,
            correlationId: this.getCorrelationId(response),
            error: error.message,
          });
        },
      }),
    );
  }

  private getCorrelationId(response: Response): string {
    const value = response.getHeader('x-correlation-id');
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === 'string') {
        return first;
      }
    }
    return '';
  }
}
