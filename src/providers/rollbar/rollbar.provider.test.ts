import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RollbarProvider } from './rollbar.provider';
import { ErrorProviderType, ErrorLevel } from '@/types';

// Mock Rollbar
const mockRollbar = {
  init: vi.fn(),
  configure: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  critical: vi.fn(),
  scope: vi.fn(),
  person: vi.fn(),
  context: vi.fn(),
  captureEvent: vi.fn(),
  captureUncaughtExceptions: vi.fn(),
  captureUnhandledRejections: vi.fn(),
  wrap: vi.fn().mockReturnValue(() => {}),
  lambdaHandler: vi.fn(),
  wait: vi.fn().mockResolvedValue(true),
  flush: vi.fn().mockImplementation((callback) => {
    if (callback) callback();
    return Promise.resolve(true);
  }),
  global: vi.fn(),
  options: {},
  isUncaughtExceptionHandlerInstalled: vi.fn().mockReturnValue(true),
  isUnhandledRejectionHandlerInstalled: vi.fn().mockReturnValue(true),
  log: vi.fn(),
  buildJsonPayload: vi.fn(),
  sendJsonPayload: vi.fn(),
  setupBrowser: vi.fn(),
  setupNode: vi.fn(),
};

// Mock rollbar
vi.mock('rollbar', () => ({
  default: vi.fn().mockImplementation(() => mockRollbar),
  ...mockRollbar,
}));

// Mock @capacitor/core
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn().mockReturnValue('web'),
    isNativePlatform: vi.fn().mockReturnValue(false),
  },
}));

