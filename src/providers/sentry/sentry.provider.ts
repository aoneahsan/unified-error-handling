import { BaseProvider } from '../base.provider';
import {
  NormalizedError,
  UserContext,
  Breadcrumb,
  ProviderCapabilities,
  ProviderFeature,
  ProviderConfig,
  SentryConfig,
  ErrorLevel,
} from '@/types';

/**
 * Sentry provider implementation
 */
export class SentryProvider extends BaseProvider {
  readonly name = 'sentry';
  readonly version = '1.0.0';

  private sentry: any;
  // private _sentryCapacitor: any;
  private isWeb: boolean = false;

  protected async initializeProvider(config: ProviderConfig): Promise<void> {
    const sentryConfig = config as SentryConfig;

    if (!sentryConfig.dsn && !sentryConfig.apiKey) {
      throw new Error('Sentry DSN or API key is required');
    }

    try {
      // Check if we're on web or native
      const { Capacitor } = await import('@capacitor/core');
      this.isWeb = Capacitor.getPlatform() === 'web';

      if (this.isWeb) {
        // Web implementation
        const { init, getCurrentScope, captureException, captureMessage, addBreadcrumb } = await import('@sentry/browser');
        this.sentry = { init, getCurrentScope, captureException, captureMessage, addBreadcrumb };
      } else {
        // Native implementation
        try {
          const { init, getCurrentScope, captureException, captureMessage, addBreadcrumb } = await import('@sentry/capacitor');
          this.sentry = { init, getCurrentScope, captureException, captureMessage, addBreadcrumb };
        } catch (error) {
          console.warn('Sentry Capacitor not available, falling back to browser SDK');
          const { init, getCurrentScope, captureException, captureMessage, addBreadcrumb } = await import('@sentry/browser');
          this.sentry = { init, getCurrentScope, captureException, captureMessage, addBreadcrumb };
        }
      }

      // Initialize Sentry
      await this.sentry.init({
        dsn: sentryConfig.dsn || sentryConfig.apiKey,
        debug: sentryConfig.debug || false,
        environment: sentryConfig.environment || 'production',
        release: sentryConfig.release,
        dist: sentryConfig.dist,
        sampleRate: sentryConfig.sampleRate || 1.0,
        tracesSampleRate: sentryConfig.tracesSampleRate || 0.1,
        profilesSampleRate: sentryConfig.profilesSampleRate || 0.1,
        maxBreadcrumbs: sentryConfig.maxBreadcrumbs || 100,
        beforeSend: (event: any) => {
          // Apply global beforeSend filter
          if (sentryConfig.beforeSend) {
            const normalizedError: NormalizedError = {
              message: event.message || event.exception?.values?.[0]?.value || 'Unknown error',
              name: event.exception?.values?.[0]?.type || 'Error',
              level: this.mapSentryLevel(event.level),
              timestamp: Date.now(),
              stack: event.exception?.values?.[0]?.stacktrace?.frames,
              context: event.contexts,
              tags: event.tags,
              user: event.user,
              metadata: event.extra,
            };
            const transformedError = sentryConfig.beforeSend(normalizedError);
            return transformedError ? event : null;
          }
          return event;
        },
        ignoreErrors: sentryConfig.ignoreErrors || [],
        denyUrls: sentryConfig.ignoreUrls || [],
        attachStacktrace: sentryConfig.attachStacktrace !== false,
        autoSessionTracking: sentryConfig.autoSessionTracking !== false,
        integrations: sentryConfig.integrations || [],
        transport: sentryConfig.transportOptions,
      });

      this.state.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Sentry provider:', error);
      throw error;
    }
  }

