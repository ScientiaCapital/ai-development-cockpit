/**
 * OpenTelemetry Tracing Service
 * Provides distributed tracing for request flow tracking and performance analysis
 * Integrates with Prometheus metrics and logging services
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { FsInstrumentation } from '@opentelemetry/instrumentation-fs';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { Organization } from './prometheus.service';
import { loggingService } from './logging.service';

// Span context interface
export interface SpanContext {
  organization?: Organization;
  userId?: string;
  requestId?: string;
  endpointId?: string;
  modelName?: string;
  operationId?: string;
  metadata?: Record<string, any>;
}

// Custom span interface for type safety
export interface CustomSpan {
  setStatus(code: SpanStatusCode, message?: string): void;
  setAttributes(attributes: Record<string, string | number | boolean>): void;
  addEvent(name: string, attributes?: Record<string, any>): void;
  end(): void;
}

/**
 * OpenTelemetry tracing service for distributed request tracking
 */
export class TracingService {
  private static instance: TracingService;
  private sdk!: NodeSDK;
  private tracer: any;
  private isInitialized = false;

  private constructor() {
    try {
      this.initializeSDK();
    } catch (error) {
      console.warn('Failed to initialize OpenTelemetry SDK:', error instanceof Error ? error.message : 'Unknown error');
      // Continue without tracing - not critical for runtime
    }
  }

  public static getInstance(): TracingService {
    if (!TracingService.instance) {
      TracingService.instance = new TracingService();
    }
    return TracingService.instance;
  }

  /**
   * Initialize OpenTelemetry SDK with custom configuration
   */
  private initializeSDK(): void {
    // Create resource with service information
    const resource = resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: 'dual-domain-llm-platform',
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '0.1.0',
      [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'ai-development-cockpit',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    });

    // Configure SDK with instrumentations
    this.sdk = new NodeSDK({
      resource,
      instrumentations: [
        new HttpInstrumentation({
          // Filter requests to avoid noise
          ignoreIncomingRequestHook: (req) => {
            const url = req.url || '';
            // Ignore health checks and static assets
            return url.includes('/health') ||
                   url.includes('/_next/') ||
                   url.includes('/favicon.ico') ||
                   url.includes('/metrics');
          },

          // Add custom attributes to HTTP spans
          requestHook: (span, request) => {
            const organization = this.extractOrganizationFromRequest(request);
            const headers = 'headers' in request ? request.headers : {};
            span.setAttributes({
              'http.organization': organization,
              'http.user_agent': headers['user-agent'] || 'unknown',
              'http.real_ip': headers['x-real-ip'] || headers['x-forwarded-for'] || 'unknown',
            });
          },
        }),

        // File system instrumentation for debugging (simplified configuration)
        new FsInstrumentation(),
      ],
    });

