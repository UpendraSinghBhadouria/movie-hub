import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ERROR_CODES } from '../constants/error-codes.constants.js';
import {
  ErrorCode,
  ErrorResponse,
  ExceptionResponse,
  FieldError,
} from '../types/index.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();

    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: FieldError[] | undefined;
    let errCode: ErrorCode | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const body = exceptionResponse as ExceptionResponse;

        /*
         * Custom errors
         *
         * Example:
         * {
         *   message: "Movie not found",
         *   err_code: "MOVIE_NOT_FOUND"
         * }
         */
        if (typeof body.message === 'string') {
          message = body.message;
        }

        if (body.err_code) {
          errCode = body.err_code;
        }

        if (Array.isArray(body.errors)) {
          errors = body.errors;
        }

        /*
         * NestJS ValidationPipe
         *
         * Default validation response:
         *
         * {
         *   message: [
         *     "email must be an email",
         *     "password must be longer than or equal to 8 characters"
         *   ]
         * }
         */
        if (Array.isArray(body.message)) {
          message = 'Validation failed';

          errors = body.message.map((validationMessage) => {
            const field = validationMessage.split(' ')[1];
            return {
              field,
              message: validationMessage,
            };
          });

          errCode = ERROR_CODES.VALIDATION_ERROR;
        }
      }
    }

    const errorResponse: ErrorResponse = {
      success: false,
      message,
      path: request.originalUrl,
      ...(errors?.length ? { errors } : {}),
      ...(errCode ? { err_code: errCode } : {}),
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(errorResponse);
  }
}
