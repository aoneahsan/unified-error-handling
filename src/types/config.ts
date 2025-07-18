import { ErrorFilter, ErrorTransformer, ErrorLevel } from './errors';

/**
 * Supported error handling providers
 */
export enum ErrorProviderType {
  FIREBASE = 'firebase',
  SENTRY = 'sentry',
  DATADOG = 'datadog',
  BUGSNAG = 'bugsnag',
  ROLLBAR = 'rollbar',
  LOGROCKET = 'logrocket',
  RAYGUN = 'raygun',
  APPCENTER = 'appcenter',
}

/**
 * Base provider configuration
 */
export interface BaseProviderConfig {
  /**
   * Provider type
   */
  provider: ErrorProviderType;

  /**
   * API key or DSN
   */
  apiKey?: string;

  /**
   * Enable debug mode
   */
  debug?: boolean;

  /**
   * Environment name
   */
  environment?: string;

  /**
   * Release version
   */
  release?: string;

  /**
   * Distribution/build identifier
   */
  dist?: string;

  /**
   * Sample rate (0-1)
   */
  sampleRate?: number;

  /**
   * Maximum breadcrumbs to store
   */
  maxBreadcrumbs?: number;

  /**
   * Enable network tracking
   */
  networkTracking?: boolean;

  /**
   * Enable console tracking
   */
  consoleTracking?: boolean;

  /**
   * Enable automatic session tracking
   */
  autoSessionTracking?: boolean;

  /**
   * Filter errors before sending
   */
  beforeSend?: ErrorTransformer;

  /**
   * Patterns to ignore errors
   */
  ignoreErrors?: (string | RegExp)[];

  /**
   * URLs to ignore
   */
  ignoreUrls?: (string | RegExp)[];

  /**
   * Custom tags to add to all errors
   */
  tags?: Record<string, string>;

  /**
   * Custom context to add to all errors
   */
  context?: Record<string, any>;

  /**
   * Enable offline support
   */
  enableOffline?: boolean;

  /**
   * Maximum offline queue size
   */
  maxOfflineQueueSize?: number;

  /**
   * Offline retry delay in ms
   */
  offlineRetryDelay?: number;

  /**
   * Custom error filters
   */
  errorFilters?: ErrorFilter[];

  /**
   * Minimum error level to report
   */
  minLevel?: ErrorLevel;
}

/**
 * Firebase Crashlytics specific config
 */
export interface FirebaseConfig extends BaseProviderConfig {
  provider: ErrorProviderType.FIREBASE;

  /**
   * Enable crash reporting
   */
  crashlyticsEnabled?: boolean;

  /**
   * Custom keys limit
   */
  customKeysLimit?: number;
}

/**
 * Sentry specific config
 */
export interface SentryConfig extends BaseProviderConfig {
  provider: ErrorProviderType.SENTRY;

  /**
   * Sentry DSN
   */
  dsn?: string;

  /**
   * Traces sample rate (0-1)
   */
  tracesSampleRate?: number;

  /**
   * Profile sample rate (0-1)
   */
  profilesSampleRate?: number;

  /**
   * Integrations configuration
   */
  integrations?: any[];

  /**
   * Transport options
   */
  transportOptions?: Record<string, any>;

  /**
   * Attach stack trace
   */
  attachStacktrace?: boolean;

  /**
   * Enable tracing
   */
  enableTracing?: boolean;
}

/**
 * DataDog RUM specific config
 */
export interface DataDogConfig extends BaseProviderConfig {
  provider: ErrorProviderType.DATADOG;

  /**
   * Application ID
   */
  applicationId?: string;

  /**
   * Client token
   */
  clientToken?: string;

  /**
   * Site (datadoghq.com, datadoghq.eu, etc)
   */
  site?: string;

  /**
   * Service name
   */
  service?: string;

  /**
   * Enable RUM
   */
  enableRum?: boolean;

  /**
   * Track interactions
   */
  trackInteractions?: boolean;

  /**
   * Session sample rate
   */
  sessionSampleRate?: number;
}

/**
 * Bugsnag specific config
 */
export interface BugsnagConfig extends BaseProviderConfig {
  provider: ErrorProviderType.BUGSNAG;

  /**
   * App version
   */
  appVersion?: string;

