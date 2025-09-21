import crypto from 'crypto';
import { EventEmitter } from 'events';

export interface WebhookConfig {
  secret: string;
  endpoint: string;
  enableSignatureVerification: boolean;
  enableEventFiltering: boolean;
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
}

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: string;
  organization: string;
  data: any;
  signature?: string;
  retryCount?: number;
}

export type WebhookEventType =
  | 'model.updated'
  | 'model.created'
  | 'model.deleted'
  | 'deployment.started'
  | 'deployment.completed'
  | 'deployment.failed'
  | 'quota.warning'
  | 'quota.exceeded'
  | 'rate_limit.exceeded'
  | 'error.occurred';

export interface WebhookHandler {
  eventType: WebhookEventType | 'all';
  handler: (event: WebhookEvent) => Promise<void> | void;
  organization?: string;
  priority?: number;
}

export interface WebhookSubscription {
  id: string;
  organization: string;
  eventTypes: WebhookEventType[];
  endpoint: string;
  secret: string;
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  failureCount: number;
}

export interface WebhookStats {
  totalEvents: number;
  eventsByType: Record<WebhookEventType, number>;
  eventsByOrganization: Record<string, number>;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageProcessingTime: number;
  lastEventTime?: Date;
}

// Default configuration
const DEFAULT_CONFIG: WebhookConfig = {
  secret: process.env.HUGGINGFACE_WEBHOOK_SECRET || 'default-secret',
  endpoint: '/api/webhooks/huggingface',
  enableSignatureVerification: true,
  enableEventFiltering: true,
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 10000,
};

export class HuggingFaceWebhookService extends EventEmitter {
  private config: WebhookConfig;
  private handlers: Map<string, WebhookHandler[]> = new Map();
  private subscriptions: Map<string, WebhookSubscription> = new Map();
  private stats: WebhookStats;
  private enableLogging: boolean;
  private processingTimes: number[] = [];

  constructor(
    config: Partial<WebhookConfig> = {},
    enableLogging = process.env.NODE_ENV === 'development'
  ) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.enableLogging = enableLogging;

    this.stats = {
      totalEvents: 0,
      eventsByType: {} as Record<WebhookEventType, number>,
      eventsByOrganization: {},
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageProcessingTime: 0,
    };

    // Initialize event type counters
    this.initializeEventTypeCounters();

