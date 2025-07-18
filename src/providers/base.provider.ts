import {
  ErrorProvider,
  ProviderCapabilities,
  ProviderFeature,
  ProviderState,
  NormalizedError,
  UserContext,
  Breadcrumb,
  ErrorContext,
  ErrorLevel,
  ProviderConfig,
} from '@/types';

/**
 * Abstract base class for all error providers
 */
export abstract class BaseProvider implements ErrorProvider {
  /**
   * Provider name
   */
  abstract readonly name: string;

  /**
   * Provider version
   */
  abstract readonly version: string;

  /**
   * Provider state
   */
  protected state: ProviderState = {
    initialized: false,
    enabled: true,
    errorCount: 0,
    queueSize: 0,
  };

  /**
   * Provider configuration
   */
  protected config?: ProviderConfig;

  /**
   * Breadcrumbs storage
   */
  protected breadcrumbs: Breadcrumb[] = [];

  /**
   * User context
   */
  protected userContext: UserContext | null = null;

  /**
   * Custom context
   */
  protected customContext: Map<string, any> = new Map();

  /**
   * Tags
   */
  protected tags: Map<string, string> = new Map();

  /**
   * Extra data
   */
  protected extraData: Map<string, any> = new Map();

  /**
   * Get initialization status
   */
  get isInitialized(): boolean {
    return this.state.initialized;
  }

  /**
   * Initialize the provider
   */
  async initialize(config: ProviderConfig): Promise<void> {
    if (this.state.initialized) {
      throw new Error(`${this.name} provider is already initialized`);
    }

    this.config = config;

    // Apply global configuration
    if (config.tags) {
      Object.entries(config.tags).forEach(([key, value]) => {
        this.tags.set(key, value);
      });
    }

    if (config.context) {
      Object.entries(config.context).forEach(([key, value]) => {
        this.customContext.set(key, value);
      });
    }

    // Initialize provider-specific implementation
    await this.initializeProvider(config);

    this.state.initialized = true;
    this.state.config = config;
  }

  /**
   * Log an error
   */
  async logError(error: NormalizedError): Promise<void> {
    this.ensureInitialized();

    if (!this.state.enabled) {
      return;
    }

    // Apply filters
    if (!this.shouldReportError(error)) {
      return;
    }

    // Transform error
    const transformedError = await this.transformError(error);
    if (!transformedError) {
      return;
    }

    // Enrich error with context
    const enrichedError = this.enrichError(transformedError);

    // Send to provider
    try {
      await this.sendError(enrichedError);
      this.state.errorCount++;
      this.state.lastErrorTimestamp = Date.now();
    } catch (err) {
      console.error(`Failed to send error to ${this.name}:`, err);
      throw err;
    }
  }

  /**
   * Log a message
   */
  async logMessage(
    message: string,
    level: ErrorLevel = ErrorLevel.INFO,
    context?: ErrorContext
  ): Promise<void> {
    this.ensureInitialized();

    if (!this.state.enabled) {
      return;
    }

    const error: NormalizedError = {
      message,
      name: 'LogMessage',
      level,
      timestamp: Date.now(),
      context: context?.context,
      tags: context?.tags,
      user: context?.user || this.userContext || undefined,
      metadata: context?.metadata,
    };

    await this.logError(error);
  }

  /**
   * Set user context
   */
  async setUser(user: UserContext | null): Promise<void> {
    this.ensureInitialized();
    this.userContext = user;
    await this.updateUserContext(user);
  }

  /**
   * Set custom context
   */
  async setContext(key: string, context: any): Promise<void> {
    this.ensureInitialized();
    this.customContext.set(key, context);
    await this.updateCustomContext(key, context);
  }

  /**
   * Add breadcrumb
   */
  async addBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    this.ensureInitialized();

    if (!this.supportsFeature(ProviderFeature.BREADCRUMBS)) {
      return;
    }

    // Add timestamp if not provided
    if (!breadcrumb.timestamp) {
      breadcrumb.timestamp = Date.now();
    }

    this.breadcrumbs.push(breadcrumb);

