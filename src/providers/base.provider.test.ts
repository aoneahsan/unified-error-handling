import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseProvider } from './base.provider';
import {
  ErrorLevel,
  ErrorProviderType,
  NormalizedError,
  ProviderCapabilities,
  ProviderConfig,
  ProviderFeature,
  UserContext,
  Breadcrumb,
} from '@/types';

// Mock implementation for testing
class MockProvider extends BaseProvider {
  readonly name = 'MockProvider';
  readonly version = '1.0.0';

  protected async initializeProvider(config: ProviderConfig): Promise<void> {
    // Mock implementation
  }

  protected async sendError(error: NormalizedError): Promise<void> {
    // Mock implementation
  }

  protected async updateUserContext(user: UserContext | null): Promise<void> {
    // Mock implementation
  }

  protected async updateCustomContext(key: string, context: any): Promise<void> {
    // Mock implementation
  }

  protected async updateBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    // Mock implementation
  }

  protected async updateTags(tags: Record<string, string>): Promise<void> {
    // Mock implementation
  }

  protected async updateExtraData(key: string, value: any): Promise<void> {
    // Mock implementation
  }

  protected async clearProviderBreadcrumbs(): Promise<void> {
    // Mock implementation
  }

  protected async destroyProvider(): Promise<void> {
    // Mock implementation
  }

  async flush(timeout?: number): Promise<boolean> {
    return true;
  }

  supportsFeature(feature: ProviderFeature): boolean {
    return true;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      features: [ProviderFeature.BREADCRUMBS, ProviderFeature.USER_CONTEXT],
      maxBreadcrumbs: 100,
      maxContextSize: 1000,
      maxTags: 50,
      supportsOffline: true,
      supportsBatching: true,
      platforms: {
        ios: true,
        android: true,
        web: true,
      },
    };
  }
}

