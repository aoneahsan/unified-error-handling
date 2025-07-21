import { NormalizedError, UserContext, Breadcrumb, ErrorContext, ErrorLevel } from './errors';
import { ProviderConfig } from './config';

/**
 * Base error provider interface
 */
export interface ErrorProvider {
  /**
   * Provider name
   */
  readonly name: string;

  /**
   * Provider version
   */
  readonly version: string;

  /**
   * Is provider initialized
   */
  readonly isInitialized: boolean;

  /**
   * Initialize the provider
   */
  initialize(config: ProviderConfig): Promise<void>;

  /**
   * Log an error
   */
  logError(error: NormalizedError): Promise<void>;

  /**
   * Log a message
   */
  logMessage(message: string, level: ErrorLevel, context?: ErrorContext): Promise<void>;

  /**
   * Set user context
   */
  setUser(user: UserContext | null): Promise<void>;

  /**
   * Set custom context
   */
  setContext(key: string, context: any): Promise<void>;

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: Breadcrumb): Promise<void>;

  /**
   * Set tags
   */
  setTags(tags: Record<string, string>): Promise<void>;

  /**
   * Set extra data
   */
  setExtra(key: string, value: any): Promise<void>;

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs(): Promise<void>;

  /**
   * Flush pending errors
   */
  flush(timeout?: number): Promise<boolean>;

  /**
   * Destroy the provider
   */
  destroy(): Promise<void>;

  /**
   * Check if provider supports a feature
   */
  supportsFeature(feature: ProviderFeature): boolean;

  /**
   * Get provider capabilities
   */
  getCapabilities(): ProviderCapabilities;
}

/**
 * Provider features
 */
export enum ProviderFeature {
  BREADCRUMBS = 'breadcrumbs',
  USER_CONTEXT = 'userContext',
  CUSTOM_CONTEXT = 'customContext',
  TAGS = 'tags',
  EXTRA_DATA = 'extraData',
  OFFLINE_SUPPORT = 'offlineSupport',
  SESSION_TRACKING = 'sessionTracking',
  PERFORMANCE = 'performance',
  NETWORK_TRACKING = 'networkTracking',
  CONSOLE_TRACKING = 'consoleTracking',
  ERROR_FILTERING = 'errorFiltering',
  ERROR_GROUPING = 'errorGrouping',
  SOURCE_MAPS = 'sourceMaps',
  SCREENSHOTS = 'screenshots',
  SESSION_REPLAY = 'sessionReplay',
  USER_FEEDBACK = 'userFeedback',
  RELEASE_TRACKING = 'releaseTracking',
  CUSTOM_ENDPOINTS = 'customEndpoints',
  ANALYTICS = 'analytics',
  PERFORMANCE_MONITORING = 'performanceMonitoring',
  ATTACHMENTS = 'attachments',
  TELEMETRY = 'telemetry',
}

/**
 * Provider capabilities
 */
export interface ProviderCapabilities {
  /**
   * Supported features
   */
  features: ProviderFeature[];

  /**
   * Maximum breadcrumb count
   */
  maxBreadcrumbs: number;

  /**
   * Maximum context size
   */
  maxContextSize: number;

  /**
   * Maximum tag count
   */
  maxTags: number;

  /**
   * Supports offline queue
   */
  supportsOffline: boolean;

  /**
   * Supports batching
   */
  supportsBatching: boolean;

  /**
   * Platform support
   */
  platforms: {
    ios: boolean;
    android: boolean;
    web: boolean;
  };
}

/**
 * Provider factory function
 */
export type ProviderFactory = () => ErrorProvider;

/**
 * Provider registry interface
 */
export interface ProviderRegistry {
  /**
   * Register a provider
   */
  register(name: string, factory: ProviderFactory): void;

  /**
   * Get a provider
   */
  get(name: string): ErrorProvider | undefined;

  /**
   * Check if provider exists
   */
  has(name: string): boolean;

  /**
   * Get all registered providers
   */
  getAll(): Map<string, ProviderFactory>;

  /**
   * Unregister a provider
   */
  unregister(name: string): boolean;
}

/**
 * Provider state
 */
export interface ProviderState {
  /**
   * Is initialized
   */
  initialized: boolean;

  /**
   * Is enabled
   */
  enabled: boolean;

  /**
   * Current configuration
   */
  config?: ProviderConfig;

  /**
   * Error count
   */
  errorCount: number;

  /**
   * Last error timestamp
   */
  lastErrorTimestamp?: number;

  /**
   * Queue size
   */
  queueSize: number;
}

/**
 * Provider metrics
 */
export interface ProviderMetrics {
  /**
   * Total errors sent
   */
  totalErrors: number;

  /**
   * Errors sent successfully
   */
  successfulErrors: number;

  /**
   * Failed error sends
   */
  failedErrors: number;

  /**
   * Average send time in ms
   */
  averageSendTime: number;

  /**
   * Queue high water mark
   */
  maxQueueSize: number;

  /**
   * Dropped errors
   */
  droppedErrors: number;
}
