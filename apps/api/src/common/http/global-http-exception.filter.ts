import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { ApiErrorResponse } from '@repo/shared-types';
import { createLogger } from '@repo/logger';
import type { Request, Response } from 'express';
import { getUserIdFromRequest } from '../request-user';

type NormalizedError = {
  statusCode: number;
  error: string;
  message: string;
  details?: string[] | undefined;
};

type HttpErrorBody = {
  message?: string | string[] | undefined;
  error?: string | undefined;
};

const logger = createLogger('APIException');

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter<
  Error | HttpException
> {
  catch(exception: Error | HttpException, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const normalized = this.normalize(exception);
    const statusCode = Number(normalized.statusCode);
    const payload: ApiErrorResponse = {
      statusCode,
      error: normalized.error,
      message: normalized.message,
      details: normalized.details,
      path: request.originalUrl ?? request.url,
      timestamp: new Date().toISOString(),
      correlationId: this.getCorrelationId(response),
    };

    const logContext = {
      method: request.method,
      path: payload.path,
      userId: getUserIdFromRequest(request),
      statusCode,
      correlationId: payload.correlationId,
      details: payload.details,
      error: payload.message,
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      logger.error('Unhandled API exception', logContext);
    } else {
      logger.warn('Handled API exception', logContext);
    }

    response.status(statusCode).json(payload);
  }

  private normalize(exception: Error | HttpException): NormalizedError {
    if (exception instanceof HttpException) {
      const rawStatusCode = Number(exception.getStatus());
      const statusCode = Number.isInteger(rawStatusCode)
        ? rawStatusCode
        : HttpStatus.INTERNAL_SERVER_ERROR;
      const fallbackError = this.getHttpStatusName(statusCode);
      const fallbackMessage = exception.message;
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        return {
          statusCode,
          error: fallbackError,
          message: responseBody,
        };
      }

      if (this.isHttpErrorBody(responseBody)) {
        const details = this.normalizeDetails(responseBody.message);
        return {
          statusCode,
          error:
            typeof responseBody.error === 'string'
              ? responseBody.error
              : fallbackError,
          message: this.pickMessage(responseBody.message),
          details,
        };
      }

      return {
        statusCode,
        error: fallbackError,
        message: fallbackMessage ?? fallbackError,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: this.getHttpStatusName(HttpStatus.INTERNAL_SERVER_ERROR),
      message: exception.message,
    };
  }

  private isHttpErrorBody(value: object | string): value is HttpErrorBody {
    if (typeof value === 'string') {
      return false;
    }

    if ('message' in value) {
      const messageValue = value.message;
      if (typeof messageValue === 'string') {
        return true;
      }
      if (
        Array.isArray(messageValue) &&
        messageValue.every((item) => typeof item === 'string')
      ) {
        return true;
      }
    }

    return 'error' in value && typeof value.error === 'string';
  }

  private normalizeDetails(
    message: string | string[] | undefined,
  ): string[] | undefined {
    if (Array.isArray(message)) {
      return message;
    }
    if (typeof message === 'string') {
      return undefined;
    }
    return undefined;
  }

  private pickMessage(message: string | string[] | undefined): string {
    if (Array.isArray(message)) {
      return message[0] ?? 'Validation failed';
    }
    if (typeof message === 'string') {
      return message;
    }
    return 'Request failed';
  }

  private getHttpStatusName(statusCode: number): string {
    const value = HttpStatus[statusCode];
    if (typeof value === 'string') {
      return value;
    }
    return 'Error';
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
