/**
 * Centralized default configuration for unified error handling
 *
 * This file contains all default values for the plugin configuration.
 * User-provided values will always take precedence over these defaults.
 */

import { ErrorLevel, ErrorProviderType } from '../types';
import type {
  UnifiedErrorConfig,
  FirebaseConfig,
  SentryConfig,
  DataDogConfig,
  BugsnagConfig,
  RollbarConfig,
  LogRocketConfig,
  RaygunConfig,
  AppCenterConfig,
} from '../types';

/**
 * Base configuration defaults
 */
export const BASE_DEFAULTS = {
  // Core settings
  debug: false,
  environment: 'production' as const,
  enableOffline: true,
  maxOfflineQueueSize: 100,
  offlineRetryDelay: 30000, // 30 seconds
  offlineRetryMaxAttempts: 3,

  // Tracking settings
  networkTracking: true,
  consoleTracking: true,
  autoSessionTracking: true,

  // Error handling
  maxBreadcrumbs: 100,
  sampleRate: 1.0,
  ignoreErrors: [] as (string | RegExp)[],

  // Performance
  enablePerformanceMonitoring: false,
  performanceSampleRate: 0.1,

  // Security
  sanitizeData: true,
  scrubFields: ['password', 'token', 'apiKey', 'secret', 'auth'] as string[],

  // Retry configuration
  retryDelay: 1000,
  retryMaxAttempts: 3,
  retryBackoffMultiplier: 2,
} as const;

/**
 * Provider-specific default configurations
 */
export const PROVIDER_DEFAULTS = {
  /**
   * Firebase Crashlytics defaults
   */
  [ErrorProviderType.FIREBASE]: {
    crashlyticsEnabled: true,
    customKeysLimit: 64,
    logLimit: 64,
    automaticDataCollectionEnabled: true,
    crashlyticsCollectionEnabled: true,

    // Native-specific defaults
    enableCrashlytics: true,
    enableAnalytics: false,
    enablePerformance: false,
    enableRemoteConfig: false,

    // Log levels
    logLevel: ErrorLevel.ERROR,

    // Collection settings
    collectUserIds: true,
    collectDeviceInfo: true,
    collectAppInfo: true,
  } as Partial<FirebaseConfig>,

  /**
   * Sentry defaults
   */
  [ErrorProviderType.SENTRY]: {
    maxBreadcrumbs: 100,
    sampleRate: 1.0,
    tracesSampleRate: 0.1,
    profilesSampleRate: 0.1,
    attachStacktrace: true,
    autoSessionTracking: true,

    // Integrations
    enableAutoInstrumentation: true,
    enableGlobalHandlers: true,
    enablePromiseRejectionTracking: true,

    // Performance monitoring
    enablePerformanceMonitoring: false,
    enableProfiler: false,

    // Error handling
    captureUnhandledRejections: true,
    captureConsoleIntegration: true,

    // Data privacy
    sendDefaultPii: false,
    beforeSendTransaction: undefined,
    beforeBreadcrumb: undefined,

    // Transport
    transportOptions: {
      bufferSize: 30,
      flushTimeout: 2000,
    },
  } as Partial<SentryConfig>,

  /**
   * DataDog RUM defaults
   */
  [ErrorProviderType.DATADOG]: {
    sessionSampleRate: 100,
    trackInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    trackFrustrations: true,

    // Privacy settings
    defaultPrivacyLevel: 'mask-user-input' as const,

    // Session replay
    sessionReplayEnabled: false,
    sessionReplaySampleRate: 20,

    // Error tracking
    forwardErrorsToLogs: true,
    forwardConsoleLogs: ['error', 'warn'],

    // Performance
    enablePerformanceMonitoring: true,
    enableRumAnalytics: true,

    // Batch settings
    batchSize: 100,
    flushTimeout: 30000,
  } as Partial<DataDogConfig>,

  /**
   * Bugsnag defaults
   */
  [ErrorProviderType.BUGSNAG]: {
    autoDetectErrors: true,
    autoTrackSessions: true,
    collectUserIp: true,
    maxBreadcrumbs: 25,
    maxEvents: 100,

    // Error handling
    enabledErrorTypes: {
      unhandledExceptions: true,
      unhandledRejections: true,
      nativeCrashes: true,
      anrs: true,
    },

    // Metadata
    enabledReleaseStages: ['development', 'staging', 'production'],

    // App hang detection
    enableAppHangDetection: true,
    appHangThresholdMs: 5000,

    // Delivery
    maxPersistedEvents: 32,
    maxPersistedSessions: 128,

    // Features
    enabledFeatures: {
      breadcrumbs: true,
      sessions: true,
      userInteraction: true,
      networkBreadcrumbs: true,
      navigationBreadcrumbs: true,
      consoleBreadcrumbs: true,
    },
  } as Partial<BugsnagConfig>,

  /**
   * Rollbar defaults
   */
  [ErrorProviderType.ROLLBAR]: {
    captureUncaught: true,
    captureUnhandledRejections: true,
    autoInstrument: true,

    // Payload settings
    maxItems: 5,
    itemsPerMinute: 60,

    // Code version
    captureCodeVersion: true,

    // Context
    captureIp: 'anonymize' as const,
    captureEmail: false,
    captureUsername: false,

    // Filtering
    ignoredMessages: [],

    // Transform
    checkIgnore: undefined,
    transform: undefined,

    // Delivery
    verbose: false,
    logLevel: 'debug' as const,

    // Telemetry
    captureTelemetry: true,
    maxTelemetryEvents: 100,
  } as Partial<RollbarConfig>,

  /**
   * LogRocket defaults
   */
  [ErrorProviderType.LOGROCKET]: {
    // Console capture
    console: true,

    // Network capture
    network: true,

    // DOM capture
    dom: true,

    // Session settings
    shouldCaptureIP: false,
    capturePerformance: true,
    captureExceptions: true,

    // Upload settings
    uploadTimeoutMs: 30000,
    maxSessionLengthMs: 30 * 60 * 1000, // 30 minutes

    // Merge settings
    mergeIframes: false,

    // Privacy
    sanitizers: {
      inputSanitizer: true,
      textSanitizer: false,
      attributeSanitizer: false,
    },

    // Redux
    reduxMiddlewareOptions: {
      shouldCaptureActions: true,
      shouldCaptureState: true,
      stateSanitizer: undefined,
      actionSanitizer: undefined,
    },
  } as Partial<LogRocketConfig>,

  /**
   * Raygun defaults
   */
  [ErrorProviderType.RAYGUN]: {
    // Error tracking
    enableOfflineStorage: true,
    enableCrashReporting: true,
    enablePulse: false,

    // User tracking
    enableUserTracking: false,

    // Custom data
    enableCustomData: true,

    // Performance
    enablePerformanceMonitoring: false,

    // Filtering
    ignoreAjaxAbort: true,
    ignoreAjaxError: false,

    // Grouping
    groupingKey: undefined,

    // Tags
    tags: {} as Record<string, string>,

    // Custom grouping
    customGrouping: undefined,

    // Breadcrumbs
    enableConsoleBreadcrumbs: true,
    enableClickBreadcrumbs: true,
    enableNavigationBreadcrumbs: true,
    enableXHRBreadcrumbs: true,
  } as Partial<RaygunConfig>,

  /**
   * AppCenter defaults
   */
  [ErrorProviderType.APPCENTER]: {
    useInProduction: true,

    // Services
    services: ['crashes', 'analytics'],

    // Crashes
    crashes: {
      shouldProcessErrorReports: true,
      shouldAwaitUserConfirmation: false,
    },

    // Analytics
    analytics: {
      transmissionInterval: 3000,
      shouldTrackSessions: true,
      automaticallyCollectPageViews: false,
    },

    // Distribute
    distribute: {
      disableAutomaticCheckForUpdate: false,
      checkForUpdateOnStart: true,
    },

    // Log level
    logLevel: 2, // INFO

    // User settings
    collectUserIds: true,
    collectDeviceInfo: true,

    // Country code
    countryCode: 'US',
  } as Partial<AppCenterConfig>,
} as const;

