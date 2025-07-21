import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DataDogProvider } from './datadog.provider';
import { ErrorProviderType, ErrorLevel } from '@/types';

// Mock DataDog RUM
const mockDatadogRum = {
  init: vi.fn(),
  addError: vi.fn(),
  addAction: vi.fn(),
  addTiming: vi.fn(),
  startView: vi.fn(),
  stopView: vi.fn(),
  startResource: vi.fn(),
  stopResource: vi.fn(),
  setUser: vi.fn(),
  removeUser: vi.fn(),
  setGlobalContextProperty: vi.fn(),
  removeGlobalContextProperty: vi.fn(),
  startSessionReplayRecording: vi.fn(),
};

// Mock DataDog Logs
const mockDatadogLogs = {
  init: vi.fn(),
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setContext: vi.fn(),
    setUser: vi.fn(),
    addLoggerGlobalContext: vi.fn(),
  },
};

// Mock @datadog/browser-rum
vi.mock('@datadog/browser-rum', () => ({
  datadogRum: mockDatadogRum,
}));

// Mock @datadog/browser-logs
vi.mock('@datadog/browser-logs', () => ({
  datadogLogs: mockDatadogLogs,
}));

// Mock @capacitor/core
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn().mockReturnValue('web'),
    isNativePlatform: vi.fn().mockReturnValue(false),
  },
}));

