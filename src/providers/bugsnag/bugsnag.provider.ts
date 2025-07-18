import { BaseProvider } from '../base.provider';
import {
  NormalizedError,
  UserContext,
  Breadcrumb,
  ProviderCapabilities,
  ProviderFeature,
  ProviderConfig,
  BugsnagConfig,
  ErrorLevel,
} from '@/types';

/**
 * Bugsnag provider implementation
 */
export class BugsnagProvider extends BaseProvider {
  readonly name = 'bugsnag';
  readonly version = '1.0.0';

  private bugsnag: any;
  private isWeb: boolean = false;
  private isInitialized: boolean = false;

  protected async initializeProvider(config: ProviderConfig): Promise<void> {
    const bugsnagConfig = config as BugsnagConfig;

    if (!bugsnagConfig.apiKey) {
      throw new Error('Bugsnag API key is required');
    }

    try {
      // Check if we're on web or native
      const { Capacitor } = await import('@capacitor/core');
      this.isWeb = Capacitor.getPlatform() === 'web';

      // Load Bugsnag SDK
      const Bugsnag = await import('@bugsnag/js');
      this.bugsnag = Bugsnag.default;

      // Initialize Bugsnag
      this.bugsnag.start({
        apiKey: bugsnagConfig.apiKey,
        appVersion: bugsnagConfig.appVersion || bugsnagConfig.release,
        appType: bugsnagConfig.appType || 'capacitor',
        releaseStage: bugsnagConfig.environment || 'production',
        enabledReleaseStages: bugsnagConfig.enabledReleaseStages || ['production', 'staging'],
        autoDetectErrors: bugsnagConfig.autoDetectErrors !== false,
        maxBreadcrumbs: bugsnagConfig.maxBreadcrumbs || 25,
        enabledBreadcrumbTypes: bugsnagConfig.enabledBreadcrumbTypes || [
          'navigation',
          'request',
          'process',
          'log',
          'user',
          'state',
          'error',
          'manual',
        ],
        redactedKeys: bugsnagConfig.redactedKeys || [],
        metadata: {
          platform: this.isWeb ? 'web' : Capacitor.getPlatform(),
          ...bugsnagConfig.context,
        },
        beforeSend: (event: any) => {
          // Apply global beforeSend filter
          if (bugsnagConfig.beforeSend) {
            const normalizedError: NormalizedError = {
              message: event.errors[0]?.errorMessage || 'Unknown error',
              name: event.errors[0]?.errorClass || 'Error',
              level: this.mapBugsnagSeverity(event.severity),
              timestamp: Date.now(),
              stack: event.errors[0]?.stacktrace,
              context: event.metaData,
              tags: event.customTags || {},
              user: event.user,
              metadata: event.metaData,
            };
            const transformedError = bugsnagConfig.beforeSend(normalizedError);
            return transformedError ? event : null;
          }
          return event;
        },
        onError: (event: any) => {
          // Apply error filters
          if (bugsnagConfig.ignoreErrors) {
            const errorMessage = event.errors[0]?.errorMessage || '';
            const errorClass = event.errors[0]?.errorClass || '';
            
            for (const pattern of bugsnagConfig.ignoreErrors) {
              if (typeof pattern === 'string') {
                if (errorMessage.includes(pattern) || errorClass.includes(pattern)) {
                  return false;
                }
              } else if (pattern instanceof RegExp) {
                if (pattern.test(errorMessage) || pattern.test(errorClass)) {
                  return false;
                }
              }
            }
          }
          return true;
        },
        plugins: [],
        logger: bugsnagConfig.debug ? console : undefined,
      });

      // Set global context
      if (bugsnagConfig.tags) {
        Object.entries(bugsnagConfig.tags).forEach(([key, value]) => {
          this.bugsnag.addMetadata('tags', key, value);
        });
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Bugsnag provider:', error);
      throw error;
    }
  }

  protected async sendError(error: NormalizedError): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Bugsnag provider not initialized');
    }