/**
 * Environment-specific configuration presets
 */
export const ENVIRONMENT_PRESETS = {
  development: {
    debug: true,
    environment: 'development' as const,
    sampleRate: 1.0,
    enablePerformanceMonitoring: false,
    consoleTracking: true,
    networkTracking: true,
    sanitizeData: false,
  },

  staging: {
    debug: false,
    environment: 'staging' as const,
    sampleRate: 1.0,
    enablePerformanceMonitoring: true,
    consoleTracking: true,
    networkTracking: true,
    sanitizeData: true,
  },

  production: {
    debug: false,
    environment: 'production' as const,
    sampleRate: 0.1,
    enablePerformanceMonitoring: true,
    consoleTracking: false,
    networkTracking: true,
    sanitizeData: true,
  },
} as const;

/**
 * Default unified error configuration
 */
export const DEFAULT_UNIFIED_CONFIG: Partial<UnifiedErrorConfig> = {
  ...BASE_DEFAULTS,
  provider: {
    provider: ErrorProviderType.FIREBASE,
    ...PROVIDER_DEFAULTS[ErrorProviderType.FIREBASE],
  },
};

/**
 * Get provider-specific defaults
 */
export function getProviderDefaults(provider: ErrorProviderType): any {
  return PROVIDER_DEFAULTS[provider] || {};
}

/**
 * Get environment-specific preset
 */
export function getEnvironmentPreset(environment: keyof typeof ENVIRONMENT_PRESETS): any {
  return ENVIRONMENT_PRESETS[environment] || ENVIRONMENT_PRESETS.production;
}

/**
 * Get complete default configuration for a provider
 */
export function getDefaultConfig(
  provider: ErrorProviderType,
  environment?: keyof typeof ENVIRONMENT_PRESETS,
): Partial<UnifiedErrorConfig> {
  const envPreset = environment ? getEnvironmentPreset(environment) : {};
  const providerDefaults = getProviderDefaults(provider);

  return {
    ...BASE_DEFAULTS,
    ...envPreset,
    provider: {
      provider,
      ...providerDefaults,
    },
  };
}
