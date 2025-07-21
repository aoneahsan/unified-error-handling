import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SentryProvider } from './sentry.provider';
import { ErrorProviderType, ErrorLevel, ProviderFeature } from '@/types';

// Mock scope object
const mockScope = {
  setUser: vi.fn(),
  setTag: vi.fn(),
  setTags: vi.fn(),
  setContext: vi.fn(),
  setExtra: vi.fn(),
  setLevel: vi.fn(),
  addBreadcrumb: vi.fn(),
  clearBreadcrumbs: vi.fn(),
};

// Mock Sentry
const mockSentry = {
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setTags: vi.fn(),
  setContext: vi.fn(),
  setExtra: vi.fn(),
  addBreadcrumb: vi.fn(),
  clearBreadcrumbs: vi.fn(),
  configureScope: vi.fn(),
  withScope: vi.fn(),
  flush: vi.fn().mockResolvedValue(true),
  close: vi.fn(),
  getCurrentScope: vi.fn().mockReturnValue(mockScope),
  getGlobalScope: vi.fn(),
  getIsolationScope: vi.fn(),
  setCurrentClient: vi.fn(),
  getClient: vi.fn(),
  isInitialized: vi.fn().mockReturnValue(true),
  startTransaction: vi.fn(),
  Hub: vi.fn(),
  getCurrentHub: vi.fn(),
  Severity: {
    Fatal: 'fatal',
    Error: 'error',
    Warning: 'warning',
    Info: 'info',
    Debug: 'debug',
  },
  Integrations: {
    BrowserTracing: vi.fn(),
    Replay: vi.fn(),
  },
};

// Mock @sentry/browser
vi.mock('@sentry/browser', () => mockSentry);

// Mock @sentry/core
vi.mock('@sentry/core', () => ({
  flush: vi.fn().mockResolvedValue(true),
  close: vi.fn().mockResolvedValue(true),
  startTransaction: vi.fn(),
}));

// Mock @sentry/integrations
vi.mock('@sentry/integrations', () => ({
  RewriteFrames: vi.fn(),
  CaptureConsole: vi.fn(),
  HttpClient: vi.fn(),
}));

// Mock @capacitor/core
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn().mockReturnValue('web'),
    isNativePlatform: vi.fn().mockReturnValue(false),
  },
}));