describe('BaseProvider', () => {
  let provider: MockProvider;
  let config: ProviderConfig;

  beforeEach(() => {
    provider = new MockProvider();
    config = {
      provider: ErrorProviderType.SENTRY,
      apiKey: 'test-key',
      debug: true,
      environment: 'test',
      tags: {
        version: '1.0.0',
        platform: 'test',
      },
      context: {
        testContext: 'value',
      },
    };
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await provider.initialize(config);
      expect(provider.isInitialized).toBe(true);
    });

    it('should throw error if already initialized', async () => {
      await provider.initialize(config);
      await expect(provider.initialize(config)).rejects.toThrow(
        'MockProvider provider is already initialized'
      );
    });

    it('should apply tags from config', async () => {
      await provider.initialize(config);
      await provider.setTags({ custom: 'tag' });
      // Tags should include both config tags and custom tags
    });
  });

  describe('error logging', () => {
    beforeEach(async () => {
      await provider.initialize(config);
    });

    it('should log error when initialized', async () => {
      const error: NormalizedError = {
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      };

      const sendErrorSpy = vi.spyOn(provider as any, 'sendError');
      await provider.logError(error);

      expect(sendErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test error',
          name: 'TestError',
        })
      );
    });

    it('should throw error when not initialized', async () => {
      const uninitializedProvider = new MockProvider();
      const error: NormalizedError = {
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      };

      await expect(uninitializedProvider.logError(error)).rejects.toThrow(
        'MockProvider provider is not initialized'
      );
    });

    it('should not log error when disabled', async () => {
      (provider as any).state.enabled = false;
      const sendErrorSpy = vi.spyOn(provider as any, 'sendError');

      const error: NormalizedError = {
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      };

      await provider.logError(error);
      expect(sendErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('user context', () => {
    beforeEach(async () => {
      await provider.initialize(config);
    });

    it('should set user context', async () => {
      const user: UserContext = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
      };

      const updateUserSpy = vi.spyOn(provider as any, 'updateUserContext');
      await provider.setUser(user);

      expect(updateUserSpy).toHaveBeenCalledWith(user);
    });

    it('should clear user context', async () => {
      await provider.setUser({ id: '123' });
      await provider.setUser(null);

      const error: NormalizedError = {
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      };

      const sendErrorSpy = vi.spyOn(provider as any, 'sendError');
      await provider.logError(error);

      const sentError = sendErrorSpy.mock.calls[0][0];
      expect(sentError.user).toBeUndefined();
    });
  });

  describe('breadcrumbs', () => {
    beforeEach(async () => {
      await provider.initialize(config);
    });

    it('should add breadcrumb', async () => {
      const breadcrumb: Breadcrumb = {
        message: 'User clicked button',
        category: 'ui',
        level: ErrorLevel.INFO,
      };

      const updateBreadcrumbSpy = vi.spyOn(provider as any, 'updateBreadcrumb');
      await provider.addBreadcrumb(breadcrumb);

      expect(updateBreadcrumbSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User clicked button',
          timestamp: expect.any(Number),
        })
      );
    });

    it('should limit breadcrumbs to max count', async () => {
      // Set max breadcrumbs to 5
      config.maxBreadcrumbs = 5;
      await provider.destroy();
      await provider.initialize(config);

      // Add 10 breadcrumbs
      for (let i = 0; i < 10; i++) {
        await provider.addBreadcrumb({
          message: `Breadcrumb ${i}`,
        });
      }

      // Should only keep last 5
      expect((provider as any).breadcrumbs).toHaveLength(5);
      expect((provider as any).breadcrumbs[0].message).toBe('Breadcrumb 5');
    });

    it('should clear breadcrumbs', async () => {
      await provider.addBreadcrumb({ message: 'Test breadcrumb' });
      await provider.clearBreadcrumbs();

      expect((provider as any).breadcrumbs).toHaveLength(0);
    });
  });

  describe('tags and extras', () => {
    beforeEach(async () => {
      await provider.initialize(config);
    });

    it('should set tags', async () => {
      const tags = {
        module: 'auth',
        action: 'login',
      };

      const updateTagsSpy = vi.spyOn(provider as any, 'updateTags');
      await provider.setTags(tags);

      expect(updateTagsSpy).toHaveBeenCalledWith(tags);
    });

    it('should set extra data', async () => {
      const updateExtraSpy = vi.spyOn(provider as any, 'updateExtraData');
      await provider.setExtra('requestId', '12345');

      expect(updateExtraSpy).toHaveBeenCalledWith('requestId', '12345');
    });
  });

  describe('error filtering', () => {
    it('should filter errors by minimum level', async () => {
      config.minLevel = ErrorLevel.WARNING;
      await provider.initialize(config);

      const sendErrorSpy = vi.spyOn(provider as any, 'sendError');

      // Debug level should be filtered
      await provider.logError({
        message: 'Debug message',
        name: 'Debug',
        level: ErrorLevel.DEBUG,
        timestamp: Date.now(),
      });

      expect(sendErrorSpy).not.toHaveBeenCalled();

      // Error level should pass
      await provider.logError({
        message: 'Error message',
        name: 'Error',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      });

      expect(sendErrorSpy).toHaveBeenCalled();
    });

    it('should filter errors by ignore patterns', async () => {
      config.ignoreErrors = ['NetworkError', /timeout/i];
      await provider.initialize(config);

      const sendErrorSpy = vi.spyOn(provider as any, 'sendError');

      // Should filter NetworkError
      await provider.logError({
        message: 'Network failed',
        name: 'NetworkError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      });

      expect(sendErrorSpy).not.toHaveBeenCalled();

      // Should filter timeout messages
      await provider.logError({
        message: 'Request timeout exceeded',
        name: 'RequestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      });

      expect(sendErrorSpy).not.toHaveBeenCalled();

      // Should pass other errors
      await provider.logError({
        message: 'Other error',
        name: 'OtherError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      });

      expect(sendErrorSpy).toHaveBeenCalled();
    });

    it('should apply sample rate', async () => {
      config.sampleRate = 0.5;
      await provider.initialize(config);

      const sendErrorSpy = vi.spyOn(provider as any, 'sendError');
      const randomSpy = vi.spyOn(Math, 'random');

      // Should send when random < sampleRate
      randomSpy.mockReturnValue(0.3);
      await provider.logError({
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      });

      expect(sendErrorSpy).toHaveBeenCalledTimes(1);

      // Should not send when random >= sampleRate
      randomSpy.mockReturnValue(0.7);
      await provider.logError({
        message: 'Test error 2',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      });

      expect(sendErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    it('should clean up resources', async () => {
      await provider.initialize(config);
      await provider.setUser({ id: '123' });
      await provider.addBreadcrumb({ message: 'Test' });
      await provider.setTags({ test: 'tag' });

      await provider.destroy();

      expect(provider.isInitialized).toBe(false);
      expect((provider as any).breadcrumbs).toHaveLength(0);
      expect((provider as any).userContext).toBeNull();
      expect((provider as any).tags.size).toBe(0);
    });
  });
});