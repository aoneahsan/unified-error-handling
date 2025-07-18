import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FirebaseProvider } from './firebase.provider';
import { ErrorProviderType, ErrorLevel } from '@/types';

// Mock Firebase Crashlytics
const mockCrashlytics = {
  log: vi.fn(),
  recordException: vi.fn(),
  setAttribute: vi.fn(),
  setCustomKey: vi.fn(),
  setUserId: vi.fn(),
  setUserEmail: vi.fn(),
  setUserName: vi.fn(),
  setCrashlyticsCollectionEnabled: vi.fn(),
  logEvent: vi.fn(),
  sendUnsentReports: vi.fn(),
  deleteUnsentReports: vi.fn(),
  didCrashOnPreviousExecution: vi.fn().mockResolvedValue(false),
  checkForUnsentReports: vi.fn().mockResolvedValue(false),
};

const mockFirebaseAnalytics = {
  logEvent: vi.fn(),
  setUserId: vi.fn(),
  setUserProperties: vi.fn(),
  setCurrentScreen: vi.fn(),
};

// Mock capacitor-firebase-kit
vi.mock('capacitor-firebase-kit', () => ({
  FirebaseCrashlytics: mockCrashlytics,
  FirebaseAnalytics: mockFirebaseAnalytics,
}));

// Mock @capacitor/core
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn().mockReturnValue('ios'),
    isNativePlatform: vi.fn().mockReturnValue(true),
  },
}));

