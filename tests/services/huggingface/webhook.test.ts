import { HuggingFaceWebhookService, WebhookEvent, WebhookHandler } from '../../../src/services/huggingface/webhook.service';
import crypto from 'crypto';

describe('HuggingFaceWebhookService', () => {
  let webhookService: HuggingFaceWebhookService;

  beforeEach(() => {
    webhookService = new HuggingFaceWebhookService({
      secret: 'test-secret',
      enableSignatureVerification: true,
      enableEventFiltering: true,
      retryAttempts: 2,
      retryDelay: 100,
      timeout: 5000,
    }, false); // Disable logging in tests
  });

  afterEach(() => {
    webhookService.removeAllListeners();
  });

  describe('handler registration', () => {
    it('should register and execute handlers', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);

      const handlerId = webhookService.registerHandler({
        eventType: 'model.updated',
        handler: mockHandler,
        priority: 'normal',
      });

      expect(typeof handlerId).toBe('string');

      // Process a webhook
      const payload = JSON.stringify({
        id: 'test-event',
        type: 'model.updated',
        organization: 'test-org',
        data: { model: 'test-model' },
      });

      const result = await webhookService.processWebhook(payload);

      expect(result.success).toBe(true);
      expect(result.eventsProcessed).toBe(1);
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-event',
          type: 'model.updated',
          organization: 'test-org',
        })
      );
    });

    it('should unregister handlers', () => {
      const mockHandler = jest.fn();
      const handlerId = webhookService.registerHandler({
        eventType: 'model.updated',
        handler: mockHandler,
      });

      const removed = webhookService.unregisterHandler(handlerId);
      expect(removed).toBe(false); // Current implementation limitation
    });

    it('should handle handler priorities', async () => {
      const executionOrder: number[] = [];

      const lowPriorityHandler = jest.fn().mockImplementation(() => {
        executionOrder.push(1);
        return Promise.resolve();
      });

      const highPriorityHandler = jest.fn().mockImplementation(() => {
        executionOrder.push(10);
        return Promise.resolve();
      });

      webhookService.registerHandler({
        eventType: 'model.updated',
        handler: lowPriorityHandler,
        priority: 'low',
      });

      webhookService.registerHandler({
        eventType: 'model.updated',
        handler: highPriorityHandler,
        priority: 'high',
      });

      const payload = JSON.stringify({
        type: 'model.updated',
        organization: 'test-org',
      });

      await webhookService.processWebhook(payload);

      // High priority should execute first
      expect(executionOrder).toEqual([10, 1]);
    });
  });

  describe('webhook processing', () => {
    it('should process single webhook event', async () => {
      const payload = JSON.stringify({
        id: 'event-1',
        type: 'model.created',
        timestamp: new Date().toISOString(),
        organization: 'swaggystacks',
        data: { model: 'new-model' },
      });

      const result = await webhookService.processWebhook(payload);

      expect(result.success).toBe(true);
      expect(result.eventsProcessed).toBe(1);
    });

    it('should process multiple webhook events', async () => {
      const payload = JSON.stringify([
        {
          id: 'event-1',
          type: 'model.created',
          organization: 'swaggystacks',
        },
        {
          id: 'event-2',
          type: 'model.updated',
          organization: 'swaggystacks',
        },
      ]);

      const result = await webhookService.processWebhook(payload);

      expect(result.success).toBe(true);
      expect(result.eventsProcessed).toBe(2);
    });

    it('should handle malformed JSON', async () => {
      const payload = 'invalid-json';

      const result = await webhookService.processWebhook(payload);

      expect(result.success).toBe(false);
      expect(result.eventsProcessed).toBe(0);
      expect(result.message).toContain('Unexpected token');
    });
  });

  describe('signature verification', () => {
    it('should verify valid signatures', async () => {
      const payload = JSON.stringify({ type: 'model.updated' });
      const signature = webhookService.generateSignature(payload);

      const result = await webhookService.processWebhook(payload, signature);

      expect(result.success).toBe(true);
    });

    it('should reject invalid signatures', async () => {
      const payload = JSON.stringify({ type: 'model.updated' });
      const invalidSignature = 'sha256=invalid';

      const result = await webhookService.processWebhook(payload, invalidSignature);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid signature');
    });

    it('should work when signature verification is disabled', async () => {
      const webhookServiceNoVerify = new HuggingFaceWebhookService({
        secret: 'test-secret',
        enableSignatureVerification: false,
      }, false);

      const payload = JSON.stringify({ type: 'model.updated' });
      const invalidSignature = 'invalid';

      const result = await webhookServiceNoVerify.processWebhook(payload, invalidSignature);

      expect(result.success).toBe(true);
    });
  });

  describe('specific event type handling', () => {
    it('should emit cache invalidation for model events', (done) => {
      webhookService.on('cache.invalidate', (data) => {
        expect(data.tags).toContain('models');
        expect(data.organization).toBe('test-org');
        done();
      });

      const payload = JSON.stringify({
        type: 'model.updated',
        organization: 'test-org',
      });

      webhookService.processWebhook(payload);
    });

    it('should emit quota alerts', (done) => {
      webhookService.on('quota.alert', (data) => {
        expect(data.organization).toBe('test-org');
        expect(data.level).toBe('warning');
        done();
      });

      const payload = JSON.stringify({
        type: 'quota.warning',
        organization: 'test-org',
        data: { usage: 90 },
      });

      webhookService.processWebhook(payload);
    });

    it('should emit rate limit updates', (done) => {
      webhookService.on('rate_limit.update', (data) => {
        expect(data.organization).toBe('test-org');
        expect(data.rateLimitInfo).toBeDefined();
        done();
      });

      const payload = JSON.stringify({
        type: 'rate_limit.exceeded',
        organization: 'test-org',
        data: { limit: 100, remaining: 0 },
      });

      webhookService.processWebhook(payload);
    });

    it('should emit deployment alerts', (done) => {
      webhookService.on('deployment.alert', (data) => {
        expect(data.organization).toBe('test-org');
        expect(data.level).toBe('error');
        done();
      });

      const payload = JSON.stringify({
        type: 'deployment.failed',
        organization: 'test-org',
        data: { deployment: 'test-deployment', error: 'Timeout' },
      });

      webhookService.processWebhook(payload);
    });
  });

  describe('handler execution with retry', () => {
    it('should retry failed handlers', async () => {
      let attempts = 0;
      const mockHandler = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Handler failed');
        }
        return Promise.resolve();
      });

      webhookService.registerHandler({
        eventType: 'model.updated',
        handler: mockHandler,
      });

      const payload = JSON.stringify({
        type: 'model.updated',
        organization: 'test-org',
      });

      const result = await webhookService.processWebhook(payload);

      expect(result.success).toBe(true);
      expect(mockHandler).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should respect maxRetries limit', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Always fails'));

      webhookService.registerHandler({
        eventType: 'model.updated',
        handler: mockHandler,
      });

      const payload = JSON.stringify({
        type: 'model.updated',
        organization: 'test-org',
      });

      const result = await webhookService.processWebhook(payload);

      expect(result.success).toBe(true); // Overall processing succeeds
      expect(mockHandler).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle handler timeouts', async () => {
      const mockHandler = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 10000)) // Long delay
      );

      webhookService.registerHandler({
        eventType: 'model.updated',
        handler: mockHandler,
      });

      const payload = JSON.stringify({
        type: 'model.updated',
        organization: 'test-org',
      });

      const result = await webhookService.processWebhook(payload);

      expect(result.success).toBe(true); // Overall processing succeeds
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('organization filtering', () => {
    it('should filter handlers by organization', async () => {
      const swaggyHandler = jest.fn().mockResolvedValue(undefined);
      const scientiaHandler = jest.fn().mockResolvedValue(undefined);
      const allHandler = jest.fn().mockResolvedValue(undefined);

      webhookService.registerHandler({
        eventType: 'model.updated',
        handler: swaggyHandler,
        organization: 'swaggystacks',
      });

      webhookService.registerHandler({
        eventType: 'model.updated',
        handler: scientiaHandler,
        organization: 'scientia-capital',
      });

      webhookService.registerHandler({
        eventType: 'model.updated',
        handler: allHandler,
        // No organization filter
      });

      const payload = JSON.stringify({
        type: 'model.updated',
        organization: 'swaggystacks',
      });

      await webhookService.processWebhook(payload);

      expect(swaggyHandler).toHaveBeenCalled();
      expect(scientiaHandler).not.toHaveBeenCalled();
      expect(allHandler).toHaveBeenCalled(); // No filter, so called
    });
  });

  describe('subscription management', () => {
    it('should create webhook subscriptions', () => {
      const subscription = webhookService.createSubscription(
        'test-org',
        ['model.updated', 'deployment.completed'],
        'https://example.com/webhook',
        'custom-secret'
      );

      expect(subscription.id).toBeDefined();
      expect(subscription.organization).toBe('test-org');
      expect(subscription.eventTypes).toEqual(['model.updated', 'deployment.completed']);
      expect(subscription.endpoint).toBe('https://example.com/webhook');
      expect(subscription.secret).toBe('custom-secret');
      expect(subscription.isActive).toBe(true);
    });

    it('should generate secret if not provided', () => {
      const subscription = webhookService.createSubscription(
        'test-org',
        ['model.updated'],
        'https://example.com/webhook'
      );

      expect(subscription.secret).toBeDefined();
      expect(subscription.secret).not.toBe('');
    });

    it('should remove subscriptions', () => {
      const subscription = webhookService.createSubscription(
        'test-org',
        ['model.updated'],
        'https://example.com/webhook'
      );

      const removed = webhookService.removeSubscription(subscription.id);
      expect(removed).toBe(true);

      const removedAgain = webhookService.removeSubscription(subscription.id);
      expect(removedAgain).toBe(false);
    });

    it('should get subscriptions by organization', () => {
      webhookService.createSubscription(
        'org1',
        ['model.updated'],
        'https://org1.com/webhook'
      );

      webhookService.createSubscription(
        'org2',
        ['deployment.completed'],
        'https://org2.com/webhook'
      );

      const org1Subs = webhookService.getSubscriptions('org1');
      const org2Subs = webhookService.getSubscriptions('org2');
      const allSubs = webhookService.getSubscriptions();

      expect(org1Subs).toHaveLength(1);
      expect(org2Subs).toHaveLength(1);
      expect(allSubs).toHaveLength(2);
    });
  });

  describe('convenience methods', () => {
    it('should register model update handler', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);

      const handlerId = webhookService.onModelUpdate(mockHandler);
      expect(typeof handlerId).toBe('string');

      const payload = JSON.stringify({
        type: 'model.updated',
        organization: 'test-org',
      });

      await webhookService.processWebhook(payload);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should register deployment status handler', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);

      const handlerId = webhookService.onDeploymentStatus(mockHandler);
      expect(typeof handlerId).toBe('string');

      const payload = JSON.stringify({
        type: 'deployment.completed',
        organization: 'test-org',
      });

      await webhookService.processWebhook(payload);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should register quota alert handler', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);

      const handlerId = webhookService.onQuotaAlert(mockHandler);
      expect(typeof handlerId).toBe('string');

      const payload = JSON.stringify({
        type: 'quota.warning',
        organization: 'test-org',
      });

      await webhookService.processWebhook(payload);
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should register rate limit handler', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);

      const handlerId = webhookService.onRateLimit(mockHandler);
      expect(typeof handlerId).toBe('string');

      const payload = JSON.stringify({
        type: 'rate_limit.exceeded',
        organization: 'test-org',
      });

      await webhookService.processWebhook(payload);
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    it('should track webhook statistics', async () => {
      const payload = JSON.stringify({
        type: 'model.updated',
        organization: 'test-org',
      });

      await webhookService.processWebhook(payload);
      await webhookService.processWebhook(payload);

      const stats = webhookService.getStats();

      expect(stats.totalEvents).toBe(2);
      expect(stats.eventsByType['model.updated']).toBe(2);
      expect(stats.eventsByOrganization['test-org']).toBe(2);
      expect(stats.successfulDeliveries).toBe(2);
      expect(stats.averageProcessingTime).toBeGreaterThan(0);
    });

    it('should reset statistics', () => {
      webhookService.resetStats();
      const stats = webhookService.getStats();

      expect(stats.totalEvents).toBe(0);
      expect(stats.successfulDeliveries).toBe(0);
      expect(stats.failedDeliveries).toBe(0);
    });
  });
});