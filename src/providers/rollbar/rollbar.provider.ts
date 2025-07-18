import { BaseProvider } from '../base.provider';
import {
  NormalizedError,
  UserContext,
  Breadcrumb,
  ProviderCapabilities,
  ProviderFeature,
  ProviderConfig,
  RollbarConfig,
  ErrorLevel,
} from '@/types';

/**
 * Rollbar provider implementation
 */
export class RollbarProvider extends BaseProvider {
  readonly name = 'rollbar';
  readonly version = '1.0.0';

  private rollbar: any;
  private isInitialized: boolean = false;

  protected async initializeProvider(config: ProviderConfig): Promise<void> {
    const rollbarConfig = config as RollbarConfig;

    if (!rollbarConfig.accessToken && !rollbarConfig.apiKey) {
      throw new Error('Rollbar access token or API key is required');
    }

    try {
      const Rollbar = await import('rollbar');
      this.rollbar = new Rollbar.default({
        accessToken: rollbarConfig.accessToken || rollbarConfig.apiKey,
        environment: rollbarConfig.environment || 'production',
        captureUncaught: rollbarConfig.captureUncaught !== false,
        captureUnhandledRejections: rollbarConfig.captureUnhandledRejections !== false,
        payload: {
          environment: rollbarConfig.environment || 'production',
          client: {
            javascript: {
              source_map_enabled: true,
              guess_uncaught_frames: true,
            },
          },
          ...rollbarConfig.payload,
        },
        transform: (payload: any) => {
          // Apply global beforeSend filter
          if (rollbarConfig.beforeSend) {
            const normalizedError: NormalizedError = {
              message: payload.data.body?.message || payload.data.body?.trace?.exception?.message || 'Unknown error',
              name: payload.data.body?.trace?.exception?.class || 'Error',
              level: this.mapRollbarLevel(payload.data.level),
              timestamp: payload.data.timestamp * 1000,
              stack: payload.data.body?.trace?.frames,
              context: payload.data.context,
              tags: payload.data.tags,
              user: payload.data.person,
              metadata: payload.data.custom,
            };
            const transformedError = rollbarConfig.beforeSend(normalizedError);
            if (!transformedError) {
              return false;
            }
          }
          return payload;
        },
      });

      // Set global context
      if (rollbarConfig.tags) {
        Object.entries(rollbarConfig.tags).forEach(([key, value]) => {
          this.rollbar.configure({
            payload: {
              custom: {
                [key]: value,
              },
            },
          });
        });
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Rollbar provider:', error);
      throw error;
    }
  }

  protected async sendError(error: NormalizedError): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Rollbar provider not initialized');
    }

    try {
      // Set context for this error
      const payload = {
        person: error.user,
        context: error.context,
        custom: {
          ...error.metadata,
          tags: error.tags,
        },
      };

      // Send error
      if (error.originalError instanceof Error) {
        this.rollbar.error(error.originalError, payload);
      } else {
        this.rollbar.error(error.message, payload);
      }
    } catch (err) {
      console.error('Failed to send error to Rollbar:', err);
      throw err;
    }
  }

  protected async updateUserContext(user: UserContext | null): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.rollbar.configure({
        payload: {
          person: user ? {
            id: user.id,
            email: user.email,
            username: user.username,
            ...user,
          } : undefined,
        },
      });
    } catch (error) {
      console.error('Failed to update user context:', error);
    }
  }

  protected async updateCustomContext(key: string, context: any): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.rollbar.configure({
        payload: {
          custom: {
            [key]: context,
          },
        },
      });
    } catch (error) {
      console.error('Failed to update custom context:', error);
    }
  }

  protected async updateBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Rollbar doesn't have native breadcrumb support
      // We'll log it as info level
      this.rollbar.info(`[Breadcrumb] ${breadcrumb.message}`, {
        category: breadcrumb.category,
        level: breadcrumb.level,
        data: breadcrumb.data,
        timestamp: breadcrumb.timestamp,
      });
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }

  protected async updateTags(tags: Record<string, string>): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.rollbar.configure({
        payload: {
          custom: {
            tags: {
              ...tags,
            },
          },
        },
      });
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  }

  protected async updateExtraData(key: string, value: any): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.rollbar.configure({
        payload: {
          custom: {
            [key]: value,
          },
        },
      });
    } catch (error) {
      console.error('Failed to update extra data:', error);
    }
  }

  protected async clearProviderBreadcrumbs(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Rollbar doesn't support clearing breadcrumbs
      console.warn('Rollbar does not support clearing breadcrumbs');
    } catch (error) {
      console.error('Failed to clear breadcrumbs:', error);
    }
  }

  protected async destroyProvider(): Promise<void> {
    this.isInitialized = false;
    this.rollbar = null;
  }

  async flush(timeout?: number): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      return new Promise((resolve) => {
        this.rollbar.wait(() => {
          resolve(true);
        });
        
        if (timeout) {
          setTimeout(() => resolve(false), timeout);
        }
      });
    } catch (error) {
      console.error('Failed to flush Rollbar:', error);
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
      ],
      maxBreadcrumbs: 50,
      maxContextSize: 500,
      maxTags: 100,
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
   * Map Rollbar level to error level
   */
  private mapRollbarLevel(level: string): ErrorLevel {
    switch (level) {
      case 'debug':
        return ErrorLevel.DEBUG;
      case 'info':
        return ErrorLevel.INFO;
      case 'warning':
        return ErrorLevel.WARNING;
      case 'error':
        return ErrorLevel.ERROR;
      case 'critical':
        return ErrorLevel.FATAL;
      default:
        return ErrorLevel.ERROR;
    }
  }

  /**
   * Map error level to Rollbar level
   */
  private mapErrorLevelToRollbar(level: ErrorLevel): string {
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
        return 'critical';
      default:
        return 'error';
    }
  }
}