  protected async sendError(error: NormalizedError): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Sentry provider not initialized');
    }

    try {
      // Set context for this error
      const scope = this.sentry.getCurrentScope();

      // Set user context
      if (error.user) {
        scope.setUser(error.user);
      }

      // Set tags
      if (error.tags) {
        Object.entries(error.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }

      // Set context
      if (error.context) {
        Object.entries(error.context).forEach(([key, value]) => {
          scope.setContext(key, value);
        });
      }

      // Set extra data
      if (error.metadata) {
        Object.entries(error.metadata).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      // Set level
      scope.setLevel(this.mapErrorLevelToSentry(error.level));

      // Send error
      if (error.originalError instanceof Error) {
        await this.sentry.captureException(error.originalError);
      } else {
        await this.sentry.captureMessage(error.message, this.mapErrorLevelToSentry(error.level));
      }
    } catch (err) {
      console.error('Failed to send error to Sentry:', err);
      throw err;
    }
  }

  protected async updateUserContext(user: UserContext | null): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const scope = this.sentry.getCurrentScope();
      scope.setUser(user);
    } catch (error) {
      console.error('Failed to update user context:', error);
    }
  }

  protected async updateCustomContext(key: string, context: any): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const scope = this.sentry.getCurrentScope();
      scope.setContext(key, context);
    } catch (error) {
      console.error('Failed to update custom context:', error);
    }
  }

  protected async updateBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await this.sentry.addBreadcrumb({
        message: breadcrumb.message,
        category: breadcrumb.category || 'default',
        level: this.mapErrorLevelToSentry(breadcrumb.level || ErrorLevel.INFO),
        timestamp: breadcrumb.timestamp ? breadcrumb.timestamp / 1000 : Date.now() / 1000,
        data: breadcrumb.data,
      });
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }

  protected async updateTags(tags: Record<string, string>): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const scope = this.sentry.getCurrentScope();
      Object.entries(tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  }

  protected async updateExtraData(key: string, value: any): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const scope = this.sentry.getCurrentScope();
      scope.setExtra(key, value);
    } catch (error) {
      console.error('Failed to update extra data:', error);
    }
  }

  protected async clearProviderBreadcrumbs(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const scope = this.sentry.getCurrentScope();
      scope.clearBreadcrumbs();
    } catch (error) {
      console.error('Failed to clear breadcrumbs:', error);
    }
  }

  protected async destroyProvider(): Promise<void> {
    this.state.initialized = false;
    this.sentry = null;
    // this._sentryCapacitor = null;
  }

  async flush(timeout?: number): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      const { flush } = await import('@sentry/core');
      await flush(timeout || 2000);
      return true;
    } catch (error) {
      console.error('Failed to flush Sentry:', error);
      return false;
    }
  }

  supportsFeature(feature: ProviderFeature): boolean {
    const supportedFeatures = [
      ProviderFeature.BREADCRUMBS,
      ProviderFeature.USER_CONTEXT,
      ProviderFeature.CUSTOM_CONTEXT,
      ProviderFeature.TAGS,
      ProviderFeature.EXTRA_DATA,
      ProviderFeature.ERROR_FILTERING,
      ProviderFeature.RELEASE_TRACKING,
      ProviderFeature.PERFORMANCE_MONITORING,
      ProviderFeature.SESSION_TRACKING,
      ProviderFeature.ATTACHMENTS,
    ];

    return supportedFeatures.includes(feature);
  }

  getCapabilities(): ProviderCapabilities {
    return {
      features: [
        ProviderFeature.BREADCRUMBS,
        ProviderFeature.USER_CONTEXT,
        ProviderFeature.CUSTOM_CONTEXT,
        ProviderFeature.TAGS,
        ProviderFeature.EXTRA_DATA,
        ProviderFeature.ERROR_FILTERING,
        ProviderFeature.RELEASE_TRACKING,
        ProviderFeature.PERFORMANCE_MONITORING,
        ProviderFeature.SESSION_TRACKING,
        ProviderFeature.ATTACHMENTS,
      ],
      maxBreadcrumbs: 100,
      maxContextSize: 1000,
      maxTags: 200,
      supportsOffline: true,
      supportsBatching: true,
      platforms: {
        ios: true,
        android: true,
        web: true,
      },
    };
  }

  /**
   * Map error level to Sentry level
   */
  private mapErrorLevelToSentry(level: ErrorLevel): string {
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
        return 'fatal';
      default:
        return 'error';
    }
  }

  /**
   * Map Sentry level to error level
   */
  private mapSentryLevel(level: string): ErrorLevel {
    switch (level) {
      case 'debug':
        return ErrorLevel.DEBUG;
      case 'info':
        return ErrorLevel.INFO;
      case 'warning':
        return ErrorLevel.WARNING;
      case 'error':
        return ErrorLevel.ERROR;
      case 'fatal':
        return ErrorLevel.FATAL;
      default:
        return ErrorLevel.ERROR;
    }
  }

  /**
   * Start a new session
   */
  async startSession(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const { startSession } = await import('@sentry/core');
      startSession();
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }

  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const { endSession } = await import('@sentry/core');
      endSession();
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * Capture a performance transaction
   */
  async captureTransaction(name: string, op: string, callback: () => Promise<void>): Promise<void> {
    if (!this.isInitialized) return;

    try {
      const { startTransaction } = await import('@sentry/core');
      const transaction = startTransaction({ name, op });
      
      try {
        await callback();
        transaction.setStatus('ok');
      } catch (error) {
        transaction.setStatus('internal_error');
        throw error;
      } finally {
        transaction.finish();
      }
    } catch (error) {
      console.error('Failed to capture transaction:', error);
    }
  }
}