    // Limit breadcrumbs
    const maxBreadcrumbs = this.config?.maxBreadcrumbs || this.getCapabilities().maxBreadcrumbs;
    if (this.breadcrumbs.length > maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-maxBreadcrumbs);
    }

    await this.updateBreadcrumb(breadcrumb);
  }

  /**
   * Set tags
   */
  async setTags(tags: Record<string, string>): Promise<void> {
    this.ensureInitialized();

    Object.entries(tags).forEach(([key, value]) => {
      this.tags.set(key, value);
    });

    await this.updateTags(tags);
  }

  /**
   * Set extra data
   */
  async setExtra(key: string, value: any): Promise<void> {
    this.ensureInitialized();
    this.extraData.set(key, value);
    await this.updateExtraData(key, value);
  }

  /**
   * Clear breadcrumbs
   */
  async clearBreadcrumbs(): Promise<void> {
    this.ensureInitialized();
    this.breadcrumbs = [];
    await this.clearProviderBreadcrumbs();
  }

  /**
   * Flush pending errors
   */
  abstract flush(timeout?: number): Promise<boolean>;

  /**
   * Destroy the provider
   */
  async destroy(): Promise<void> {
    if (!this.state.initialized) {
      return;
    }

    await this.destroyProvider();

    this.state.initialized = false;
    this.state.enabled = false;
    this.breadcrumbs = [];
    this.userContext = null;
    this.customContext.clear();
    this.tags.clear();
    this.extraData.clear();
  }

  /**
   * Check if provider supports a feature
   */
  abstract supportsFeature(feature: ProviderFeature): boolean;

  /**
   * Get provider capabilities
   */
  abstract getCapabilities(): ProviderCapabilities;

  /**
   * Provider-specific initialization
   */
  protected abstract initializeProvider(config: ProviderConfig): Promise<void>;

  /**
   * Send error to provider
   */
  protected abstract sendError(error: NormalizedError): Promise<void>;

  /**
   * Update user context in provider
   */
  protected abstract updateUserContext(user: UserContext | null): Promise<void>;

  /**
   * Update custom context in provider
   */
  protected abstract updateCustomContext(key: string, context: any): Promise<void>;

  /**
   * Update breadcrumb in provider
   */
  protected abstract updateBreadcrumb(breadcrumb: Breadcrumb): Promise<void>;

  /**
   * Update tags in provider
   */
  protected abstract updateTags(tags: Record<string, string>): Promise<void>;

  /**
   * Update extra data in provider
   */
  protected abstract updateExtraData(key: string, value: any): Promise<void>;

  /**
   * Clear provider breadcrumbs
   */
  protected abstract clearProviderBreadcrumbs(): Promise<void>;

  /**
   * Destroy provider-specific resources
   */
  protected abstract destroyProvider(): Promise<void>;

  /**
   * Ensure provider is initialized
   */
  protected ensureInitialized(): void {
    if (!this.state.initialized) {
      throw new Error(`${this.name} provider is not initialized`);
    }
  }

  /**
   * Check if error should be reported
   */
  protected shouldReportError(error: NormalizedError): boolean {
    if (!this.config) {
      return true;
    }

    // Check minimum level
    if (this.config.minLevel) {
      const levels = Object.values(ErrorLevel);
      const minIndex = levels.indexOf(this.config.minLevel);
      const errorIndex = levels.indexOf(error.level);
      if (errorIndex < minIndex) {
        return false;
      }
    }

    // Check ignore patterns
    if (this.config.ignoreErrors) {
      for (const pattern of this.config.ignoreErrors) {
        if (typeof pattern === 'string') {
          if (error.message.includes(pattern) || error.name.includes(pattern)) {
            return false;
          }
        } else if (pattern instanceof RegExp) {
          if (pattern.test(error.message) || pattern.test(error.name)) {
            return false;
          }
        }
      }
    }

    // Check custom filters
    if (this.config.errorFilters) {
      for (const filter of this.config.errorFilters) {
        if (!filter(error)) {
          return false;
        }
      }
    }

    // Check sample rate
    if (this.config.sampleRate !== undefined && this.config.sampleRate < 1) {
      return Math.random() < this.config.sampleRate;
    }

    return true;
  }

  /**
   * Transform error before sending
   */
  protected async transformError(error: NormalizedError): Promise<NormalizedError | null> {
    let transformed = error;

    // Apply beforeSend transformer
    if (this.config?.beforeSend) {
      const beforeSendResult = this.config.beforeSend(transformed);
      if (!beforeSendResult) {
        return null;
      }
      transformed = beforeSendResult;
    }

    return transformed;
  }

  /**
   * Enrich error with context
   */
  protected enrichError(error: NormalizedError): NormalizedError {
    return {
      ...error,
      user: error.user || this.userContext || undefined,
      tags: {
        ...Object.fromEntries(this.tags),
        ...error.tags,
      },
      context: {
        ...Object.fromEntries(this.customContext),
        ...error.context,
      },
      metadata: {
        ...Object.fromEntries(this.extraData),
        ...error.metadata,
      },
      app: {
        ...error.app,
        environment: this.config?.environment,
        release: this.config?.release,
      },
    };
  }
}