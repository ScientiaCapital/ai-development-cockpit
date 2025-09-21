/**
 * Error Handling Utilities for Test Suite
 * Provides consistent error handling patterns for test utilities
 */

/**
 * Safely extracts error message from unknown error types
 * @param error - Unknown error type from catch block
 * @returns Formatted error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error instanceof Error ? error.message : 'Unknown error');
  }

  return String(error);
}

/**
 * Safely extracts error stack trace from unknown error types
 * @param error - Unknown error type from catch block
 * @returns Stack trace string or error message if no stack available
 */
export function getErrorStack(error: unknown): string {
  if (error instanceof Error && error.stack) {
    return error.stack;
  }

  return getErrorMessage(error);
}

/**
 * Creates a standardized error object for test reporting
 * @param error - Unknown error type from catch block
 * @param context - Additional context information
 * @returns Standardized error object
 */
export function createTestError(error: unknown, context?: string): {
  message: string;
  stack: string;
  context?: string;
  timestamp: string;
} {
  return {
    message: getErrorMessage(error),
    stack: getErrorStack(error),
    context,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Type guard to check if error is an instance of Error
 * @param error - Unknown error type
 * @returns True if error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if error has a specific property
 * @param error - Unknown error type
 * @param property - Property name to check for
 * @returns True if error has the specified property
 */
export function hasErrorProperty(error: unknown, property: string): boolean {
  return error !== null &&
         typeof error === 'object' &&
         property in error;
}

/**
 * Safely logs error information with context
 * @param error - Unknown error type from catch block
 * @param context - Additional context for logging
 * @param logger - Optional logger function (defaults to console.error)
 */
export function logError(
  error: unknown,
  context?: string,
  logger: (message: string) => void = console.error
): void {
  const errorInfo = createTestError(error, context);

  const logMessage = [
    `Error${context ? ` in ${context}` : ''}:`,
    `Message: ${errorInfo.message}`,
    `Timestamp: ${errorInfo.timestamp}`,
    errorInfo.stack !== errorInfo.message ? `Stack: ${errorInfo.stack}` : null
  ].filter(Boolean).join('\n');

  logger(logMessage);
}

/**
 * Wrapper for async operations with standardized error handling
 * @param operation - Async operation to execute
 * @param context - Context information for error reporting
 * @param onError - Optional error handler function
 * @returns Result of operation or null if error occurred
 */
export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  context?: string,
  onError?: (error: unknown) => void
): Promise<T | null> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (onError) {
      onError(error);
    } else {
      logError(error, context);
    }
    return null;
  }
}

/**
 * Wrapper for synchronous operations with standardized error handling
 * @param operation - Synchronous operation to execute
 * @param context - Context information for error reporting
 * @param onError - Optional error handler function
 * @returns Result of operation or null if error occurred
 */
export function safeSyncOperation<T>(
  operation: () => T,
  context?: string,
  onError?: (error: unknown) => void
): T | null {
  try {
    return operation();
  } catch (error: unknown) {
    if (onError) {
      onError(error);
    } else {
      logError(error, context);
    }
    return null;
  }
}