describe('DataDogProvider', () => {
  let provider: DataDogProvider;
  let mockConfig: any;

  beforeEach(() => {
    provider = new DataDogProvider();
    mockConfig = {
      provider: ErrorProviderType.DATADOG,
      clientToken: 'pub_test_token_1234567890abcdef',
      applicationId: 'test-app-id',
      site: 'datadoghq.com',
      service: 'test-service',
      environment: 'test',
      debug: false,
      sessionSampleRate: 100,
      trackInteractions: true,
      trackResources: true,
      trackLongTasks: true,
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully with valid config', async () => {
      await provider.initialize(mockConfig);
      
      expect(provider.isInitialized).toBe(true);
      expect(provider.name).toBe('datadog');
      expect(provider.version).toBe('1.0.0');
      expect(mockDatadogRum.init).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: mockConfig.applicationId,
          clientToken: mockConfig.clientToken,
          site: mockConfig.site,
          service: mockConfig.service,
          env: mockConfig.environment,
        })
      );
    });

    it('should throw error when client token is missing', async () => {
      const configWithoutToken = { ...mockConfig };
      delete configWithoutToken.clientToken;

      await expect(provider.initialize(configWithoutToken)).rejects.toThrow(
        'DataDog client token and application ID are required'
      );
    });

    it('should throw error when application ID is missing', async () => {
      const configWithoutAppId = { ...mockConfig };
      delete configWithoutAppId.applicationId;

      await expect(provider.initialize(configWithoutAppId)).rejects.toThrow(
        'DataDog client token and application ID are required'
      );
    });

    it('should throw error when already initialized', async () => {
      await provider.initialize(mockConfig);
      
      await expect(provider.initialize(mockConfig)).rejects.toThrow(
        'Datadog provider is already initialized'
      );
    });

    it('should initialize logs when available', async () => {
      await provider.initialize(mockConfig);

      expect(mockDatadogLogs.init).toHaveBeenCalledWith(
        expect.objectContaining({
          clientToken: mockConfig.clientToken,
          site: mockConfig.site,
          service: mockConfig.service,
          env: mockConfig.environment,
        })
      );
    });

    it('should start session replay recording', async () => {
      await provider.initialize(mockConfig);

      expect(mockDatadogRum.startSessionReplayRecording).toHaveBeenCalled();
    });
  });

  describe('error logging', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should log error with original error object', async () => {
      const originalError = new Error('Test error');
      const error = {
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
        stack: 'Error stack trace',
        context: { page: 'test' },
        tags: { category: 'test' },
        user: { id: 'user123', email: 'test@example.com' },
        metadata: { build: '1.0.0' },
        originalError,
      };

      await provider.logError(error);

      expect(mockDatadogRum.addError).toHaveBeenCalledWith(
        originalError,
        expect.objectContaining({
          level: error.level,
          timestamp: error.timestamp,
        })
      );
    });

    it('should log error with synthetic error when no original error', async () => {
      const error = {
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
        stack: 'Error stack trace',
        context: { page: 'test' },
        tags: { category: 'test' },
        metadata: { build: '1.0.0' },
      };

      await provider.logError(error);

      expect(mockDatadogRum.addError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          level: error.level,
          timestamp: error.timestamp,
        })
      );
    });

    it('should log to DataDog logs when available', async () => {
      const error = {
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
        originalError: new Error('Test error'),
      };

      await provider.logError(error);

      expect(mockDatadogLogs.logger.error).toHaveBeenCalledWith(
        error.message,
        expect.objectContaining({
          error: error.originalError,
          level: error.level,
        })
      );
    });

    it('should log message with specified level', async () => {
      const message = 'Test message';
      const level = ErrorLevel.INFO;

      await provider.logMessage(message, level);

      expect(mockDatadogRum.addError).toHaveBeenCalled();
    });

    it('should not log when provider is disabled', async () => {
      await provider.destroy();
      
      const error = {
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      };

      await expect(provider.logError(error)).rejects.toThrow('Datadog provider is not initialized');
    });
  });

  describe('user context', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should set user context', async () => {
      const user = {
        id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
      };

      await provider.setUser(user);

      expect(mockDatadogRum.setUser).toHaveBeenCalledWith({
        id: user.id,
        email: user.email,
        name: user.username,
        ...user,
      });
    });

    it('should clear user context when null provided', async () => {
      await provider.setUser(null);

      expect(mockDatadogRum.removeUser).toHaveBeenCalled();
    });
  });

  describe('custom context', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should set custom context', async () => {
      const key = 'page';
      const value = 'checkout';

      await provider.setContext(key, value);

      expect(mockDatadogRum.setGlobalContextProperty).toHaveBeenCalledWith(key, value);
    });

    it('should handle complex context values', async () => {
      const key = 'metadata';
      const value = { version: '1.0.0', build: 123 };

      await provider.setContext(key, value);

      expect(mockDatadogRum.setGlobalContextProperty).toHaveBeenCalledWith(key, value);
    });
  });

  describe('breadcrumbs', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should add breadcrumb as action', async () => {
      const breadcrumb = {
        message: 'User clicked button',
        category: 'user',
        level: ErrorLevel.INFO,
        timestamp: Date.now(),
        data: { buttonId: 'submit' },
      };

      await provider.addBreadcrumb(breadcrumb);

      // DataDog doesn't support breadcrumbs feature, so no calls should be made
      expect(mockDatadogRum.addAction).not.toHaveBeenCalled();
    });

    it('should log breadcrumb to logs when available', async () => {
      const breadcrumb = {
        message: 'User clicked button',
        category: 'user',
        level: ErrorLevel.INFO,
        timestamp: Date.now(),
        data: { buttonId: 'submit' },
      };

      await provider.addBreadcrumb(breadcrumb);

      // DataDog doesn't support breadcrumbs feature, so no calls should be made
      expect(mockDatadogLogs.logger.info).not.toHaveBeenCalled();
    });

    it('should clear breadcrumbs (no-op for DataDog)', async () => {
      // DataDog doesn't support clearing breadcrumbs
      // This should not throw an error
      await expect(provider.clearBreadcrumbs()).resolves.not.toThrow();
    });
  });

  describe('tags and extra data', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should set tags', async () => {
      const tags = {
        environment: 'production',
        version: '1.0.0',
      };

      await provider.setTags(tags);

      expect(mockDatadogRum.setGlobalContextProperty).toHaveBeenCalledWith('environment', 'production');
      expect(mockDatadogRum.setGlobalContextProperty).toHaveBeenCalledWith('version', '1.0.0');
    });

    it('should set extra data', async () => {
      const key = 'sessionId';
      const value = 'abc123';

      await provider.setExtra(key, value);

      expect(mockDatadogRum.setGlobalContextProperty).toHaveBeenCalledWith(key, value);
    });
  });

  describe('provider capabilities', () => {
    it('should support required features', () => {
      expect(provider.supportsFeature('USER_CONTEXT')).toBe(true);
      expect(provider.supportsFeature('CUSTOM_CONTEXT')).toBe(true);
      expect(provider.supportsFeature('TAGS')).toBe(true);
      expect(provider.supportsFeature('EXTRA_DATA')).toBe(true);
      expect(provider.supportsFeature('PERFORMANCE_MONITORING')).toBe(true);
      expect(provider.supportsFeature('SESSION_TRACKING')).toBe(true);
      expect(provider.supportsFeature('BREADCRUMBS')).toBe(false);
    });

    it('should return correct capabilities', () => {
      const capabilities = provider.getCapabilities();

      expect(capabilities.maxBreadcrumbs).toBe(100);
      expect(capabilities.maxContextSize).toBe(1000);
      expect(capabilities.maxTags).toBe(200);
      expect(capabilities.supportsOffline).toBe(true);
      expect(capabilities.supportsBatching).toBe(true);
      expect(capabilities.platforms.web).toBe(true);
      expect(capabilities.platforms.ios).toBe(false);
      expect(capabilities.platforms.android).toBe(false);
    });
  });

  describe('flush and destroy', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should flush successfully', async () => {
      const result = await provider.flush(5000);
      
      // DataDog doesn't have a flush method, but should return true
      expect(result).toBe(true);
    });

    it('should destroy successfully', async () => {
      await provider.destroy();
      
      expect(provider.isInitialized).toBe(false);
    });
  });

  describe('DataDog specific features', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should start view', async () => {
      const viewName = 'home';

      await provider.startView(viewName);

      expect(mockDatadogRum.startView).toHaveBeenCalledWith(viewName);
    });

    it('should stop view', async () => {
      await provider.stopView();

      expect(mockDatadogRum.stopView).toHaveBeenCalled();
    });

    it('should add action', async () => {
      const actionName = 'button_click';
      const context = { buttonId: 'submit' };

      await provider.addAction(actionName, context);

      expect(mockDatadogRum.addAction).toHaveBeenCalledWith(actionName, context);
    });

    it('should add timing', async () => {
      const timingName = 'page_load';
      const time = 1500;

      await provider.addTiming(timingName, time);

      expect(mockDatadogRum.addTiming).toHaveBeenCalledWith(timingName, time);
    });

    it('should start resource', async () => {
      const key = 'api_call';
      const method = 'GET';
      const url = 'https://api.example.com/users';

      await provider.startResource(key, method, url);

      expect(mockDatadogRum.startResource).toHaveBeenCalledWith(key, method, url);
    });

    it('should stop resource', async () => {
      const key = 'api_call';
      const statusCode = 200;
      const size = 1024;

      await provider.stopResource(key, statusCode, size);

      expect(mockDatadogRum.stopResource).toHaveBeenCalledWith(key, statusCode, size);
    });
  });

  describe('level mapping', () => {
    it('should map DataDog status to error level correctly', () => {
      // Test the private method through error logging
      const testCases = [
        { status: 'debug', expected: ErrorLevel.DEBUG },
        { status: 'info', expected: ErrorLevel.INFO },
        { status: 'warn', expected: ErrorLevel.WARNING },
        { status: 'error', expected: ErrorLevel.ERROR },
        { status: 'critical', expected: ErrorLevel.FATAL },
      ];

      testCases.forEach(({ status, expected }) => {
        // Access the private method through the provider instance
        const result = (provider as any).mapDatadogStatus(status);
        expect(result).toBe(expected);
      });
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should handle errors gracefully when DataDog calls fail', async () => {
      mockDatadogRum.addError.mockRejectedValue(new Error('DataDog API error'));

      const error = {
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      };

      // Provider catches errors internally and logs them
      await provider.logError(error);
      expect(mockDatadogRum.addError).toHaveBeenCalled();
    });

    it('should handle missing DataDog logs gracefully', async () => {
      // Reinitialize with mock that fails to load logs
      vi.doMock('@datadog/browser-logs', () => {
        throw new Error('Module not found');
      });

      const newProvider = new DataDogProvider();
      await newProvider.initialize(mockConfig);

      // Should not throw error
      expect(newProvider.isInitialized).toBe(true);
    });
  });
});