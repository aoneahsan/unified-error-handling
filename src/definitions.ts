import {
  ErrorContext,
  UserContext,
  Breadcrumb,
  ErrorLevel,
  UnifiedErrorConfig,
  ProviderConfig,
  ErrorProviderType,
} from './types';

/**
 * Unified Error Handling Plugin Interface
 */
export interface UnifiedErrorHandlingPlugin {
  /**
   * Initialize the error handler with configuration
   * @param config - Unified error configuration
   * @returns Promise that resolves when initialized
   */
  initialize(config: UnifiedErrorConfig): Promise<void>;

  /**
   * Log an error
   * @param error - Error object or message
   * @param context - Optional error context
   * @returns Promise that resolves when error is logged
   */
  logError(error: Error | string, context?: ErrorContext): Promise<void>;

  /**
   * Log a message at a specific level
   * @param message - Message to log
   * @param level - Log level
   * @param context - Optional context
   * @returns Promise that resolves when message is logged
   */
  logMessage(message: string, level?: ErrorLevel, context?: ErrorContext): Promise<void>;

  /**
   * Set the current user context
   * @param user - User context or null to clear
   * @returns Promise that resolves when user is set
   */
  setUser(user: UserContext | null): Promise<void>;

  /**
   * Set custom context data
   * @param key - Context key
   * @param value - Context value
   * @returns Promise that resolves when context is set
   */
  setContext(key: string, value: any): Promise<void>;

  /**
   * Add a breadcrumb
   * @param breadcrumb - Breadcrumb to add
   * @returns Promise that resolves when breadcrumb is added
   */
  addBreadcrumb(breadcrumb: Breadcrumb): Promise<void>;

  /**
   * Set multiple tags
   * @param tags - Tags to set
   * @returns Promise that resolves when tags are set
   */
  setTags(tags: Record<string, string>): Promise<void>;

  /**
   * Set a single tag
   * @param key - Tag key
   * @param value - Tag value
   * @returns Promise that resolves when tag is set
   */
  setTag(key: string, value: string): Promise<void>;

  /**
   * Set extra data
   * @param key - Extra data key
   * @param value - Extra data value
   * @returns Promise that resolves when extra is set
   */
  setExtra(key: string, value: any): Promise<void>;

  /**
   * Clear all breadcrumbs
   * @returns Promise that resolves when breadcrumbs are cleared
   */
  clearBreadcrumbs(): Promise<void>;

  /**
   * Clear the current user
   * @returns Promise that resolves when user is cleared
   */
  clearUser(): Promise<void>;

  /**
   * Switch to a different error provider
   * @param provider - Provider type to switch to
   * @param config - Provider configuration
   * @returns Promise that resolves when provider is switched
   */
  switchProvider(provider: ErrorProviderType, config?: ProviderConfig): Promise<void>;

  /**
   * Get the current provider type
   * @returns Promise that resolves with current provider type
   */
  getCurrentProvider(): Promise<{ provider: ErrorProviderType }>;

  /**
   * Flush any pending errors
   * @param timeout - Optional timeout in milliseconds
   * @returns Promise that resolves with success boolean
   */
  flush(timeout?: number): Promise<{ success: boolean }>;

  /**
   * Check if the plugin is initialized
   * @returns Promise that resolves with initialization status
   */
  isInitialized(): Promise<{ initialized: boolean }>;

  /**
   * Get plugin metrics
   * @returns Promise that resolves with metrics data
   */
  getMetrics(): Promise<{
    totalErrors: number;
    successfulErrors: number;
    failedErrors: number;
    queueSize: number;
  }>;

  /**
   * Enable or disable error handling
   * @param enabled - Whether to enable error handling
   * @returns Promise that resolves when state is changed
   */
  setEnabled(enabled: boolean): Promise<void>;

  /**
   * Test error logging (for debugging)
   * @returns Promise that resolves when test error is sent
   */
  testError(): Promise<void>;

  /**
   * Native platform test (iOS/Android only)
   * @returns Promise that resolves when native test completes
   */
  testNativeCrash(): Promise<void>;
}

/**
 * Plugin initialization options
 */
export interface InitializeOptions extends UnifiedErrorConfig {
  /**
   * Auto-detect configuration from environment
   */
  autoDetect?: boolean;

  /**
   * Configuration file path
   */
  configPath?: string;

  /**
   * Lazy initialization
   */
  lazy?: boolean;
}

/**
 * Error logging options
 */
export interface LogErrorOptions extends ErrorContext {
  /**
   * Stack trace to use
   */
  stackTrace?: string;

  /**
   * Whether to capture screenshot
   */
  captureScreenshot?: boolean;

  /**
   * Additional attachments
   */
  attachments?: Array<{
    filename: string;
    data: string;
    contentType: string;
  }>;
}

/**
 * Provider switch options
 */
export interface SwitchProviderOptions {
  /**
   * Flush errors before switching
   */
  flushBeforeSwitch?: boolean;

  /**
   * Preserve user context
   */
  preserveUserContext?: boolean;

  /**
   * Preserve breadcrumbs
   */
  preserveBreadcrumbs?: boolean;

  /**
   * Preserve tags
   */
  preserveTags?: boolean;
}
