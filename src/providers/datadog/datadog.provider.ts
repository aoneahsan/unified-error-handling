import { BaseProvider } from '../base.provider';
import {
  NormalizedError,
  UserContext,
  Breadcrumb,
  ProviderCapabilities,
  ProviderFeature,
  ProviderConfig,
  DataDogConfig,
  ErrorLevel,
} from '@/types';

/**
 * DataDog RUM provider implementation
 */
export class DataDogProvider extends BaseProvider {
  readonly name = 'datadog';
  readonly version = '1.0.0';

  private datadogRum: any;
  private datadogLogs: any;
  private isWeb: boolean = false;

  protected async initializeProvider(config: ProviderConfig): Promise<void> {
    const datadogConfig = config as DataDogConfig;

    if (!datadogConfig.clientToken || !datadogConfig.applicationId) {
      throw new Error('DataDog client token and application ID are required');
    }

    try {
      // Check if we're on web or native
      const { Capacitor } = await import('@capacitor/core');
      this.isWeb = Capacitor.getPlatform() === 'web';

      if (this.isWeb) {
        // Web implementation
        const { datadogRum } = await import('@datadog/browser-rum');
        this.datadogRum = datadogRum;

        // Initialize DataDog Logs
        try {
          const { datadogLogs } = await import('@datadog/browser-logs');
          this.datadogLogs = datadogLogs;
        } catch (error) {
          console.warn('DataDog Logs not available, continuing without logs integration:', error);
          this.datadogLogs = null;
        }

        // Initialize RUM
        this.datadogRum.init({
          applicationId: datadogConfig.applicationId,
          clientToken: datadogConfig.clientToken,
          site: datadogConfig.site || 'datadoghq.com',
          service: datadogConfig.service,
          env: datadogConfig.environment || 'production',
          version: datadogConfig.release,
          sessionSampleRate: datadogConfig.sessionSampleRate || 100,
          sessionReplaySampleRate: datadogConfig.sampleRate ? datadogConfig.sampleRate * 100 : 20,
          trackUserInteractions: datadogConfig.trackInteractions !== false,
          trackResources: true,
          trackLongTasks: true,
          defaultPrivacyLevel: 'mask-user-input',
          allowedTracingUrls: [],
          beforeSend: (event: any) => {
            // Apply global beforeSend filter
            if (datadogConfig.beforeSend) {
              const normalizedError: NormalizedError = {
                message: event.message || 'Unknown error',
                name: event.error?.kind || 'Error',
                level: this.mapDatadogStatus(event.status),
                timestamp: event.date,
                stack: event.error?.stack,
                context: event.context,
                tags: event.tags,
                user: event.usr,
                metadata: event.context,
              };
              const transformedError = datadogConfig.beforeSend(normalizedError);
              return transformedError ? event : null;
            }
            return event;
          },
        });

        // Initialize Logs (if available)
        if (this.datadogLogs) {
          this.datadogLogs.init({
            clientToken: datadogConfig.clientToken,
            site: datadogConfig.site || 'datadoghq.com',
            service: datadogConfig.service,
            env: datadogConfig.environment || 'production',
            version: datadogConfig.release,
            sessionSampleRate: datadogConfig.sessionSampleRate || 100,
            beforeSend: (log: any) => {
              // Apply error filters
              if (datadogConfig.ignoreErrors) {
                const message = log.message || '';
                for (const pattern of datadogConfig.ignoreErrors) {
                  if (typeof pattern === 'string') {
                    if (message.includes(pattern)) {
                      return false;
                    }
                  } else if (pattern instanceof RegExp) {
                    if (pattern.test(message)) {
                      return false;
                    }
                  }
                }
              }
              return true;
            },
          });
        }

        // Start RUM
        this.datadogRum.startSessionReplayRecording();
      } else {
        // Native implementation would require DataDog mobile SDK
        console.warn('DataDog native implementation not available, using web fallback');
        throw new Error('DataDog native SDK not implemented');
      }

      // Set global context
      if (datadogConfig.tags) {
        Object.entries(datadogConfig.tags).forEach(([key, value]) => {
          this.datadogRum.setGlobalContextProperty(key, value);
        });
      }

      this.state.initialized = true;
    } catch (error) {
      console.error('Failed to initialize DataDog provider:', error);
      throw error;
    }
  }