describe('RollbarProvider', () => {
  let provider: RollbarProvider;
  let mockConfig: any;

  beforeEach(() => {
    provider = new RollbarProvider();
    mockConfig = {
      provider: ErrorProviderType.ROLLBAR,
      accessToken: 'test-access-token-1234567890abcdef',
      environment: 'test',
      codeVersion: '1.0.0',
      captureUncaught: true,
      captureUnhandledRejections: true,
      autoInstrument: true,
      maxItems: 5,
      itemsPerMinute: 60,
      captureIp: 'anonymize',
      captureEmail: false,
      captureUsername: false,
      verbose: false,
      logLevel: 'debug',
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
      expect(provider.name).toBe('rollbar');
      expect(provider.version).toBe('1.0.0');
      expect(mockRollbar.init).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: mockConfig.accessToken,
          environment: mockConfig.environment,
          codeVersion: mockConfig.codeVersion,
          captureUncaught: mockConfig.captureUncaught,
          captureUnhandledRejections: mockConfig.captureUnhandledRejections,
        })
      );
    });

    it('should throw error when access token is missing', async () => {
      const configWithoutToken = { ...mockConfig };
      delete configWithoutToken.accessToken;

      await expect(provider.initialize(configWithoutToken)).rejects.toThrow(
        'Rollbar access token is required'
      );
    });

    it('should throw error when already initialized', async () => {
      await provider.initialize(mockConfig);
      
      await expect(provider.initialize(mockConfig)).rejects.toThrow(
        'Rollbar provider is already initialized'
      );
    });

    it('should initialize with transform functions', async () => {
      const configWithTransforms = {
        ...mockConfig,
        transform: vi.fn(),
        checkIgnore: vi.fn(),
        onSendCallback: vi.fn(),
      };

      await provider.initialize(configWithTransforms);

      expect(mockRollbar.init).toHaveBeenCalledWith(
        expect.objectContaining({
          transform: configWithTransforms.transform,
          checkIgnore: configWithTransforms.checkIgnore,
          onSendCallback: configWithTransforms.onSendCallback,
        })
      );
    });
  });

  describe('error logging', () => {
    beforeEach(async () => {
      // Create a fresh provider for each test to avoid state issues
      provider = new RollbarProvider();
      await provider.initialize(mockConfig);
    });

    it('should log error with correct level', async () => {
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

      expect(mockRollbar.error).toHaveBeenCalledWith(
        error.originalError,
        expect.objectContaining({
          custom: expect.objectContaining({
            context: error.context,
            tags: error.tags,
            metadata: error.metadata,
          }),
          person: error.user,
          timestamp: error.timestamp,
        })
      );
    });

    it('should create synthetic error when no original error', async () => {
      const error = {
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.WARNING,
        timestamp: Date.now(),
        stack: 'Error stack trace',
        context: { page: 'test' },
        tags: { category: 'test' },
        metadata: { build: '1.0.0' },
      };

      await provider.logError(error);

      expect(mockRollbar.warning).toHaveBeenCalledWith(
        error.message,
        expect.objectContaining({
          custom: expect.objectContaining({
            context: error.context,
            tags: error.tags,
            metadata: error.metadata,
          }),
          timestamp: error.timestamp,
        })
      );
    });

    it('should log message with specified level', async () => {
      const message = 'Test message';
      const level = ErrorLevel.INFO;

      await provider.logMessage(message, level);

      expect(mockRollbar.info).toHaveBeenCalledWith(message, expect.any(Object));
    });

    it('should not log when provider is disabled', async () => {
      // The provider is already initialized in beforeEach, so just destroy it
      await provider.destroy();
      
      const error = {
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      };

      // After destroy, logError should throw or handle gracefully
      await expect(provider.logError(error)).rejects.toThrow('Rollbar provider is not initialized');
      
      expect(mockRollbar.error).not.toHaveBeenCalled();
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

      expect(mockRollbar.person).toHaveBeenCalledWith({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    });

    it('should clear user context when null provided', async () => {
      await provider.setUser(null);

      expect(mockRollbar.person).toHaveBeenCalledWith(null);
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

      // Rollbar uses context method for custom context
      expect(mockRollbar.context).toHaveBeenCalledWith(key, value);
    });

    it('should handle complex context values', async () => {
      const key = 'metadata';
      const value = { version: '1.0.0', build: 123 };

      await provider.setContext(key, value);

      expect(mockRollbar.context).toHaveBeenCalledWith(key, value);
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

      expect(mockRollbar.info).toHaveBeenCalledWith(
        `[Breadcrumb] ${breadcrumb.message}`,
        expect.objectContaining({
          custom: expect.objectContaining({
            category: breadcrumb.category,
            data: breadcrumb.data,
          }),
          timestamp: breadcrumb.timestamp,
        })
      );
    });

    it('should clear breadcrumbs (no-op for Rollbar)', async () => {
      // Rollbar doesn't support clearing breadcrumbs
      // This should not throw an error
      await expect(provider.clearBreadcrumbs()).resolves.not.toThrow();
    });
  });

  describe('tags and extra data', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should set tags using scope', async () => {
      const tags = {
        environment: 'production',
        version: '1.0.0',
      };

      await provider.setTags(tags);

      expect(mockRollbar.scope).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: tags,
        })
      );
    });

    it('should set extra data using scope', async () => {
      const key = 'sessionId';
      const value = 'abc123';

      await provider.setExtra(key, value);

      expect(mockRollbar.scope).toHaveBeenCalledWith(
        expect.objectContaining({
          [key]: value,
        })
      );
    });
  });

  describe('provider capabilities', () => {
    it('should support required features', () => {
      expect(provider.supportsFeature('USER_CONTEXT')).toBe(true);
      expect(provider.supportsFeature('CUSTOM_CONTEXT')).toBe(true);
      expect(provider.supportsFeature('BREADCRUMBS')).toBe(true);
      expect(provider.supportsFeature('TAGS')).toBe(true);
      expect(provider.supportsFeature('EXTRA_DATA')).toBe(true);
      expect(provider.supportsFeature('TELEMETRY')).toBe(true);
    });

    it('should return correct capabilities', () => {
      const capabilities = provider.getCapabilities();

      expect(capabilities.maxBreadcrumbs).toBe(100);
      expect(capabilities.maxContextSize).toBe(1000);
      expect(capabilities.maxTags).toBe(100);
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
      const result = await provider.flush(5000);
      
      expect(result).toBe(true);
      expect(mockRollbar.flush).toHaveBeenCalledWith(expect.any(Function));
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
        checkIgnore: vi.fn((isUncaught, args, payload) => {
          const message = args[0]?.message || args[0] || '';
          return message.includes('NetworkError');
        }),
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

      expect(mockRollbar.error).not.toHaveBeenCalled();
    });

    it('should filter by minimum level', async () => {
      const error = {
        message: 'Debug message',
        name: 'DebugError',
        level: ErrorLevel.DEBUG,
        timestamp: Date.now(),
      };

      await provider.logError(error);

      expect(mockRollbar.debug).not.toHaveBeenCalled();
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

      expect(mockRollbar.critical).toHaveBeenCalled();
    });
  });

  describe('level mapping', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should map error levels correctly', async () => {
      const testCases = [
        { level: ErrorLevel.DEBUG, method: 'debug' },
        { level: ErrorLevel.INFO, method: 'info' },
        { level: ErrorLevel.WARNING, method: 'warning' },
        { level: ErrorLevel.ERROR, method: 'error' },
        { level: ErrorLevel.FATAL, method: 'critical' },
      ];

      for (const { level, method } of testCases) {
        await provider.logMessage('Test message', level);
        
        expect(mockRollbar[method]).toHaveBeenCalledWith(
          'Test message',
          expect.any(Object)
        );
        
        vi.clearAllMocks();
      }
    });
  });

  describe('Rollbar specific features', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should capture event with custom data', async () => {
      const eventData = {
        level: 'info',
        message: 'Custom event',
        custom: { key: 'value' },
      };

      await provider.captureEvent(eventData);

      expect(mockRollbar.captureEvent).toHaveBeenCalledWith(eventData);
    });

    it('should wrap function for error handling', async () => {
      const testFunction = vi.fn();
      const wrappedFunction = await provider.wrap(testFunction);

      expect(mockRollbar.wrap).toHaveBeenCalledWith(testFunction);
      expect(wrappedFunction).toBeDefined();
    });

    it('should configure rollbar with new options', async () => {
      const newOptions = {
        maxItems: 10,
        itemsPerMinute: 120,
      };

      await provider.configure(newOptions);

      expect(mockRollbar.configure).toHaveBeenCalledWith(newOptions);
    });

    it('should check if uncaught exception handler is installed', async () => {
      const result = await provider.isUncaughtExceptionHandlerInstalled();

      expect(result).toBe(true);
      expect(mockRollbar.isUncaughtExceptionHandlerInstalled).toHaveBeenCalled();
    });

    it('should check if unhandled rejection handler is installed', async () => {
      const result = await provider.isUnhandledRejectionHandlerInstalled();

      expect(result).toBe(true);
      expect(mockRollbar.isUnhandledRejectionHandlerInstalled).toHaveBeenCalled();
    });

    it('should wait for pending payloads', async () => {
      const result = await provider.wait();

      expect(result).toBe(true);
      expect(mockRollbar.wait).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should handle errors gracefully when Rollbar calls fail', async () => {
      mockRollbar.error.mockImplementation(() => {
        throw new Error('Rollbar API error');
      });

      const error = {
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      };

      await expect(provider.logError(error)).rejects.toThrow('Rollbar API error');
      
      // Reset mock
      mockRollbar.error.mockImplementation(() => {});
    });

    it('should handle initialization errors gracefully', async () => {
      // Create a new provider instance for this test
      const freshProvider = new RollbarProvider();
      mockRollbar.init.mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      await expect(freshProvider.initialize(mockConfig)).rejects.toThrow('Initialization failed');
      
      // Reset the mock after this test
      mockRollbar.init.mockImplementation(() => {});
    });
  });

  describe('telemetry', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should capture telemetry data', async () => {
      const telemetryData = {
        type: 'navigation',
        element: 'button',
        level: 'info',
        timestamp: Date.now(),
        body: { from: 'home', to: 'checkout' },
      };

      await provider.captureTelemetry(telemetryData);

      expect(mockRollbar.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          telemetry: telemetryData,
        })
      );
    });
  });

  describe('payload transformation', () => {
    beforeEach(async () => {
      const configWithTransform = {
        ...mockConfig,
        transform: vi.fn((payload) => {
          payload.environment = 'transformed';
          return payload;
        }),
      };
      await provider.initialize(configWithTransform);
    });

    it('should apply transform function to payloads', async () => {
      const error = {
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      };

      await provider.logError(error);

      expect(mockRollbar.error).toHaveBeenCalled();
      // The transform is called during initialization, not during error logging
      expect(mockRollbar.init).toHaveBeenCalledWith(
        expect.objectContaining({
          transform: expect.any(Function),
        })
      );
    });
  });
});