describe('SentryProvider', () => {
  let provider: SentryProvider;
  let mockConfig: any;

  beforeEach(() => {
    provider = new SentryProvider();
    mockConfig = {
      provider: ErrorProviderType.SENTRY,
      dsn: 'https://abc123@o123456.ingest.sentry.io/123456',
      environment: 'test',
      debug: false,
      sampleRate: 1.0,
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
      maxBreadcrumbs: 100,
      attachStacktrace: true,
      autoSessionTracking: true,
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
      expect(provider.name).toBe('sentry');
      expect(provider.version).toBe('1.0.0');
      expect(mockSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: mockConfig.dsn,
          environment: mockConfig.environment,
          debug: mockConfig.debug,
        })
      );
    });

    it('should throw error when DSN is missing', async () => {
      const configWithoutDsn = { ...mockConfig };
      delete configWithoutDsn.dsn;

      await expect(provider.initialize(configWithoutDsn)).rejects.toThrow(
        'Sentry DSN or API key is required'
      );
    });

    it('should throw error when already initialized', async () => {
      await provider.initialize(mockConfig);
      
      await expect(provider.initialize(mockConfig)).rejects.toThrow(
        'Sentry provider is already initialized'
      );
    });

    it('should initialize with integrations', async () => {
      const configWithIntegrations = {
        ...mockConfig,
        enableAutoInstrumentation: true,
        enablePerformanceMonitoring: true,
      };

      await provider.initialize(configWithIntegrations);

      expect(mockSentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          integrations: expect.any(Array),
        })
      );
    });
  });

  describe('error logging', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should capture exception with all details', async () => {
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
        originalError: new Error('Original error'),
      };

      await provider.logError(error);

      expect(mockSentry.captureException).toHaveBeenCalledWith(error.originalError);
      expect(mockScope.setUser).toHaveBeenCalledWith(error.user);
      expect(mockScope.setTag).toHaveBeenCalledWith('category', 'test');
      expect(mockScope.setContext).toHaveBeenCalledWith('page', 'test');
      expect(mockScope.setExtra).toHaveBeenCalledWith('build', '1.0.0');
      expect(mockScope.setLevel).toHaveBeenCalledWith('error');
    });

    it('should capture message when no original error', async () => {
      const error = {
        message: 'Test message',
        name: 'TestMessage',
        level: ErrorLevel.WARNING,
        timestamp: Date.now(),
      };

      await provider.logError(error);

      expect(mockSentry.captureMessage).toHaveBeenCalledWith(
        error.message,
        'warning'
      );
    });

    it('should log message with specified level', async () => {
      const message = 'Test message';
      const level = ErrorLevel.INFO;

      await provider.logMessage(message, level);

      expect(mockSentry.captureMessage).toHaveBeenCalledWith(message, 'info');
    });

    it('should not log when provider is disabled', async () => {
      // Create a new provider instance for this test
      const disabledProvider = new SentryProvider();
      const disabledConfig = { ...mockConfig, enabled: false };
      await disabledProvider.initialize(disabledConfig);
      
      const error = {
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      };

      await disabledProvider.logError(error);

      expect(mockSentry.captureException).not.toHaveBeenCalled();
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

      expect(mockScope.setUser).toHaveBeenCalledWith(user);
    });

    it('should clear user context when null provided', async () => {
      await provider.setUser(null);

      expect(mockScope.setUser).toHaveBeenCalledWith(null);
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

      expect(mockScope.setContext).toHaveBeenCalledWith(key, value);
    });

    it('should handle complex context values', async () => {
      const key = 'metadata';
      const value = { version: '1.0.0', build: 123 };

      await provider.setContext(key, value);

      expect(mockScope.setContext).toHaveBeenCalledWith(key, value);
    });
  });

  describe('breadcrumbs', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should add breadcrumb', async () => {
      const breadcrumb = {
        message: 'User clicked button',
        category: 'user',
        level: ErrorLevel.INFO,
        timestamp: Date.now(),
        data: { buttonId: 'submit' },
      };

      await provider.addBreadcrumb(breadcrumb);

      expect(mockSentry.addBreadcrumb).toHaveBeenCalledWith({
        message: breadcrumb.message,
        category: breadcrumb.category,
        level: 'info',
        timestamp: breadcrumb.timestamp / 1000, // Sentry expects seconds
        data: breadcrumb.data,
      });
    });

    it('should clear breadcrumbs', async () => {
      await provider.clearBreadcrumbs();
      
      expect(mockScope.clearBreadcrumbs).toHaveBeenCalled();
    });
  });

  describe('tags and extra data', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should set tags', async () => {
      const tags = {
        environment: 'production',
        feature: 'checkout',
      };

      await provider.setTags(tags);

      expect(mockScope.setTag).toHaveBeenCalledWith('environment', 'production');
      expect(mockScope.setTag).toHaveBeenCalledWith('feature', 'checkout');
    });

    it('should set extra data', async () => {
      const key = 'sessionId';
      const value = 'abc123';

      await provider.setExtra(key, value);

      expect(mockScope.setExtra).toHaveBeenCalledWith(key, value);
    });
  });

  describe('provider capabilities', () => {
    it('should support required features', () => {
      expect(provider.supportsFeature(ProviderFeature.USER_CONTEXT)).toBe(true);
      expect(provider.supportsFeature(ProviderFeature.CUSTOM_CONTEXT)).toBe(true);
      expect(provider.supportsFeature(ProviderFeature.BREADCRUMBS)).toBe(true);
      expect(provider.supportsFeature(ProviderFeature.TAGS)).toBe(true);
      expect(provider.supportsFeature(ProviderFeature.EXTRA_DATA)).toBe(true);
      expect(provider.supportsFeature(ProviderFeature.PERFORMANCE_MONITORING)).toBe(true);
      expect(provider.supportsFeature(ProviderFeature.RELEASE_TRACKING)).toBe(true);
    });

    it('should return correct capabilities', () => {
      const capabilities = provider.getCapabilities();

      expect(capabilities.maxBreadcrumbs).toBe(100);
      expect(capabilities.maxContextSize).toBe(1000);
      expect(capabilities.supportsOffline).toBe(true);
      expect(capabilities.supportsBatching).toBe(true);
      expect(capabilities.platforms.web).toBe(true);
      expect(capabilities.platforms.ios).toBe(true);
      expect(capabilities.platforms.android).toBe(true);
    });
  });

  describe('flush and destroy', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should flush successfully', async () => {
      const { flush } = await import('@sentry/core');
      const result = await provider.flush(5000);
      
      expect(result).toBe(true);
      expect(flush).toHaveBeenCalledWith(5000);
    });

    it('should destroy successfully', async () => {
      await provider.destroy();
      
      expect(provider.isInitialized).toBe(false);
    });
  });

  describe('error filtering', () => {
    beforeEach(async () => {
      const configWithFilters = {
        ...mockConfig,
        ignoreErrors: ['NetworkError', /timeout/i],
        minLevel: ErrorLevel.ERROR,
        beforeSend: vi.fn((error) => error),
      };
      await provider.initialize(configWithFilters);
    });

    it('should filter out ignored errors', async () => {
      const error = {
        message: 'NetworkError: Connection failed',
        name: 'NetworkError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
        originalError: new Error('NetworkError: Connection failed'),
      };

      await provider.logError(error);

      expect(mockSentry.captureException).not.toHaveBeenCalled();
    });

    it('should filter by minimum level', async () => {
      const error = {
        message: 'Debug message',
        name: 'DebugError',
        level: ErrorLevel.DEBUG,
        timestamp: Date.now(),
      };

      await provider.logError(error);

      expect(mockSentry.captureException).not.toHaveBeenCalled();
    });

    it('should log errors that pass filters', async () => {
      const error = {
        message: 'Critical error',
        name: 'CriticalError',
        level: ErrorLevel.FATAL,
        timestamp: Date.now(),
        originalError: new Error('Critical error'),
      };

      await provider.logError(error);

      expect(mockSentry.captureException).toHaveBeenCalled();
    });
  });

  describe('level mapping', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should map error levels correctly', async () => {
      const testCases = [
        { level: ErrorLevel.DEBUG, expected: 'debug' },
        { level: ErrorLevel.INFO, expected: 'info' },
        { level: ErrorLevel.WARNING, expected: 'warning' },
        { level: ErrorLevel.ERROR, expected: 'error' },
        { level: ErrorLevel.FATAL, expected: 'fatal' },
      ];

      for (const { level, expected } of testCases) {
        await provider.logMessage('Test message', level);
        
        expect(mockSentry.captureMessage).toHaveBeenCalledWith(
          'Test message',
          expected
        );
      }
    });
  });

});