describe('FirebaseProvider', () => {
  let provider: FirebaseProvider;
  let mockConfig: any;

  beforeEach(() => {
    provider = new FirebaseProvider();
    mockConfig = {
      provider: ErrorProviderType.FIREBASE,
      crashlyticsEnabled: true,
      environment: 'test',
      debug: false,
      customKeysLimit: 64,
      logLimit: 64,
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
      expect(provider.name).toBe('firebase');
      expect(provider.version).toBe('1.0.0');
    });

    it('should throw error when already initialized', async () => {
      await provider.initialize(mockConfig);
      
      await expect(provider.initialize(mockConfig)).rejects.toThrow(
        'Firebase provider is already initialized'
      );
    });

    it('should initialize with default config when no config provided', async () => {
      await provider.initialize({
        provider: ErrorProviderType.FIREBASE,
      });
      
      expect(provider.isInitialized).toBe(true);
    });
  });

  describe('error logging', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should log error with all details', async () => {
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
      };

      await provider.logError(error);

      expect(mockCrashlytics.log).toHaveBeenCalledWith(error.message);
      expect(mockCrashlytics.recordException).toHaveBeenCalledWith({
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
    });

    it('should log message with specified level', async () => {
      const message = 'Test message';
      const level = ErrorLevel.WARNING;

      await provider.logMessage(message, level);

      expect(mockCrashlytics.log).toHaveBeenCalledWith(message);
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

      expect(mockCrashlytics.log).not.toHaveBeenCalled();
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

      expect(mockCrashlytics.setUserId).toHaveBeenCalledWith(user.id);
      expect(mockCrashlytics.setUserEmail).toHaveBeenCalledWith(user.email);
      expect(mockCrashlytics.setUserName).toHaveBeenCalledWith(user.username);
    });

    it('should clear user context when null provided', async () => {
      await provider.setUser(null);

      expect(mockCrashlytics.setUserId).toHaveBeenCalledWith('');
      expect(mockCrashlytics.setUserEmail).toHaveBeenCalledWith('');
      expect(mockCrashlytics.setUserName).toHaveBeenCalledWith('');
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

      expect(mockCrashlytics.setCustomKey).toHaveBeenCalledWith(key, value);
    });

    it('should handle complex context values', async () => {
      const key = 'metadata';
      const value = { version: '1.0.0', build: 123 };

      await provider.setContext(key, value);

      expect(mockCrashlytics.setCustomKey).toHaveBeenCalledWith(key, JSON.stringify(value));
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

      expect(mockCrashlytics.log).toHaveBeenCalledWith(
        `[${breadcrumb.category}] ${breadcrumb.message}`
      );
    });

    it('should clear breadcrumbs', async () => {
      await provider.clearBreadcrumbs();
      
      // Firebase doesn't have a clear method, so this should not throw
      expect(true).toBe(true);
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

      expect(mockCrashlytics.setCustomKey).toHaveBeenCalledWith('environment', 'production');
      expect(mockCrashlytics.setCustomKey).toHaveBeenCalledWith('version', '1.0.0');
    });

    it('should set extra data', async () => {
      const key = 'sessionId';
      const value = 'abc123';

      await provider.setExtra(key, value);

      expect(mockCrashlytics.setCustomKey).toHaveBeenCalledWith(key, value);
    });
  });

  describe('provider capabilities', () => {
    it('should support required features', () => {
      expect(provider.supportsFeature('USER_CONTEXT')).toBe(true);
      expect(provider.supportsFeature('CUSTOM_CONTEXT')).toBe(true);
      expect(provider.supportsFeature('BREADCRUMBS')).toBe(true);
      expect(provider.supportsFeature('TAGS')).toBe(true);
      expect(provider.supportsFeature('EXTRA_DATA')).toBe(true);
    });

    it('should return correct capabilities', () => {
      const capabilities = provider.getCapabilities();

      expect(capabilities.maxBreadcrumbs).toBe(100);
      expect(capabilities.maxContextSize).toBe(1000);
      expect(capabilities.supportsOffline).toBe(true);
      expect(capabilities.platforms.ios).toBe(true);
      expect(capabilities.platforms.android).toBe(true);
      expect(capabilities.platforms.web).toBe(false);
    });
  });

  describe('flush and destroy', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should flush successfully', async () => {
      const result = await provider.flush(5000);
      
      expect(result).toBe(true);
      expect(mockCrashlytics.sendUnsentReports).toHaveBeenCalled();
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
      };
      await provider.initialize(configWithFilters);
    });

    it('should filter out ignored errors', async () => {
      const error = {
        message: 'NetworkError: Connection failed',
        name: 'NetworkError',
        level: ErrorLevel.ERROR,
        timestamp: Date.now(),
      };

      await provider.logError(error);

      expect(mockCrashlytics.log).not.toHaveBeenCalled();
    });

    it('should filter by minimum level', async () => {
      const error = {
        message: 'Debug message',
        name: 'DebugError',
        level: ErrorLevel.DEBUG,
        timestamp: Date.now(),
      };

      await provider.logError(error);

      expect(mockCrashlytics.log).not.toHaveBeenCalled();
    });

    it('should log errors that pass filters', async () => {
      const error = {
        message: 'Critical error',
        name: 'CriticalError',
        level: ErrorLevel.FATAL,
        timestamp: Date.now(),
      };

      await provider.logError(error);

      expect(mockCrashlytics.log).toHaveBeenCalled();
    });
  });

  describe('Firebase specific features', () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it('should check for crash on previous execution', async () => {
      const didCrash = await provider.didCrashOnPreviousExecution();
      
      expect(didCrash).toBe(false);
      expect(mockCrashlytics.didCrashOnPreviousExecution).toHaveBeenCalled();
    });

    it('should check for unsent reports', async () => {
      const hasUnsentReports = await provider.checkForUnsentReports();
      
      expect(hasUnsentReports).toBe(false);
      expect(mockCrashlytics.checkForUnsentReports).toHaveBeenCalled();
    });

    it('should send unsent reports', async () => {
      await provider.sendUnsentReports();
      
      expect(mockCrashlytics.sendUnsentReports).toHaveBeenCalled();
    });

    it('should delete unsent reports', async () => {
      await provider.deleteUnsentReports();
      
      expect(mockCrashlytics.deleteUnsentReports).toHaveBeenCalled();
    });

    it('should log analytics event', async () => {
      const eventName = 'user_action';
      const parameters = { action: 'click', element: 'button' };

      await provider.logAnalyticsEvent(eventName, parameters);

      expect(mockFirebaseAnalytics.logEvent).toHaveBeenCalledWith(eventName, parameters);
    });
  });
});