  protected async sendError(error: NormalizedError): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('DataDog provider not initialized');
    }

    try {
      // Set context for this error
      if (error.user) {
        this.datadogRum.setUser(error.user);
      }

      // Set context
      if (error.context) {
        Object.entries(error.context).forEach(([key, value]) => {
          this.datadogRum.setGlobalContextProperty(key, value);
        });
      }

      // Set tags
      if (error.tags) {
        Object.entries(error.tags).forEach(([key, value]) => {
          this.datadogRum.setGlobalContextProperty(key, value);
        });
      }

      // Send error
      if (error.originalError instanceof Error) {
        this.datadogRum.addError(error.originalError, {
          ...error.context,
          ...error.metadata,
          level: error.level,
          timestamp: error.timestamp,
        });
      } else {
        // Create a synthetic error
        const syntheticError = new Error(error.message);
        syntheticError.name = error.name;
        if (error.stack) {
          syntheticError.stack = error.stack;
        }

        this.datadogRum.addError(syntheticError, {
          ...error.context,
          ...error.metadata,
          level: error.level,
          timestamp: error.timestamp,
        });
      }

      // Also log to DataDog Logs (if available)
      if (this.datadogLogs) {
        this.datadogLogs.logger.error(error.message, {
          error: error.originalError,
          context: error.context,
          tags: error.tags,
          metadata: error.metadata,
          level: error.level,
        });
      }
    } catch (err) {
      console.error('Failed to send error to DataDog:', err);
      throw err;
    }
  }

  protected async updateUserContext(user: UserContext | null): Promise<void> {
    if (!this.isInitialized) return;

    try {
      if (user) {
        this.datadogRum.setUser({
          id: user.id,
          email: user.email,
          name: user.username,
          ...user,
        });
      } else {
        this.datadogRum.removeUser();
      }
    } catch (error) {
      console.error('Failed to update user context:', error);
    }
  }

  protected async updateCustomContext(key: string, context: any): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.datadogRum.setGlobalContextProperty(key, context);
    } catch (error) {
      console.error('Failed to update custom context:', error);
    }
  }

  protected async updateBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // DataDog doesn't have native breadcrumb support
      // We'll use addAction to track user actions
      this.datadogRum.addAction(breadcrumb.message, {
        category: breadcrumb.category || 'manual',
        level: breadcrumb.level || ErrorLevel.INFO,
        timestamp: breadcrumb.timestamp || Date.now(),
        ...breadcrumb.data,
      });

      // Also log as a breadcrumb message (if available)
      if (this.datadogLogs) {
        this.datadogLogs.logger.info(`[Breadcrumb] ${breadcrumb.message}`, {
          category: breadcrumb.category,
          level: breadcrumb.level,
          data: breadcrumb.data,
        });
      }
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }

  protected async updateTags(tags: Record<string, string>): Promise<void> {
    if (!this.isInitialized) return;

    try {
      Object.entries(tags).forEach(([key, value]) => {
        this.datadogRum.setGlobalContextProperty(key, value);
      });
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  }

  protected async updateExtraData(key: string, value: any): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.datadogRum.setGlobalContextProperty(key, value);
    } catch (error) {
      console.error('Failed to update extra data:', error);
    }
  }

  protected async clearProviderBreadcrumbs(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // DataDog doesn't support clearing breadcrumbs
      console.warn('DataDog does not support clearing breadcrumbs');
    } catch (error) {
      console.error('Failed to clear breadcrumbs:', error);
    }
  }

  protected async destroyProvider(): Promise<void> {
    this.state.initialized = false;
    this.datadogRum = null;
    this.datadogLogs = null;
  }

  async flush(_timeout?: number): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      // DataDog doesn't have a flush method, but we can return true
      // since it sends data immediately
      return true;
    } catch (error) {
      console.error('Failed to flush DataDog:', error);
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
      ProviderFeature.PERFORMANCE_MONITORING,
      ProviderFeature.SESSION_TRACKING,
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
        ProviderFeature.PERFORMANCE_MONITORING,
        ProviderFeature.SESSION_TRACKING,
      ],
      maxBreadcrumbs: 100,
      maxContextSize: 1000,
      maxTags: 200,
      supportsOffline: true,
      supportsBatching: true,
      platforms: {
        ios: false, // Would need native SDK
        android: false, // Would need native SDK
        web: true,
      },
    };
  }

  /**
   * Map DataDog status to error level
   */
  private mapDatadogStatus(status: string): ErrorLevel {
    switch (status) {
      case 'debug':
        return ErrorLevel.DEBUG;
      case 'info':
        return ErrorLevel.INFO;
      case 'warn':
        return ErrorLevel.WARNING;
      case 'error':
        return ErrorLevel.ERROR;
      case 'critical':
        return ErrorLevel.FATAL;
      default:
        return ErrorLevel.ERROR;
    }
  }

  // /**
  //  * Map error level to DataDog status
  //  */
  // private _mapErrorLevelToDatadog(level: ErrorLevel): string {
  //   switch (level) {
  //     case ErrorLevel.DEBUG:
  //       return 'debug';
  //     case ErrorLevel.INFO:
  //       return 'info';
  //     case ErrorLevel.WARNING:
  //       return 'warn';
  //     case ErrorLevel.ERROR:
  //       return 'error';
  //     case ErrorLevel.FATAL:
  //       return 'critical';
  //     default:
  //       return 'error';
  //   }
  // }

  /**
   * Start a new RUM view
   */
  async startView(name: string): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.datadogRum.startView(name);
    } catch (error) {
      console.error('Failed to start view:', error);
    }
  }

  /**
   * Stop the current RUM view
   */
  async stopView(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.datadogRum.stopView();
    } catch (error) {
      console.error('Failed to stop view:', error);
    }
  }

  /**
   * Add a RUM action
   */
  async addAction(name: string, context?: Record<string, any>): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.datadogRum.addAction(name, context);
    } catch (error) {
      console.error('Failed to add action:', error);
    }
  }

  /**
   * Add timing information
   */
  async addTiming(name: string, time?: number): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.datadogRum.addTiming(name, time);
    } catch (error) {
      console.error('Failed to add timing:', error);
    }
  }

  /**
   * Start a performance timing
   */
  async startResource(key: string, method: string, url: string): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.datadogRum.startResource(key, method, url);
    } catch (error) {
      console.error('Failed to start resource:', error);
    }
  }

  /**
   * Stop a performance timing
   */
  async stopResource(key: string, statusCode?: number, size?: number): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.datadogRum.stopResource(key, statusCode, size);
    } catch (error) {
      console.error('Failed to stop resource:', error);
    }
  }
}