    try {
      // Set context for this error
      if (error.user) {
        this.bugsnag.setUser(error.user.id, error.user.email, error.user.username);
      }

      // Set context data
      if (error.context) {
        this.bugsnag.addMetadata('context', error.context);
      }

      // Set tags
      if (error.tags) {
        this.bugsnag.addMetadata('tags', error.tags);
      }

      // Set extra data
      if (error.metadata) {
        this.bugsnag.addMetadata('extra', error.metadata);
      }

      // Send error
      if (error.originalError instanceof Error) {
        this.bugsnag.notify(error.originalError, (event: any) => {
          event.severity = this.mapErrorLevelToBugsnag(error.level);
          event.context = error.context?.screen || error.context?.route || 'unknown';
          return true;
        });
      } else {
        // Create a new error for non-Error objects
        const syntheticError = new Error(error.message);
        syntheticError.name = error.name;
        if (error.stack) {
          syntheticError.stack = error.stack;
        }

        this.bugsnag.notify(syntheticError, (event: any) => {
          event.severity = this.mapErrorLevelToBugsnag(error.level);
          event.context = error.context?.screen || error.context?.route || 'unknown';
          return true;
        });
      }
    } catch (err) {
      console.error('Failed to send error to Bugsnag:', err);
      throw err;
    }
  }

  protected async updateUserContext(user: UserContext | null): Promise<void> {
    if (!this.isInitialized) return;

    try {
      if (user) {
        this.bugsnag.setUser(user.id, user.email, user.username);
        
        // Add additional user attributes as metadata
        const additionalAttributes = { ...user };
        delete additionalAttributes.id;
        delete additionalAttributes.email;
        delete additionalAttributes.username;
        
        if (Object.keys(additionalAttributes).length > 0) {
          this.bugsnag.addMetadata('user', additionalAttributes);
        }
      } else {
        this.bugsnag.setUser(null, null, null);
        this.bugsnag.clearMetadata('user');
      }
    } catch (error) {
      console.error('Failed to update user context:', error);
    }
  }

  protected async updateCustomContext(key: string, context: any): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.bugsnag.addMetadata('context', key, context);
    } catch (error) {
      console.error('Failed to update custom context:', error);
    }
  }

  protected async updateBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.bugsnag.leaveBreadcrumb(
        breadcrumb.message,
        {
          ...breadcrumb.data,
          category: breadcrumb.category,
          level: breadcrumb.level,
        },
        this.mapBreadcrumbType(breadcrumb.category || 'manual')
      );
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }

  protected async updateTags(tags: Record<string, string>): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.bugsnag.addMetadata('tags', tags);
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  }

  protected async updateExtraData(key: string, value: any): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.bugsnag.addMetadata('extra', key, value);
    } catch (error) {
      console.error('Failed to update extra data:', error);
    }
  }

  protected async clearProviderBreadcrumbs(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      // Bugsnag doesn't have a direct method to clear breadcrumbs
      // We would need to restart the client, but that's not recommended
      console.warn('Bugsnag does not support clearing breadcrumbs');
    } catch (error) {
      console.error('Failed to clear breadcrumbs:', error);
    }
  }

  protected async destroyProvider(): Promise<void> {
    this.isInitialized = false;
    this.bugsnag = null;
  }

  async flush(timeout?: number): Promise<boolean> {
    if (!this.isInitialized) return false;

    try {
      // Bugsnag doesn't have a flush method, but we can return true
      // since it sends errors immediately
      return true;
    } catch (error) {
      console.error('Failed to flush Bugsnag:', error);
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
      ProviderFeature.SESSION_TRACKING,
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
        ProviderFeature.SESSION_TRACKING,
      ],
      maxBreadcrumbs: 25,
      maxContextSize: 100,
      maxTags: 100,
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
   * Map error level to Bugsnag severity
   */
  private mapErrorLevelToBugsnag(level: ErrorLevel): string {
    switch (level) {
      case ErrorLevel.DEBUG:
      case ErrorLevel.INFO:
        return 'info';
      case ErrorLevel.WARNING:
        return 'warning';
      case ErrorLevel.ERROR:
      case ErrorLevel.FATAL:
        return 'error';
      default:
        return 'error';
    }
  }

  /**
   * Map Bugsnag severity to error level
   */
  private mapBugsnagSeverity(severity: string): ErrorLevel {
    switch (severity) {
      case 'info':
        return ErrorLevel.INFO;
      case 'warning':
        return ErrorLevel.WARNING;
      case 'error':
        return ErrorLevel.ERROR;
      default:
        return ErrorLevel.ERROR;
    }
  }

  /**
   * Map breadcrumb category to Bugsnag type
   */
  private mapBreadcrumbType(category: string): string {
    switch (category) {
      case 'navigation':
        return 'navigation';
      case 'request':
      case 'http':
        return 'request';
      case 'process':
        return 'process';
      case 'log':
        return 'log';
      case 'user':
        return 'user';
      case 'state':
        return 'state';
      case 'error':
        return 'error';
      case 'manual':
      default:
        return 'manual';
    }
  }

  /**
   * Start a new session
   */
  async startSession(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.bugsnag.startSession();
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }

  /**
   * Pause the current session
   */
  async pauseSession(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.bugsnag.pauseSession();
    } catch (error) {
      console.error('Failed to pause session:', error);
    }
  }

  /**
   * Resume the current session
   */
  async resumeSession(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.bugsnag.resumeSession();
    } catch (error) {
      console.error('Failed to resume session:', error);
    }
  }

  /**
   * Add feature flag
   */
  async addFeatureFlag(name: string, variant?: string): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.bugsnag.addFeatureFlag(name, variant);
    } catch (error) {
      console.error('Failed to add feature flag:', error);
    }
  }

  /**
   * Clear feature flag
   */
  async clearFeatureFlag(name: string): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.bugsnag.clearFeatureFlag(name);
    } catch (error) {
      console.error('Failed to clear feature flag:', error);
    }
  }

  /**
   * Clear all feature flags
   */
  async clearFeatureFlags(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      this.bugsnag.clearFeatureFlags();
    } catch (error) {
      console.error('Failed to clear feature flags:', error);
    }
  }
}