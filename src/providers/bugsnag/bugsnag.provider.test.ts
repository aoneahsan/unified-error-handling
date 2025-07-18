import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BugsnagProvider } from './bugsnag.provider';
import { ErrorProviderType, ErrorLevel } from '@/types';

// Mock Bugsnag
const mockBugsnag = {
  start: vi.fn(),
  notify: vi.fn(),
  leaveBreadcrumb: vi.fn(),
  clearBreadcrumbs: vi.fn(),
  setUser: vi.fn(),
  clearUser: vi.fn(),
  setContext: vi.fn(),
  clearContext: vi.fn(),
  addMetadata: vi.fn(),
  clearMetadata: vi.fn(),
  addFeatureFlag: vi.fn(),
  clearFeatureFlag: vi.fn(),
  addFeatureFlags: vi.fn(),
  clearFeatureFlags: vi.fn(),
  getContext: vi.fn(),
  getUser: vi.fn(),
  isStarted: vi.fn().mockReturnValue(true),
  pauseSession: vi.fn(),
  resumeSession: vi.fn(),
  startSession: vi.fn(),
  markLaunchCompleted: vi.fn(),
  getLastRunInfo: vi.fn(),
  config: {
    apiKey: '',
    appVersion: '',
    releaseStage: '',
    enabledReleaseStages: [],
  },
  client: {
    flush: vi.fn().mockResolvedValue(true),
  },
  BugsnagStatic: {
    start: vi.fn(),
    isStarted: vi.fn().mockReturnValue(true),
  },
};

// Mock @bugsnag/js
vi.mock('@bugsnag/js', () => ({
  default: mockBugsnag,
  ...mockBugsnag,
}));

// Mock @bugsnag/plugin-react
vi.mock('@bugsnag/plugin-react', () => ({
  default: vi.fn(),
}));

// Mock @bugsnag/plugin-react-native
vi.mock('@bugsnag/plugin-react-native', () => ({
  default: vi.fn(),
}));

// Mock @capacitor/core
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn().mockReturnValue('web'),
    isNativePlatform: vi.fn().mockReturnValue(false),
  },
}));

