import { ERROR_CODES } from '../constants/error-codes.constants.js';

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface FieldError {
  field: string;
  message: string;
}

export interface ExceptionResponse {
  message?: string | string[];
  err_code?: ErrorCode;
  errors?: FieldError[];
}

export interface ErrorResponse {
  success: false;
  message: string;
  path: string;
  errors?: FieldError[];
  err_code?: ErrorCode;
  timestamp: string;
}
