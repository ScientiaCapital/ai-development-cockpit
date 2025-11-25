/**
 * Centralized Logging Service with Winston
 * Provides structured logging with organization-specific contexts
 * Integrates with monitoring and alerting systems
 */

import winston from 'winston';
import { Organization } from './prometheus.service';

// Log levels and severity mapping
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  DEBUG = 'debug',
}

// Log context interface
export interface LogContext {
  organization?: Organization;
  userId?: string;
  requestId?: string;
  endpointId?: string;
  modelName?: string;
  operationId?: string;
  duration?: number;
  cost?: number;
  [key: string]: any;
}

// Error context for enhanced error tracking
export interface ErrorContext extends LogContext {
  error: Error | string;
  stack?: string;
  statusCode?: number;
  endpoint?: string;
  method?: string;
}

// Performance context for latency tracking
export interface PerformanceContext extends LogContext {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

/**
 * Centralized logging service with organization-specific formatting
 */
export class LoggingService {
  private static instance: LoggingService;
  private logger!: winston.Logger;
  private performanceLogger!: winston.Logger;
  private securityLogger!: winston.Logger;
  private businessLogger!: winston.Logger;

  private constructor() {
    this.initializeLoggers();
  }

  public static getInstance(): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService();
    }
    return LoggingService.instance;
  }

  /**
   * Initialize all logger instances with appropriate configurations
   */
  private initializeLoggers(): void {
    // Custom format with organization-specific styling
    const customFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, organization, ...meta }) => {
        const orgPrefix = this.getOrganizationPrefix(organization as Organization);
        return JSON.stringify({
          timestamp,
          level,
          message: `${orgPrefix}${message}`,
          organization: organization || 'shared',
          ...meta,
        });
      })
    );

    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, organization, ...meta }) => {
        const orgPrefix = this.getOrganizationPrefix(organization as Organization);
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}] ${orgPrefix}${message}${metaStr}`;
      })
    );

    // Main application logger
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: customFormat,
      defaultMeta: {
        service: 'dual-domain-llm-platform',
        version: process.env.npm_package_version || '0.1.0',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: [
        // Console output for development
        new winston.transports.Console({
          format: process.env.NODE_ENV === 'development' ? consoleFormat : customFormat,
        }),

        // File output for production
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),

        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 10485760, // 10MB
          maxFiles: 10,
        }),
      ],
    });

    // Performance-specific logger
    this.performanceLogger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { logType: 'performance' },
      transports: [
        new winston.transports.File({
          filename: 'logs/performance.log',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
      ],
    });

    // Security-specific logger
    this.securityLogger = winston.createLogger({
      level: 'warn',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { logType: 'security' },
      transports: [
        new winston.transports.File({
          filename: 'logs/security.log',
          maxsize: 10485760, // 10MB
          maxFiles: 10,
        }),
      ],
    });

    // Business metrics logger
    this.businessLogger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { logType: 'business' },
      transports: [
        new winston.transports.File({
          filename: 'logs/business.log',
          maxsize: 10485760, // 10MB
          maxFiles: 5,
        }),
      ],
    });

    // Create logs directory if it doesn't exist
    this.ensureLogsDirectory();
  }

  /**
   * Create logs directory if it doesn't exist
   */
  private ensureLogsDirectory(): void {
    const fs = require('fs');
    const path = require('path');

    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  /**
   * Get organization-specific prefix for log messages
   */
  private getOrganizationPrefix(organization?: Organization): string {
    switch (organization) {
      case 'arcade':
        return '[🚀 COCKPIT] ';
      case 'enterprise':
        return '[📊 SCIENTIA] ';
      default:
        return '[⚡ SHARED] ';
    }
  }

  /**
   * Log general information
   */
  public info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  /**
   * Log warnings
   */
  public warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }

  /**
   * Log errors with enhanced context
   */
  public error(message: string, errorContext?: ErrorContext): void {
    const context = errorContext ? {
      ...errorContext,
      stack: errorContext.error instanceof Error ? errorContext.error.stack : undefined,
      errorMessage: errorContext.error instanceof Error ? errorContext.error.message : errorContext.error,
    } : {};

    this.logger.error(message, context);
  }

  /**
   * Log debug information (only in development)
   */
  public debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }

  /**
   * Log HTTP requests
   */
  public http(message: string, context?: LogContext & {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    userAgent?: string;
    ip?: string;
  }): void {
    this.logger.http(message, context);
  }

  /**
   * Log performance metrics
   */
  public performance(context: PerformanceContext): void {
    this.performanceLogger.info('Performance metric recorded', {
      operation: context.operation,
      organization: context.organization || 'shared',
      duration: context.duration,
      success: context.success,
      startTime: new Date(context.startTime).toISOString(),
      endTime: new Date(context.endTime).toISOString(),
      ...context.metadata,
    });
  }

  /**
   * Log security events
   */
  public security(message: string, context: LogContext & {
    eventType: 'auth_failure' | 'rate_limit' | 'suspicious_activity' | 'access_denied' | 'data_breach';
    severity: 'low' | 'medium' | 'high' | 'critical';
    ip?: string;
    userAgent?: string;
    endpoint?: string;
  }): void {
    this.securityLogger.warn(message, {
      ...context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log business metrics and events
   */
  public business(message: string, context: LogContext & {
    eventType: 'user_signup' | 'model_inference' | 'payment' | 'feature_usage' | 'cost_optimization';
    value?: number;
    currency?: string;
    metadata?: Record<string, any>;
  }): void {
    this.businessLogger.info(message, {
      ...context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log model inference events with detailed context
   */
  public modelInference(context: LogContext & {
    modelName: string;
    inputTokens?: number;
    outputTokens?: number;
    cost: number;
    latency: number;
    success: boolean;
    errorCode?: string;
    provider: string;
  }): void {
    const message = `Model inference ${context.success ? 'completed' : 'failed'}`;

    this.info(message, {
      operation: 'model_inference',
      ...context,
    });

    // Also log to business logger for cost tracking
    if (context.success) {
      this.business(`Model inference revenue: $${context.cost}`, {
        eventType: 'model_inference',
        value: context.cost,
        currency: 'USD',
        organization: context.organization,
        metadata: {
          modelName: context.modelName,
          latency: context.latency,
          inputTokens: context.inputTokens,
          outputTokens: context.outputTokens,
          provider: context.provider,
        },
      });
    }
  }

  /**
   * Log deployment events
   */
  public deployment(message: string, context: LogContext & {
    endpointId: string;
    action: 'create' | 'update' | 'delete' | 'scale' | 'health_check';
    status: 'success' | 'failure' | 'pending';
    metadata?: Record<string, any>;
  }): void {
    this.info(message, {
      operation: 'deployment',
      ...context,
    });
  }

  /**
   * Create a child logger with persistent context
   */
  public child(persistentContext: LogContext): LoggingService {
    // Create a new instance with additional context
    const childService = Object.create(LoggingService.prototype);
    childService.logger = this.logger.child(persistentContext);
    childService.performanceLogger = this.performanceLogger.child(persistentContext);
    childService.securityLogger = this.securityLogger.child(persistentContext);
    childService.businessLogger = this.businessLogger.child(persistentContext);

    return childService;
  }

  /**
   * Flush all loggers (useful for testing and shutdown)
   */
  public async flush(): Promise<void> {
    const flushPromises = [
      this.flushLogger(this.logger),
      this.flushLogger(this.performanceLogger),
      this.flushLogger(this.securityLogger),
      this.flushLogger(this.businessLogger),
    ];

    await Promise.all(flushPromises);
  }

  /**
   * Flush a specific logger
   */
  private flushLogger(logger: winston.Logger): Promise<void> {
    return new Promise((resolve) => {
      logger.on('finish', resolve);
      logger.end();
    });
  }

  /**
   * Get logger instance for advanced usage
   */
  public getLogger(): winston.Logger {
    return this.logger;
  }

  /**
   * Update log level dynamically
   */
  public setLogLevel(level: LogLevel): void {
    this.logger.level = level;
  }
}

// Export singleton instance
export const loggingService = LoggingService.getInstance();
export default loggingService;