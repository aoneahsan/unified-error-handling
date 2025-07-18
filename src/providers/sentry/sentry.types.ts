import { SentryConfig } from '@/types/config';

/**
 * Sentry SDK specific types
 */
export interface SentryOptions extends SentryConfig {
  /**
   * Sentry DSN (Data Source Name)
   */
  dsn: string;

  /**
   * Enable debug mode
   */
  debug?: boolean;

  /**
   * Sample rate (0.0 to 1.0)
   */
  sampleRate?: number;

  /**
   * Traces sample rate for performance monitoring (0.0 to 1.0)
   */
  tracesSampleRate?: number;

  /**
   * Maximum breadcrumbs to store
   */
  maxBreadcrumbs?: number;

  /**
   * Attach stack trace to messages
   */
  attachStacktrace?: boolean;

  /**
   * Auto session tracking
   */
  autoSessionTracking?: boolean;

  /**
   * Session tracking interval in ms
   */
  sessionTrackingIntervalMillis?: number;

  /**
   * Enable native crash handling (mobile only)
   */
  enableNativeCrashHandling?: boolean;

  /**
   * Enable auto breadcrumbs
   */
  enableAutoBreadcrumbs?: {
    console?: boolean;
    dom?: boolean;
    fetch?: boolean;
    history?: boolean;
    sentry?: boolean;
    xhr?: boolean;
  };

  /**
   * Before send hook
   */
  beforeSend?: (event: any, hint?: any) => any | null;

  /**
   * Before breadcrumb hook
   */
  beforeBreadcrumb?: (breadcrumb: any, hint?: any) => any | null;

  /**
   * Integrations to include
   */
  integrations?: any[];

  /**
   * Transport options
   */
  transportOptions?: {
    headers?: Record<string, string>;
  };

  /**
   * Ignored errors patterns
   */
  ignoreErrors?: Array<string | RegExp>;

  /**
   * Denied URLs patterns
   */
  denyUrls?: Array<string | RegExp>;

  /**
   * Allowed URLs patterns
   */
  allowUrls?: Array<string | RegExp>;

  /**
   * Initial scope
   */
  initialScope?: {
    tags?: Record<string, string>;
    user?: any;
    level?: string;
    context?: Record<string, any>;
  };
}

/**
 * Sentry severity levels
 */
export enum SentrySeverity {
  FATAL = 'fatal',
  ERROR = 'error',
  WARNING = 'warning',
  LOG = 'log',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Sentry breadcrumb types
 */
export enum SentryBreadcrumbType {
  DEFAULT = 'default',
  DEBUG = 'debug',
  ERROR = 'error',
  NAVIGATION = 'navigation',
  HTTP = 'http',
  INFO = 'info',
  QUERY = 'query',
  TRANSACTION = 'transaction',
  UI = 'ui',
  USER = 'user',
}

/**
 * Sentry transaction status
 */
export enum SentryTransactionStatus {
  OK = 'ok',
  CANCELLED = 'cancelled',
  UNKNOWN = 'unknown',
  INVALID_ARGUMENT = 'invalid_argument',
  DEADLINE_EXCEEDED = 'deadline_exceeded',
  NOT_FOUND = 'not_found',
  ALREADY_EXISTS = 'already_exists',
  PERMISSION_DENIED = 'permission_denied',
  RESOURCE_EXHAUSTED = 'resource_exhausted',
  FAILED_PRECONDITION = 'failed_precondition',
  ABORTED = 'aborted',
  OUT_OF_RANGE = 'out_of_range',
  UNIMPLEMENTED = 'unimplemented',
  INTERNAL_ERROR = 'internal_error',
  UNAVAILABLE = 'unavailable',
  DATA_LOSS = 'data_loss',
  UNAUTHENTICATED = 'unauthenticated',
}
