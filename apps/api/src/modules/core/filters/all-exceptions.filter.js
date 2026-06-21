"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AllExceptionsFilter = void 0;
var _common = require("@nestjs/common");
var _client = require("@prisma/client");
var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
let AllExceptionsFilter = exports.AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
  logger = new _common.Logger(AllExceptionsFilter_1.name);
  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    let statusCode = _common.HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors = [];
    if (exception instanceof _common.HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse;
        message = resp['message'] || message;
        if (Array.isArray(resp['message'])) {
          errors = resp['message'];
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof _client.Prisma.PrismaClientKnownRequestError) {
      statusCode = _common.HttpStatus.CONFLICT;
      if (exception.code === 'P2002') {
        message = 'A record with this data already exists';
        errors = [`Duplicate value on field: ${exception.meta?.['target']?.join(', ')}`];
      } else if (exception.code === 'P2025') {
        statusCode = _common.HttpStatus.NOT_FOUND;
        message = 'Record not found';
      } else {
        message = 'Database operation failed';
        errors = [exception.message];
      }
    } else if (exception instanceof _client.Prisma.PrismaClientValidationError) {
      statusCode = _common.HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided';
      errors = ['Database validation failed'];
    } else if (exception instanceof Error) {
      // Never leak raw internal error details to clients in production
      if (process.env['NODE_ENV'] === 'production') {
        message = 'Internal server error';
        errors = [];
      } else {
        message = exception.message;
        errors = [exception.message];
      }
    }
    const errorResponse = {
      success: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.headers['x-request-id']
    };
    if (Number(statusCode) >= 500) {
      const detail = process.env['NODE_ENV'] === 'production' ? exception instanceof Error ? exception.message : String(exception) : exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${request.method} ${request.url} - ${statusCode}`, detail);
      // Report unhandled server errors to Sentry (production only)
      if (process.env['SENTRY_DSN'] && process.env['NODE_ENV'] === 'production') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
          const Sentry = require('@sentry/node');
          Sentry.captureException(exception);
        } catch (_) {/* Sentry not installed — skip silently */}
      }
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${statusCode}: ${message}`);
    }
    response.status(statusCode).json(errorResponse);
  }
};
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([(0, _common.Catch)()], AllExceptionsFilter);