describe('BugsnagProvider', () => {
  let provider: BugsnagProvider;
  let mockConfig: any;

  beforeEach(() => {
    provider = new BugsnagProvider();
    mockConfig = {
      provider: ErrorProviderType.BUGSNAG,
      apiKey: 'test-api-key-1234567890abcdef',
      appVersion: '1.0.0',
      releaseStage: 'test',
      enabledReleaseStages: ['test', 'production'],
      autoDetectErrors: true,
      autoTrackSessions: true,
      maxBreadcrumbs: 25,
      maxEvents: 100,
      collectUserIp: true,
      enableAppHangDetection: true,
      appHangThresholdMs: 5000,
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
      expect(provider.name).toBe('bugsnag');
      expect(provider.version).toBe('1.0.0');
      expect(mockBugsnag.start).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: mockConfig.apiKey,
          appVersion: mockConfig.appVersion,
          releaseStage: mockConfig.releaseStage,
          enabledReleaseStages: mockConfig.enabledReleaseStages,
        })
      );
    });

    it('should throw error when API key is missing', async () => {
      const configWithoutApiKey = { ...mockConfig };
      delete configWithoutApiKey.apiKey;

      await expect(provider.initialize(configWithoutApiKey)).rejects.toThrow(
        'Bugsnag API key is required'
      );
    });

    it('should throw error when already initialized', async () => {
      await provider.initialize(mockConfig);
      
      await expect(provider.initialize(mockConfig)).rejects.toThrow(
        'Bugsnag provider is already initialized'
      );
    });

    it('should initialize with plugins', async () => {
      const configWithPlugins = {
        ...mockConfig,
        enableReactPlugin: true,
        enableReactNativePlugin: true,
      };

      await provider.initialize(configWithPlugins);

      expect(mockBugsnag.start).toHaveBeenCalledWith(
        expect.objectContaining({
          plugins: expect.any(Array),
        })
      );
    });
  });

  describe('error logging', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should notify error with all details', async () => {
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

      expect(mockBugsnag.notify).toHaveBeenCalledWith(
        error.originalError,
        expect.any(Function)
      );
    });

    it('should create synthetic error when no original error', async () => {
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

      expect(mockBugsnag.notify).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Function)
      );
    });

    it('should log message with specified level', async () => {
      const message = 'Test message';
      const level = ErrorLevel.WARNING;

      await provider.logMessage(message, level);

      expect(mockBugsnag.notify).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Function)
      );
    });

    it('should not log when provider is disabled', async () => {
      await provider.destroy();
      
      const error = {
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      };

      await provider.logError(error);

      expect(mockBugsnag.notify).not.toHaveBeenCalled();
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

      expect(mockBugsnag.setUser).toHaveBeenCalledWith(
        user.id,
        user.email,
        user.username
      );
    });

    it('should clear user context when null provided', async () => {
      await provider.setUser(null);

      expect(mockBugsnag.clearUser).toHaveBeenCalled();
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

      expect(mockBugsnag.setContext).toHaveBeenCalledWith(key, value);
    });

    it('should handle complex context values', async () => {
      const key = 'metadata';
      const value = { version: '1.0.0', build: 123 };

      await provider.setContext(key, value);

      expect(mockBugsnag.setContext).toHaveBeenCalledWith(key, value);
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

      expect(mockBugsnag.leaveBreadcrumb).toHaveBeenCalledWith(
        breadcrumb.message,
        breadcrumb.data,
        'user'
      );
    });

    it('should clear breadcrumbs', async () => {
      await provider.clearBreadcrumbs();
      
      expect(mockBugsnag.clearBreadcrumbs).toHaveBeenCalled();
    });
  });

  describe('tags and extra data', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should set tags as metadata', async () => {
      const tags = {
        environment: 'production',
        version: '1.0.0',
      };

      await provider.setTags(tags);

      expect(mockBugsnag.addMetadata).toHaveBeenCalledWith('tags', tags);
    });

    it('should set extra data as metadata', async () => {
      const key = 'sessionId';
      const value = 'abc123';

      await provider.setExtra(key, value);

      expect(mockBugsnag.addMetadata).toHaveBeenCalledWith('extra', key, value);
    });
  });

  describe('provider capabilities', () => {
    it('should support required features', () => {
      expect(provider.supportsFeature('USER_CONTEXT')).toBe(true);
      expect(provider.supportsFeature('CUSTOM_CONTEXT')).toBe(true);
      expect(provider.supportsFeature('BREADCRUMBS')).toBe(true);
      expect(provider.supportsFeature('TAGS')).toBe(true);
      expect(provider.supportsFeature('EXTRA_DATA')).toBe(true);
      expect(provider.supportsFeature('SESSION_TRACKING')).toBe(true);
      expect(provider.supportsFeature('FEATURE_FLAGS')).toBe(true);
    });

    it('should return correct capabilities', () => {
      const capabilities = provider.getCapabilities();

      expect(capabilities.maxBreadcrumbs).toBe(25);
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
      expect(mockBugsnag.client.flush).toHaveBeenCalledWith(5000);
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

      expect(mockBugsnag.notify).not.toHaveBeenCalled();
    });

    it('should filter by minimum level', async () => {
      const error = {
        message: 'Debug message',
        name: 'DebugError',
        level: ErrorLevel.DEBUG,
        timestamp: Date.now(),
      };

      await provider.logError(error);

      expect(mockBugsnag.notify).not.toHaveBeenCalled();
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

      expect(mockBugsnag.notify).toHaveBeenCalled();
    });
  });

  describe('level mapping', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should map error levels correctly', () => {
      const testCases = [
        { level: ErrorLevel.DEBUG, expected: 'info' },
        { level: ErrorLevel.INFO, expected: 'info' },
        { level: ErrorLevel.WARNING, expected: 'warning' },
        { level: ErrorLevel.ERROR, expected: 'error' },
        { level: ErrorLevel.FATAL, expected: 'error' },
      ];

      testCases.forEach(({ level, expected }) => {
        const result = (provider as any).mapErrorLevel(level);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Bugsnag specific features', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should add feature flag', async () => {
      const name = 'feature_flag';
      const value = 'enabled';

      await provider.addFeatureFlag(name, value);

      expect(mockBugsnag.addFeatureFlag).toHaveBeenCalledWith(name, value);
    });

    it('should clear feature flag', async () => {
      const name = 'feature_flag';

      await provider.clearFeatureFlag(name);

      expect(mockBugsnag.clearFeatureFlag).toHaveBeenCalledWith(name);
    });

    it('should add multiple feature flags', async () => {
      const flags = {
        flag1: 'enabled',
        flag2: 'disabled',
      };

      await provider.addFeatureFlags(flags);

      expect(mockBugsnag.addFeatureFlags).toHaveBeenCalledWith(flags);
    });

    it('should clear all feature flags', async () => {
      await provider.clearFeatureFlags();

      expect(mockBugsnag.clearFeatureFlags).toHaveBeenCalled();
    });

    it('should start session', async () => {
      await provider.startSession();

      expect(mockBugsnag.startSession).toHaveBeenCalled();
    });

    it('should pause session', async () => {
      await provider.pauseSession();

      expect(mockBugsnag.pauseSession).toHaveBeenCalled();
    });

    it('should resume session', async () => {
      await provider.resumeSession();

      expect(mockBugsnag.resumeSession).toHaveBeenCalled();
    });

    it('should mark launch completed', async () => {
      await provider.markLaunchCompleted();

      expect(mockBugsnag.markLaunchCompleted).toHaveBeenCalled();
    });

    it('should get last run info', async () => {
      const mockRunInfo = { crashed: false, crashedDuringLaunch: false };
      mockBugsnag.getLastRunInfo.mockResolvedValue(mockRunInfo);

      const result = await provider.getLastRunInfo();

      expect(result).toEqual(mockRunInfo);
      expect(mockBugsnag.getLastRunInfo).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should handle errors gracefully when Bugsnag calls fail', async () => {
      mockBugsnag.notify.mockRejectedValue(new Error('Bugsnag API error'));

      const error = {
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      };

      await expect(provider.logError(error)).rejects.toThrow('Bugsnag API error');
    });

    it('should handle initialization errors gracefully', async () => {
      mockBugsnag.start.mockRejectedValue(new Error('Initialization failed'));

      await expect(provider.initialize(mockConfig)).rejects.toThrow('Initialization failed');
    });
  });

  describe('breadcrumb types', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should map breadcrumb types correctly', () => {
      const testCases = [
        { category: 'navigation', expected: 'navigation' },
        { category: 'user', expected: 'user' },
        { category: 'console', expected: 'log' },
        { category: 'http', expected: 'request' },
        { category: 'unknown', expected: 'manual' },
      ];

      testCases.forEach(({ category, expected }) => {
        const result = (provider as any).mapBreadcrumbType(category);
        expect(result).toBe(expected);
      });
    });
  });
});