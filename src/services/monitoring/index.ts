/**
 * Monitoring Services Initialization
 * Central initialization point for all monitoring services
 * Ensures proper startup order and error handling
 */

import { prometheusService } from './prometheus.service';
import { loggingService, LogLevel } from './logging.service';
import { tracingService } from './tracing.service';
import { monitoringIntegration } from './integration.service';

// Monitoring configuration
export interface MonitoringConfig {
  enablePrometheus?: boolean;
  enableTracing?: boolean;
  enableIntegration?: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  development?: boolean;
}

// Default configuration
const DEFAULT_CONFIG: Required<MonitoringConfig> = {
  enablePrometheus: true,
  enableTracing: true,
  enableIntegration: true,
  logLevel: 'info',
  development: process.env.NODE_ENV === 'development',
};

/**
 * Monitoring initialization service
 */
export class MonitoringInitializer {
  private static instance: MonitoringInitializer;
  private isInitialized = false;
  private config: Required<MonitoringConfig>;

  private constructor(config: MonitoringConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public static getInstance(config?: MonitoringConfig): MonitoringInitializer {
    if (!MonitoringInitializer.instance) {
      MonitoringInitializer.instance = new MonitoringInitializer(config);
    }
    return MonitoringInitializer.instance;
  }

  /**
   * Initialize all monitoring services
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      loggingService.warn('Monitoring services already initialized');
      return;
    }

    try {
      loggingService.info('Starting monitoring services initialization', {
        config: this.config,
      });

      // Step 1: Configure logging level
      loggingService.setLogLevel(this.config.logLevel as LogLevel);
      loggingService.info('Logging service configured', {
        level: this.config.logLevel,
      });

      // Step 2: Initialize tracing if enabled
      if (this.config.enableTracing) {
        tracingService.start();
        loggingService.info('Tracing service started', {
          ready: tracingService.isReady(),
        });
      }

      // Step 3: Verify Prometheus service is ready
      if (this.config.enablePrometheus) {
        const prometheusReady = prometheusService.isReady();
        loggingService.info('Prometheus service status', {
          ready: prometheusReady,
        });

        if (!prometheusReady) {
          throw new Error('Prometheus service failed to initialize');
        }
      }

      // Step 4: Start monitoring integration
      if (this.config.enableIntegration) {
        await monitoringIntegration.start();
        loggingService.info('Monitoring integration started', {
          active: monitoringIntegration.isActive(),
        });
      }

      // Step 5: Set up process handlers for graceful shutdown
      this.setupProcessHandlers();

      this.isInitialized = true;

      loggingService.info('All monitoring services initialized successfully', {
        prometheus: this.config.enablePrometheus && prometheusService.isReady(),
        tracing: this.config.enableTracing && tracingService.isReady(),
        integration: this.config.enableIntegration && monitoringIntegration.isActive(),
      });

      // Record initialization metrics
      if (this.config.enablePrometheus) {
        prometheusService.recordOrganizationActivity('shared', 'monitoring_initialized');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      loggingService.error('Failed to initialize monitoring services', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        config: this.config,
      });

      throw new Error(`Monitoring initialization failed: ${errorMessage}`);
    }
  }

  /**
   * Shutdown all monitoring services gracefully
   */
  public async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      loggingService.warn('Monitoring services not initialized, skipping shutdown');
      return;
    }

    try {
      loggingService.info('Starting monitoring services shutdown');

      // Record shutdown metrics before stopping services
      if (this.config.enablePrometheus && prometheusService.isReady()) {
        prometheusService.recordOrganizationActivity('shared', 'monitoring_shutdown');
      }

      // Stop services in reverse order
      if (this.config.enableIntegration && monitoringIntegration.isActive()) {
        await monitoringIntegration.stop();
        loggingService.info('Monitoring integration stopped');
      }

      if (this.config.enableTracing && tracingService.isReady()) {
        await tracingService.shutdown();
        loggingService.info('Tracing service stopped');
      }

      // Flush logs last
      await loggingService.flush();

      this.isInitialized = false;

      console.log('All monitoring services shutdown successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to shutdown monitoring services:', errorMessage);
    }
  }

  /**
   * Get initialization status
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current configuration
   */
  public getConfig(): Required<MonitoringConfig> {
    return { ...this.config };
  }

  /**
   * Health check for all monitoring services
   */
  public healthCheck(): {
    overall: boolean;
    services: {
      prometheus: boolean;
      logging: boolean;
      tracing: boolean;
      integration: boolean;
    };
  } {
    const services = {
      prometheus: this.config.enablePrometheus && prometheusService.isReady(),
      logging: true, // Logging is always available once initialized
      tracing: this.config.enableTracing && tracingService.isReady(),
      integration: this.config.enableIntegration && monitoringIntegration.isActive(),
    };

    const overall = Object.values(services).every(service => service);

    return {
      overall,
      services,
    };
  }

  /**
   * Update configuration at runtime (limited updates)
   */
  public updateConfig(updates: Partial<MonitoringConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates };

    // Apply updates that can be changed at runtime
    if (updates.logLevel && updates.logLevel !== oldConfig.logLevel) {
      loggingService.setLogLevel(updates.logLevel as LogLevel);
      loggingService.info('Log level updated', {
        from: oldConfig.logLevel,
        to: updates.logLevel,
      });
    }

    loggingService.info('Monitoring configuration updated', {
      oldConfig,
      newConfig: this.config,
      updates,
    });
  }

  /**
   * Set up process handlers for graceful shutdown
   */
  private setupProcessHandlers(): void {
    const handleShutdown = async (signal: string) => {
      loggingService.info(`Received ${signal}, starting graceful shutdown`);

      try {
        await this.shutdown();
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle graceful shutdown signals
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      loggingService.error('Uncaught exception', {
        error: error.message,
        stack: error.stack,
      });

      // Give time for logging to flush
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      loggingService.error('Unhandled promise rejection', {
        error: reason instanceof Error ? reason : new Error(String(reason)),
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: String(promise),
      });
    });

    loggingService.info('Process handlers configured for graceful shutdown');
  }
}

// Export convenience functions
export const initializeMonitoring = async (config?: MonitoringConfig): Promise<void> => {
  const initializer = MonitoringInitializer.getInstance(config);
  await initializer.initialize();
};

export const shutdownMonitoring = async (): Promise<void> => {
  const initializer = MonitoringInitializer.getInstance();
  await initializer.shutdown();
};

export const getMonitoringHealth = () => {
  const initializer = MonitoringInitializer.getInstance();
  return initializer.healthCheck();
};

// Export services for direct access
export {
  prometheusService,
  loggingService,
  tracingService,
  monitoringIntegration,
};

// Export types
export * from './prometheus.service';
export * from './logging.service';
export * from './tracing.service';
export * from './integration.service';