    this.log('WEBHOOK_SERVICE_INITIALIZED', {
      endpoint: this.config.endpoint,
      signatureVerification: this.config.enableSignatureVerification,
      eventFiltering: this.config.enableEventFiltering,
    });
  }

  private initializeEventTypeCounters(): void {
    const eventTypes: WebhookEventType[] = [
      'model.updated',
      'model.created',
      'model.deleted',
      'deployment.started',
      'deployment.completed',
      'deployment.failed',
      'quota.warning',
      'quota.exceeded',
      'rate_limit.exceeded',
      'error.occurred',
    ];

    eventTypes.forEach(type => {
      this.stats.eventsByType[type] = 0;
    });
  }

  private log(level: string, data: any): void {
    if (!this.enableLogging) return;

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] HF_WEBHOOK_${level}:`, JSON.stringify(data, null, 2));
  }

  public registerHandler(handler: WebhookHandler): string {
    const handlerId = crypto.randomUUID();
    const eventType = handler.eventType;

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    // Sort handlers by priority (higher priority first)
    const handlers = this.handlers.get(eventType)!;
    const insertIndex = handlers.findIndex(h => (h.priority || 0) < (handler.priority || 0));

    if (insertIndex >= 0) {
      handlers.splice(insertIndex, 0, { ...handler });
    } else {
      handlers.push({ ...handler });
    }

    this.log('HANDLER_REGISTERED', {
      handlerId,
      eventType,
      organization: handler.organization,
      priority: handler.priority,
      totalHandlers: handlers.length,
    });

    return handlerId;
  }

  public unregisterHandler(handlerId: string): boolean {
    for (const [eventType, handlers] of this.handlers) {
      const index = handlers.findIndex(h => h === handlers.find(h => h.toString().includes(handlerId)));
      if (index >= 0) {
        handlers.splice(index, 1);
        this.log('HANDLER_UNREGISTERED', { handlerId, eventType });
        return true;
      }
    }
    return false;
  }

  public createSubscription(
    organization: string,
    eventTypes: WebhookEventType[],
    endpoint: string,
    secret?: string
  ): WebhookSubscription {
    const subscription: WebhookSubscription = {
      id: crypto.randomUUID(),
      organization,
      eventTypes,
      endpoint,
      secret: secret || this.generateSecret(),
      isActive: true,
      createdAt: new Date(),
      failureCount: 0,
    };

    this.subscriptions.set(subscription.id, subscription);

    this.log('SUBSCRIPTION_CREATED', {
      subscriptionId: subscription.id,
      organization,
      eventTypes,
      endpoint,
    });

    return subscription;
  }

  public removeSubscription(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.subscriptions.delete(subscriptionId);
      this.log('SUBSCRIPTION_REMOVED', { subscriptionId, organization: subscription.organization });
      return true;
    }
    return false;
  }

  public async processWebhook(
    payload: string,
    signature?: string,
    headers: Record<string, string> = {}
  ): Promise<{ success: boolean; message: string; eventsProcessed: number }> {
    const startTime = Date.now();

    try {
      // Verify signature if enabled
      if (this.config.enableSignatureVerification && signature) {
        if (!this.verifySignature(payload, signature)) {
          this.log('WEBHOOK_SIGNATURE_INVALID', { signature });
          return { success: false, message: 'Invalid signature', eventsProcessed: 0 };
        }
      }

      // Parse webhook payload
      const webhookData = JSON.parse(payload);
      const events = Array.isArray(webhookData) ? webhookData : [webhookData];

      let processedCount = 0;

      // Process each event
      for (const eventData of events) {
        const event = this.createWebhookEvent(eventData, headers);
        await this.processEvent(event);
        processedCount++;
      }

      // Update stats
      const processingTime = Date.now() - startTime;
      this.updateProcessingStats(processingTime);

      this.log('WEBHOOK_PROCESSED', {
        eventsProcessed: processedCount,
        processingTime,
      });

      return {
        success: true,
        message: `Processed ${processedCount} events`,
        eventsProcessed: processedCount,
      };
    } catch (error) {
      this.stats.failedDeliveries++;
      this.log('WEBHOOK_PROCESSING_ERROR', { error: (error as Error).message });

      return {
        success: false,
        message: (error as Error).message,
        eventsProcessed: 0,
      };
    }
  }

  private createWebhookEvent(eventData: any, headers: Record<string, string>): WebhookEvent {
    return {
      id: eventData.id || crypto.randomUUID(),
      type: eventData.type || 'model.updated',
      timestamp: eventData.timestamp || new Date().toISOString(),
      organization: eventData.organization || headers['x-organization'] || 'unknown',
      data: eventData.data || eventData,
      signature: headers['x-hub-signature-256'],
      retryCount: 0,
    };
  }

  private async processEvent(event: WebhookEvent): Promise<void> {
    this.stats.totalEvents++;
    this.stats.eventsByType[event.type] = (this.stats.eventsByType[event.type] || 0) + 1;
    this.stats.eventsByOrganization[event.organization] =
      (this.stats.eventsByOrganization[event.organization] || 0) + 1;
    this.stats.lastEventTime = new Date();

    this.log('EVENT_PROCESSING', {
      eventId: event.id,
      type: event.type,
      organization: event.organization,
    });

    // Process handlers for specific event type
    await this.executeHandlers(event.type, event);

    // Process handlers for all events
    await this.executeHandlers('all', event);

    // Emit event for external listeners
    this.emit('webhook.event', event);
    this.emit(`webhook.${event.type}`, event);

    // Handle specific event types
    await this.handleSpecificEventTypes(event);

    this.stats.successfulDeliveries++;
  }

  private async executeHandlers(eventType: string, event: WebhookEvent): Promise<void> {
    const handlers = this.handlers.get(eventType) || [];

    for (const handler of handlers) {
      try {
        // Check organization filter
        if (handler.organization && handler.organization !== event.organization) {
          continue;
        }

        await this.executeHandlerWithRetry(handler, event);
      } catch (error) {
        this.log('HANDLER_EXECUTION_ERROR', {
          eventType,
          eventId: event.id,
          error: (error as Error).message,
        });
      }
    }
  }

  private async executeHandlerWithRetry(handler: WebhookHandler, event: WebhookEvent): Promise<void> {
    const maxAttempts = this.config.retryAttempts + 1;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await Promise.race([
          handler.handler(event),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Handler timeout')), this.config.timeout)
          ),
        ]);

        // Success - break out of retry loop
        return;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts - 1) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));

          this.log('HANDLER_RETRY', {
            eventId: event.id,
            attempt: attempt + 1,
            maxAttempts,
            delay,
            error: lastError.message,
          });
        }
      }
    }

    // All attempts failed
    throw lastError;
  }

  private async handleSpecificEventTypes(event: WebhookEvent): Promise<void> {
    switch (event.type) {
      case 'model.updated':
      case 'model.created':
        // Invalidate model cache
        this.emit('cache.invalidate', {
          tags: ['models', event.organization],
          organization: event.organization,
        });
        break;

      case 'quota.warning':
      case 'quota.exceeded':
        // Emit quota alerts
        this.emit('quota.alert', {
          organization: event.organization,
          level: event.type === 'quota.exceeded' ? 'critical' : 'warning',
          data: event.data,
        });
        break;

      case 'rate_limit.exceeded':
        // Update rate limiter
        this.emit('rate_limit.update', {
          organization: event.organization,
          rateLimitInfo: event.data,
        });
        break;

      case 'deployment.failed':
        // Log deployment failure
        this.emit('deployment.alert', {
          organization: event.organization,
          level: 'error',
          data: event.data,
        });
        break;
    }
  }

  public verifySignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = this.generateSignature(payload);
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      this.log('SIGNATURE_VERIFICATION_ERROR', { error: (error as Error).message });
      return false;
    }
  }

  public generateSignature(payload: string, secret?: string): string {
    const webhookSecret = secret || this.config.secret;
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private updateProcessingStats(processingTime: number): void {
    this.processingTimes.push(processingTime);

    // Keep only last 100 processing times for average calculation
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }

    this.stats.averageProcessingTime =
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
  }

  public async sendWebhook(
    subscription: WebhookSubscription,
    event: WebhookEvent
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const payload = JSON.stringify(event);
      const signature = this.generateSignature(payload, subscription.secret);

      const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': signature,
          'X-Webhook-ID': event.id,
          'X-Organization': event.organization,
          'User-Agent': 'HuggingFace-Webhook/1.0',
        },
        body: payload,
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Update subscription stats
      subscription.lastTriggered = new Date();
      subscription.failureCount = 0;

      this.log('WEBHOOK_SENT', {
        subscriptionId: subscription.id,
        endpoint: subscription.endpoint,
        eventId: event.id,
        status: response.status,
      });

      return { success: true };
    } catch (error) {
      subscription.failureCount++;

      // Deactivate subscription after too many failures
      if (subscription.failureCount >= 10) {
        subscription.isActive = false;
        this.log('SUBSCRIPTION_DEACTIVATED', {
          subscriptionId: subscription.id,
          failureCount: subscription.failureCount,
        });
      }

      this.log('WEBHOOK_SEND_ERROR', {
        subscriptionId: subscription.id,
        endpoint: subscription.endpoint,
        eventId: event.id,
        error: (error as Error).message,
        failureCount: subscription.failureCount,
      });

      return { success: false, error: (error as Error).message };
    }
  }

  public getStats(): WebhookStats {
    return { ...this.stats };
  }

  public getSubscriptions(organization?: string): WebhookSubscription[] {
    const subscriptions = Array.from(this.subscriptions.values());
    return organization
      ? subscriptions.filter(sub => sub.organization === organization)
      : subscriptions;
  }

  public getActiveSubscriptions(organization?: string): WebhookSubscription[] {
    return this.getSubscriptions(organization).filter(sub => sub.isActive);
  }

  public resetStats(): void {
    this.stats = {
      totalEvents: 0,
      eventsByType: {} as Record<WebhookEventType, number>,
      eventsByOrganization: {},
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageProcessingTime: 0,
    };

    this.initializeEventTypeCounters();
    this.processingTimes = [];

    this.log('STATS_RESET', {});
  }

  public updateConfig(newConfig: Partial<WebhookConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('CONFIG_UPDATED', { newConfig: this.config });
  }

  // Convenience methods for common webhook scenarios
  public onModelUpdate(handler: (event: WebhookEvent) => Promise<void> | void, organization?: string): string {
    return this.registerHandler({
      eventType: 'model.updated',
      handler,
      organization,
      priority: 5,
    });
  }

  public onDeploymentStatus(handler: (event: WebhookEvent) => Promise<void> | void, organization?: string): string {
    return this.registerHandler({
      eventType: 'deployment.completed',
      handler,
      organization,
      priority: 5,
    });
  }

  public onQuotaAlert(handler: (event: WebhookEvent) => Promise<void> | void, organization?: string): string {
    return this.registerHandler({
      eventType: 'quota.warning',
      handler,
      organization,
      priority: 10,
    });
  }

  public onRateLimit(handler: (event: WebhookEvent) => Promise<void> | void, organization?: string): string {
    return this.registerHandler({
      eventType: 'rate_limit.exceeded',
      handler,
      organization,
      priority: 8,
    });
  }
}

// Export a default instance
export default new HuggingFaceWebhookService();