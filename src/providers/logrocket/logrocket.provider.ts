import { BaseProvider } from '../base.provider';
import {
  NormalizedError,
  UserContext,
  Breadcrumb,
  ProviderCapabilities,
  ProviderFeature,
  ProviderConfig,
  LogRocketConfig,
  ErrorLevel,
} from '@/types';

/**
 * LogRocket provider implementation
 */
export class LogRocketProvider extends BaseProvider {
  readonly name = 'logrocket';
  readonly version = '1.0.0';

  private logrocket: any;

  protected async initializeProvider(config: ProviderConfig): Promise<void> {
    const logRocketConfig = config as LogRocketConfig;

    if (!logRocketConfig.appId && !logRocketConfig.apiKey) {
      throw new Error('LogRocket app ID or API key is required');
    }

    try {
      const LogRocket = await import('logrocket');
      this.logrocket = LogRocket.default;

      // Initialize LogRocket
      this.logrocket.init(logRocketConfig.appId || logRocketConfig.apiKey, {
        console: logRocketConfig.console !== false,
        network: logRocketConfig.network !== false,
        dom: logRocketConfig.dom !== false,
        shouldCaptureIP: logRocketConfig.shouldCaptureIP !== false,
        release: logRocketConfig.release,
        // serverURL: logRocketConfig.serverURL,
        reduxMiddleware: logRocketConfig.reduxMiddlewareOptions,
      });

      this.state.initialized = true;
    } catch (error) {
      console.error('Failed to initialize LogRocket provider:', error);
      throw error;
    }
  }

  protected async sendError(error: NormalizedError): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('LogRocket provider not initialized');
    }

    try {
      // Set context for this error
      if (error.user) {
        this.logrocket.identify(error.user.id, {
          email: error.user.email,
          name: error.user.username,
          ...error.user,
        });
      }

      // Send error
      if (error.originalError instanceof Error) {
        this.logrocket.captureException(error.originalError, {
          tags: error.tags,
          extra: {
            ...error.context,
            ...error.metadata,
          },
        });
      } else {
        this.logrocket.captureMessage(error.message, {
          level: this.mapErrorLevelToLogRocket(error.level),
          tags: error.tags,
          extra: {
            ...error.context,
            ...error.metadata,
          },
        });
      }
    } catch (err) {
      console.error('Failed to send error to LogRocket:', err);
      throw err;
    }
  }

  protected async updateUserContext(user: UserContext | null): Promise<void> {
    if (!this.isInitialized) return;

    try {
      if (user) {
        this.logrocket.identify(user.id, {
          email: user.email,
          name: user.username,
          ...user,
        });
      } else {
        this.logrocket.identify(null);
      }
    } catch (error) {
      console.error('Failed to update user context:', error);
    }
  }

  protected async updateCustomContext(key: string, context: any): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.logrocket.addMetadata(key, context);
    } catch (error) {
      console.error('Failed to update custom context:', error);
    }
  }

  protected async updateBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // LogRocket doesn't have native breadcrumb support
      // We'll use console logging which LogRocket captures
      console.log(`[Breadcrumb] ${breadcrumb.message}`, {
        category: breadcrumb.category,
        level: breadcrumb.level,
        data: breadcrumb.data,
      });
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }

  protected async updateTags(tags: Record<string, string>): Promise<void> {
    if (!this.isInitialized) return;

    try {
      Object.entries(tags).forEach(([key, value]) => {
        this.logrocket.addMetadata(key, value);
      });
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  }

  protected async updateExtraData(key: string, value: any): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.logrocket.addMetadata(key, value);
    } catch (error) {
      console.error('Failed to update extra data:', error);
    }
  }

  protected async clearProviderBreadcrumbs(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // LogRocket doesn't support clearing breadcrumbs
      console.warn('LogRocket does not support clearing breadcrumbs');
    } catch (error) {
      console.error('Failed to clear breadcrumbs:', error);
    }
  }

  protected async destroyProvider(): Promise<void> {
    this.state.initialized = false;
    this.logrocket = null;
  }

  async flush(_timeout?: number): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      // LogRocket doesn't have a flush method
      return true;
    } catch (error) {
      console.error('Failed to flush LogRocket:', error);
      return false;
    }
  }

  supportsFeature(feature: ProviderFeature): boolean {
    const supportedFeatures = [
      ProviderFeature.USER_CONTEXT,
      ProviderFeature.CUSTOM_CONTEXT,
      ProviderFeature.TAGS,
      ProviderFeature.EXTRA_DATA,
      ProviderFeature.ERROR_FILTERING,
      ProviderFeature.RELEASE_TRACKING,
      ProviderFeature.SESSION_REPLAY,
    ];

    return supportedFeatures.includes(feature);
  }

  getCapabilities(): ProviderCapabilities {
    return {
      features: [
        ProviderFeature.USER_CONTEXT,
        ProviderFeature.CUSTOM_CONTEXT,
        ProviderFeature.TAGS,
        ProviderFeature.EXTRA_DATA,
        ProviderFeature.ERROR_FILTERING,
        ProviderFeature.RELEASE_TRACKING,
        ProviderFeature.SESSION_REPLAY,
      ],
      maxBreadcrumbs: 100,
      maxContextSize: 1000,
      maxTags: 200,
      supportsOffline: false,
      supportsBatching: true,
      platforms: {
        ios: false,
        android: false,
        web: true,
      },
    };
  }

  /**
   * Map error level to LogRocket level
   */
  private mapErrorLevelToLogRocket(level: ErrorLevel): string {
    switch (level) {
      case ErrorLevel.DEBUG:
        return 'debug';
      case ErrorLevel.INFO:
        return 'info';
      case ErrorLevel.WARNING:
        return 'warning';
      case ErrorLevel.ERROR:
        return 'error';
      case ErrorLevel.FATAL:
        return 'error';
      default:
        return 'error';
    }
  }

  /**
   * Start a new session
   */
  async startSession(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.logrocket.startNewSession();
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }

  /**
   * Get session URL
   */
  async getSessionURL(): Promise<string | null> {
    if (!this.isInitialized) return null;

    try {
      return this.logrocket.getSessionURL();
    } catch (error) {
      console.error('Failed to get session URL:', error);
      return null;
    }
  }

  /**
   * Track custom event
   */
  async track(eventName: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.logrocket.track(eventName, properties);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }
}