  /**
   * App type
   */
  appType?: string;

  /**
   * Notify release stages
   */
  enabledReleaseStages?: string[];

  /**
   * Auto detect errors
   */
  autoDetectErrors?: boolean;

  /**
   * Enable breadcrumbs
   */
  enabledBreadcrumbTypes?: string[];

  /**
   * Redacted keys
   */
  redactedKeys?: string[];
}

/**
 * Rollbar specific config
 */
export interface RollbarConfig extends BaseProviderConfig {
  provider: ErrorProviderType.ROLLBAR;

  /**
   * Access token
   */
  accessToken?: string;

  /**
   * Endpoint URL
   */
  endpoint?: string;

  /**
   * Log level
   */
  logLevel?: string;

  /**
   * Report level
   */
  reportLevel?: string;

  /**
   * Capture uncaught
   */
  captureUncaught?: boolean;

  /**
   * Capture unhandled rejections
   */
  captureUnhandledRejections?: boolean;

  /**
   * Payload options
   */
  payload?: Record<string, any>;
}

/**
 * LogRocket specific config
 */
export interface LogRocketConfig extends BaseProviderConfig {
  provider: ErrorProviderType.LOGROCKET;

  /**
   * App ID
   */
  appId?: string;

  /**
   * Enable console capture
   */
  console?: boolean;

  /**
   * Enable network capture
   */
  network?: boolean;

  /**
   * Enable DOM capture
   */
  dom?: boolean;

  /**
   * Redux configuration
   */
  reduxMiddlewareOptions?: Record<string, any>;

  /**
   * Should capture IP
   */
  shouldCaptureIP?: boolean;
}

/**
 * Raygun specific config
 */
export interface RaygunConfig extends BaseProviderConfig {
  provider: ErrorProviderType.RAYGUN;

  /**
   * API endpoint
   */
  apiEndpoint?: string;

  /**
   * Disable anonymous user tracking
   */
  disableAnonymousUserTracking?: boolean;

  /**
   * Disable error tracking
   */
  disableErrorTracking?: boolean;

  /**
   * Disable pulse
   */
  disablePulse?: boolean;

  /**
   * With tags
   */
  withTags?: string[];

  /**
   * Custom data
   */
  customData?: Record<string, any>;
}

/**
 * AppCenter specific config
 */
export interface AppCenterConfig extends BaseProviderConfig {
  provider: ErrorProviderType.APPCENTER;

  /**
   * App secret
   */
  appSecret?: string;

  /**
   * Use in production
   */
  useInProduction?: boolean;

  /**
   * Log level
   */
  logLevel?: number;

  /**
   * Country code
   */
  countryCode?: string;

  /**
   * User ID
   */
  userId?: string;
}

/**
 * Provider configuration union type
 */
export type ProviderConfig =
  | FirebaseConfig
  | SentryConfig
  | DataDogConfig
  | BugsnagConfig
  | RollbarConfig
  | LogRocketConfig
  | RaygunConfig
  | AppCenterConfig;

/**
 * Unified error handling configuration
 */
export interface UnifiedErrorConfig {
  /**
   * Active provider configuration
   */
  provider: ProviderConfig;

  /**
   * Enable multiple providers
   */
  multiProvider?: boolean;

  /**
   * Additional provider configurations
   */
  additionalProviders?: ProviderConfig[];

  /**
   * Global error filters
   */
  globalFilters?: ErrorFilter[];

  /**
   * Global error transformers
   */
  globalTransformers?: ErrorTransformer[];

  /**
   * Enable automatic error capture
   */
  autoCaptureErrors?: boolean;

  /**
   * Enable performance monitoring
   */
  enablePerformance?: boolean;

  /**
   * Privacy settings
   */
  privacy?: {
    /**
     * Scrub PII from errors
     */
    scrubPII?: boolean;

    /**
     * PII patterns to scrub
     */
    piiPatterns?: RegExp[];

    /**
     * Fields to redact
     */
    redactedFields?: string[];
  };

  /**
   * Development settings
   */
  development?: {
    /**
     * Enable in development
     */
    enabled?: boolean;

    /**
     * Show error dialog
     */
    showDialog?: boolean;

    /**
     * Console output
     */
    consoleOutput?: boolean;
  };
}
