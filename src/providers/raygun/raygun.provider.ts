import { BaseProvider } from '../base.provider';
import {
  NormalizedError,
  UserContext,
  Breadcrumb,
  ProviderCapabilities,
  ProviderFeature,
  ProviderConfig,
  RaygunConfig,
  ErrorLevel,
} from '@/types';

/**
 * Raygun provider implementation
 */
export class RaygunProvider extends BaseProvider {
  readonly name = 'raygun';
  readonly version = '1.0.0';

  private raygun: any;
  private isInitialized: boolean = false;

  protected async initializeProvider(config: ProviderConfig): Promise<void> {
    const raygunConfig = config as RaygunConfig;

    if (!raygunConfig.apiKey) {
      throw new Error('Raygun API key is required');
    }

    try {
      const raygun4js = await import('raygun4js');
      this.raygun = raygun4js.default;

      // Initialize Raygun
      this.raygun('apiKey', raygunConfig.apiKey);
      this.raygun('enableCrashReporting', !raygunConfig.disableErrorTracking);
      this.raygun('enablePulse', !raygunConfig.disablePulse);
      this.raygun('disableAnonymousUserTracking', raygunConfig.disableAnonymousUserTracking);
      this.raygun('setVersion', raygunConfig.release);
      
      if (raygunConfig.apiEndpoint) {
        this.raygun('setApiEndpoint', raygunConfig.apiEndpoint);
      }

      if (raygunConfig.withTags) {
        this.raygun('withTags', raygunConfig.withTags);
      }

      if (raygunConfig.customData) {
        this.raygun('withCustomData', raygunConfig.customData);
      }

      // Set error filters
      if (raygunConfig.ignoreErrors) {
        this.raygun('filterSensitiveData', raygunConfig.ignoreErrors);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Raygun provider:', error);
      throw error;
    }
  }

  protected async sendError(error: NormalizedError): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Raygun provider not initialized');
    }

    try {
      // Set context for this error
      if (error.user) {
        this.raygun('setUser', {
          identifier: error.user.id,
          email: error.user.email,
          fullName: error.user.username,
          ...error.user,
        });
      }

      // Set custom data
      const customData = {
        ...error.context,
        ...error.metadata,
        tags: error.tags,
        level: error.level,
      };

      // Send error
      if (error.originalError instanceof Error) {
        this.raygun('send', {
          error: error.originalError,
          customData,
          tags: error.tags ? Object.keys(error.tags) : undefined,
        });
      } else {
        // Create a synthetic error
        const syntheticError = new Error(error.message);
        syntheticError.name = error.name;
        if (error.stack) {
          syntheticError.stack = error.stack;
        }

        this.raygun('send', {
          error: syntheticError,
          customData,
          tags: error.tags ? Object.keys(error.tags) : undefined,
        });
      }
    } catch (err) {
      console.error('Failed to send error to Raygun:', err);
      throw err;
    }
  }

  protected async updateUserContext(user: UserContext | null): Promise<void> {
    if (!this.isInitialized) return;

    try {
      if (user) {
        this.raygun('setUser', {
          identifier: user.id,
          email: user.email,
          fullName: user.username,
          ...user,
        });
      } else {
        this.raygun('setUser', null);
      }
    } catch (error) {
      console.error('Failed to update user context:', error);
    }
  }

  protected async updateCustomContext(key: string, context: any): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.raygun('withCustomData', { [key]: context });
    } catch (error) {
      console.error('Failed to update custom context:', error);
    }
  }

  protected async updateBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Raygun doesn't have native breadcrumb support
      // We'll add it as custom data
      this.raygun('withCustomData', {
        breadcrumb: {
          message: breadcrumb.message,
          category: breadcrumb.category,
          level: breadcrumb.level,
          timestamp: breadcrumb.timestamp,
          data: breadcrumb.data,
        },
      });
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }

  protected async updateTags(tags: Record<string, string>): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.raygun('withTags', Object.keys(tags));
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  }

  protected async updateExtraData(key: string, value: any): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.raygun('withCustomData', { [key]: value });
    } catch (error) {
      console.error('Failed to update extra data:', error);
    }
  }

  protected async clearProviderBreadcrumbs(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Raygun doesn't support clearing breadcrumbs
      console.warn('Raygun does not support clearing breadcrumbs');
    } catch (error) {
      console.error('Failed to clear breadcrumbs:', error);
    }
  }

  protected async destroyProvider(): Promise<void> {
    this.isInitialized = false;
    this.raygun = null;
  }

  async flush(timeout?: number): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      // Raygun doesn't have a flush method
      return true;
    } catch (error) {
      console.error('Failed to flush Raygun:', error);
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
      ],
      maxBreadcrumbs: 50,
      maxContextSize: 500,
      maxTags: 50,
      supportsOffline: true,
      supportsBatching: false,
      platforms: {
        ios: true,
        android: true,
        web: true,
      },
    };
  }

  /**
   * Track custom timing
   */
  async trackTiming(name: string, duration: number): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.raygun('trackEvent', {
        type: 'timing',
        name,
        duration,
      });
    } catch (error) {
      console.error('Failed to track timing:', error);
    }
  }

  /**
   * Track custom event
   */
  async trackEvent(eventName: string, data?: Record<string, any>): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.raygun('trackEvent', {
        type: 'custom',
        name: eventName,
        data,
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }
}