    // Initialize tracer
    this.tracer = trace.getTracer('dual-domain-llm-platform', process.env.npm_package_version || '0.1.0');
    this.isInitialized = true;
  }

  /**
   * Start the OpenTelemetry SDK
   */
  public start(): void {
    try {
      this.sdk.start();
      loggingService.info('OpenTelemetry tracing started successfully');
    } catch (error) {
      loggingService.error('Failed to start OpenTelemetry tracing', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Shutdown the OpenTelemetry SDK
   */
  public async shutdown(): Promise<void> {
    try {
      await this.sdk.shutdown();
      loggingService.info('OpenTelemetry tracing shutdown successfully');
    } catch (error) {
      loggingService.error('Failed to shutdown OpenTelemetry tracing', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Create a new span for operation tracking
   */
  public startSpan(
    name: string,
    spanContext?: SpanContext,
    kind: SpanKind = SpanKind.INTERNAL
  ): CustomSpan {
    const span = this.tracer.startSpan(name, {
      kind,
      attributes: {
        'operation.organization': spanContext?.organization || 'shared',
        'operation.user_id': spanContext?.userId || 'anonymous',
        'operation.request_id': spanContext?.requestId || 'unknown',
        'operation.endpoint_id': spanContext?.endpointId || 'unknown',
        'operation.model_name': spanContext?.modelName || 'unknown',
        'operation.operation_id': spanContext?.operationId || 'unknown',
        ...spanContext?.metadata,
      },
    });

    return {
      setStatus: (code: SpanStatusCode, message?: string) => span.setStatus({ code, message }),
      setAttributes: (attributes: Record<string, string | number | boolean>) => span.setAttributes(attributes),
      addEvent: (name: string, attributes?: Record<string, any>) => span.addEvent(name, attributes),
      end: () => span.end(),
    };
  }

  /**
   * Trace HTTP requests with comprehensive context
   */
  public traceHttpRequest<T>(
    operationName: string,
    operation: () => Promise<T>,
    spanContext?: SpanContext
  ): Promise<T> {
    return this.traceOperation(operationName, operation, spanContext, SpanKind.CLIENT);
  }

  /**
   * Trace model inference operations
   */
  public traceModelInference<T>(
    modelName: string,
    operation: () => Promise<T>,
    spanContext?: SpanContext
  ): Promise<T> {
    const enhancedContext = {
      ...spanContext,
      modelName,
      operationId: `inference_${Date.now()}`,
    };

    return this.traceOperation(
      `model_inference_${modelName}`,
      operation,
      enhancedContext,
      SpanKind.CLIENT
    );
  }

  /**
   * Trace database operations
   */
  public traceDatabaseOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    spanContext?: SpanContext
  ): Promise<T> {
    return this.traceOperation(
      `db_${operationName}`,
      operation,
      spanContext,
      SpanKind.CLIENT
    );
  }

  /**
   * Trace external API calls
   */
  public traceExternalAPI<T>(
    apiName: string,
    operation: () => Promise<T>,
    spanContext?: SpanContext
  ): Promise<T> {
    return this.traceOperation(
      `external_api_${apiName}`,
      operation,
      spanContext,
      SpanKind.CLIENT
    );
  }

  /**
   * Generic operation tracing with error handling
   */
  public async traceOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    spanContext?: SpanContext,
    kind: SpanKind = SpanKind.INTERNAL
  ): Promise<T> {
    const span = this.startSpan(operationName, spanContext, kind);
    const startTime = Date.now();

    try {
      span.addEvent('operation_start', { timestamp: startTime });

      const result = await operation();

      const duration = Date.now() - startTime;
      span.setAttributes({
        'operation.success': true,
        'operation.duration_ms': duration,
      });

      span.addEvent('operation_complete', {
        timestamp: Date.now(),
        duration_ms: duration,
      });

      span.setStatus(SpanStatusCode.OK);

      // Log performance metrics
      loggingService.performance({
        operation: operationName,
        organization: spanContext?.organization,
        startTime,
        endTime: Date.now(),
        duration,
        success: true,
        metadata: spanContext?.metadata,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      span.setAttributes({
        'operation.success': false,
        'operation.duration_ms': duration,
        'operation.error': errorMessage,
      });

      span.addEvent('operation_error', {
        timestamp: Date.now(),
        error: errorMessage,
        duration_ms: duration,
      });

      span.setStatus(SpanStatusCode.ERROR, errorMessage);

      // Log error with tracing context
      loggingService.error(`Operation ${operationName} failed`, {
        error: error instanceof Error ? error : new Error(String(error)),
        organization: spanContext?.organization,
        operationId: spanContext?.operationId,
        duration,
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Add custom attributes to the current active span
   */
  public addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.setAttributes(attributes);
    }
  }

  /**
   * Add an event to the current active span
   */
  public addSpanEvent(name: string, attributes?: Record<string, any>): void {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.addEvent(name, attributes);
    }
  }

  /**
   * Get the current trace ID for correlation
   */
  public getCurrentTraceId(): string | undefined {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      return activeSpan.spanContext().traceId;
    }
    return undefined;
  }

  /**
   * Get the current span ID for correlation
   */
  public getCurrentSpanId(): string | undefined {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      return activeSpan.spanContext().spanId;
    }
    return undefined;
  }

  /**
   * Create a trace context for request correlation
   */
  public createTraceContext(spanContext?: SpanContext): Record<string, string> {
    const traceId = this.getCurrentTraceId();
    const spanId = this.getCurrentSpanId();

    return {
      traceId: traceId || 'unknown',
      spanId: spanId || 'unknown',
      organization: spanContext?.organization || 'shared',
      requestId: spanContext?.requestId || 'unknown',
    };
  }

  /**
   * Extract organization from HTTP request
   */
  private extractOrganizationFromRequest(request: any): Organization {
    const url = request.url || '';
    const userAgent = request.headers?.['user-agent'] || '';

    // Determine organization based on URL path or headers
    if (url.includes('/swaggystacks') || url.includes('/dev')) {
      return 'swaggystacks';
    }
    if (url.includes('/scientia') || url.includes('/corp')) {
      return 'scientia_capital';
    }

    // Check user agent for organization hints
    if (userAgent.includes('SwaggyStacks')) {
      return 'swaggystacks';
    }
    if (userAgent.includes('ScientiaCapital')) {
      return 'scientia_capital';
    }

    return 'shared';
  }

  /**
   * Check if tracing is properly initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get tracer instance for advanced usage
   */
  public getTracer(): any {
    return this.tracer;
  }
}

// Export singleton instance
export const tracingService = TracingService.getInstance();
export default tracingService;