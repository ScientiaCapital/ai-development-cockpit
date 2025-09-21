/**
 * Error Type Guards and Utilities
 * 
 * Provides type-safe error handling patterns for TypeScript applications.
 * Based on TypeScript best practices for handling unknown error types in catch blocks.
 */

/**
 * Standard error interface for application errors
 */
export interface AppError {
  message: string;
  code?: string | number;
  cause?: unknown;
  stack?: string;
}

/**
 * Type guard to check if an unknown error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if an unknown error has a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
}

/**
 * Type guard to check if an unknown error has a code property
 */
export function hasCode(error: unknown): error is { code: string | number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (typeof (error as any).code === 'string' || typeof (error as any).code === 'number')
  );
}

/**
 * Type guard to check if an unknown error is string-like
 */
export function isStringLike(error: unknown): error is string {
  return typeof error === 'string';
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  
  if (hasMessage(error)) {
    return error.message;
  }
  
  if (isStringLike(error)) {
    return error;
  }
  
  // Fallback for any other type
  try {
    return String(error);
  } catch {
    return 'An unknown error occurred';
  }
}

/**
 * Safely extract error code from unknown error
 */
export function getErrorCode(error: unknown): string | number | undefined {
  if (hasCode(error)) {
    return error.code;
  }
  
  // Check for common HTTP error patterns
  if (isError(error) && 'status' in error) {
    return (error as any).status;
  }
  
  return undefined;
}

/**
 * Convert unknown error to standardized AppError format
 */
export function toAppError(error: unknown, defaultMessage = 'An unexpected error occurred'): AppError {
  const message = getErrorMessage(error) || defaultMessage;
  const code = getErrorCode(error);
  
  return {
    message,
    code,
    cause: error,
    stack: isError(error) ? error.stack : undefined,
  };
}

/**
 * Safe error formatter for user-facing messages
 * Sanitizes error messages and provides fallbacks
 */
export function formatUserError(error: unknown, fallbackMessage = 'Something went wrong'): string {
  const message = getErrorMessage(error);
  
  // Don't expose internal error details to users
  if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
    return 'Connection error. Please try again later.';
  }
  
  if (message.includes('timeout') || message.includes('TIMEOUT')) {
    return 'Request timed out. Please try again.';
  }
  
  if (message.includes('unauthorized') || message.includes('UNAUTHORIZED')) {
    return 'Authentication required. Please sign in again.';
  }
  
  if (message.includes('forbidden') || message.includes('FORBIDDEN')) {
    return 'Access denied. You do not have permission for this action.';
  }
  
  // Return sanitized message or fallback
  return message.length > 0 && message.length < 200 ? message : fallbackMessage;
}

/**
 * Safe error logger that handles unknown error types
 */
export function logError(error: unknown, context?: string): void {
  const appError = toAppError(error);
  const logContext = context ? `[${context}]` : '';
  
  console.error(`${logContext} Error:`, {
    message: appError.message,
    code: appError.code,
    stack: appError.stack,
    cause: appError.cause,
  });
}

/**
 * Create error handler for catch blocks
 * Returns a function that can be used in catch blocks for consistent error handling
 */
export function createErrorHandler(context: string, fallbackMessage?: string) {
  return (error: unknown): AppError => {
    const appError = toAppError(error, fallbackMessage);
    logError(appError, context);
    return appError;
  };
}

/**
 * Utility for rethrowing errors with additional context
 */
export function wrapError(error: unknown, context: string, additionalInfo?: Record<string, any>): Error {
  const message = getErrorMessage(error);
  const wrappedMessage = `${context}: ${message}`;
  
  const wrappedError = new Error(wrappedMessage);
  wrappedError.cause = error;
  
  if (additionalInfo) {
    Object.assign(wrappedError, additionalInfo);
  }
  
  return wrappedError;
}

/**
 * Type guard for checking if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('timeout')
  );
}

/**
 * Type guard for checking if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const code = getErrorCode(error);
  
  return (
    message.includes('unauthorized') ||
    message.includes('unauthenticated') ||
    message.includes('invalid token') ||
    message.includes('expired token') ||
    code === 401 ||
    code === '401'
  );
}

/**
 * Type guard for checking if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  const code = getErrorCode(error);
  
  return (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('must be') ||
    code === 400 ||
    code === '400'
  );
}