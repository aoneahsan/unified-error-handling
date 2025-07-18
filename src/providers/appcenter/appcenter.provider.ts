import { BaseProvider } from '../base.provider';
import {
  NormalizedError,
  UserContext,
  Breadcrumb,
  ProviderCapabilities,
  ProviderFeature,
  ProviderConfig,
  AppCenterConfig,
  ErrorLevel,
} from '@/types';

/**
 * Microsoft AppCenter provider implementation
 */
export class AppCenterProvider extends BaseProvider {
  readonly name = 'appcenter';
  readonly version = '1.0.0';

  private appCenter: any;
  private crashes: any;
  private analytics: any;
  private isWeb: boolean = false;
  private isInitialized: boolean = false;

  protected async initializeProvider(config: ProviderConfig): Promise<void> {
    const appCenterConfig = config as AppCenterConfig;

    if (!appCenterConfig.appSecret && !appCenterConfig.apiKey) {
      throw new Error('AppCenter app secret or API key is required');
    }

    try {
      // Check if we're on web or native
      const { Capacitor } = await import('@capacitor/core');
      this.isWeb = Capacitor.getPlatform() === 'web';

      if (this.isWeb) {
        console.warn('AppCenter does not support web platform');
        throw new Error('AppCenter web SDK not available');
      } else {
        // Native implementation
        const AppCenter = await import('appcenter');
        const Crashes = await import('appcenter-crashes');
        const Analytics = await import('appcenter-analytics');
        
        this.appCenter = AppCenter.default;
        this.crashes = Crashes.default;
        this.analytics = Analytics.default;

        // Initialize AppCenter
        await this.appCenter.start({
          appSecret: appCenterConfig.appSecret || appCenterConfig.apiKey,
          services: [this.crashes, this.analytics],
          logLevel: appCenterConfig.logLevel || 2, // Info level
        });

        // Set user information
        if (appCenterConfig.userId) {
          await this.appCenter.setUserId(appCenterConfig.userId);
        }

        if (appCenterConfig.countryCode) {
          await this.appCenter.setCountryCode(appCenterConfig.countryCode);
        }

        // Enable crash reporting
        await this.crashes.setEnabled(true);
        await this.analytics.setEnabled(true);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AppCenter provider:', error);
      throw error;
    }
  }

  protected async sendError(error: NormalizedError): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('AppCenter provider not initialized');
    }

    if (this.isWeb) {
      console.warn('AppCenter does not support web platform');
      return;
    }

    try {
      // Set properties for this error
      const properties: Record<string, string> = {};
      
      if (error.context) {
        Object.entries(error.context).forEach(([key, value]) => {
          properties[`context_${key}`] = String(value);
        });
      }

      if (error.tags) {
        Object.entries(error.tags).forEach(([key, value]) => {
          properties[`tag_${key}`] = String(value);
        });
      }

      if (error.metadata) {
        Object.entries(error.metadata).forEach(([key, value]) => {
          properties[`meta_${key}`] = String(value);
        });
      }

      properties.level = error.level;
      properties.timestamp = String(error.timestamp);

      // Send error
      if (error.originalError instanceof Error) {
        await this.crashes.trackError(error.originalError, properties);
      } else {
        // Create a synthetic error
        const syntheticError = new Error(error.message);
        syntheticError.name = error.name;
        if (error.stack) {
          syntheticError.stack = error.stack;
        }

        await this.crashes.trackError(syntheticError, properties);
      }

      // Also track as an event for analytics
      await this.analytics.trackEvent('Error', {
        message: error.message,
        level: error.level,
        ...properties,
      });
    } catch (err) {
      console.error('Failed to send error to AppCenter:', err);
      throw err;
    }
  }

  protected async updateUserContext(user: UserContext | null): Promise<void> {
    if (!this.isInitialized || this.isWeb) return;

    try {
      if (user) {
        await this.appCenter.setUserId(user.id);
        
        // Track user properties as events
        await this.analytics.trackEvent('UserContext', {
          userId: user.id || '',
          email: user.email || '',
          username: user.username || '',
        });
      } else {
        await this.appCenter.setUserId('');
      }
    } catch (error) {
      console.error('Failed to update user context:', error);
    }
  }

  protected async updateCustomContext(key: string, context: any): Promise<void> {
    if (!this.isInitialized || this.isWeb) return;

    try {
      // AppCenter doesn't have direct context support
      // We'll track it as an event
      await this.analytics.trackEvent('CustomContext', {
        key,
        value: String(context),
      });
    } catch (error) {
      console.error('Failed to update custom context:', error);
    }
  }

  protected async updateBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    if (!this.isInitialized || this.isWeb) return;

    try {
      // AppCenter doesn't have breadcrumb support
      // We'll track it as an event
      await this.analytics.trackEvent('Breadcrumb', {
        message: breadcrumb.message,
        category: breadcrumb.category || 'manual',
        level: breadcrumb.level || ErrorLevel.INFO,
        timestamp: String(breadcrumb.timestamp || Date.now()),
      });
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }

  protected async updateTags(tags: Record<string, string>): Promise<void> {
    if (!this.isInitialized || this.isWeb) return;

    try {
      // Track tags as events
      await this.analytics.trackEvent('Tags', tags);
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  }

  protected async updateExtraData(key: string, value: any): Promise<void> {
    if (!this.isInitialized || this.isWeb) return;

    try {
      // Track extra data as events
      await this.analytics.trackEvent('ExtraData', {
        key,
        value: String(value),
      });
    } catch (error) {
      console.error('Failed to update extra data:', error);
    }
  }

  protected async clearProviderBreadcrumbs(): Promise<void> {
    if (!this.isInitialized || this.isWeb) return;

    try {
      // AppCenter doesn't support clearing breadcrumbs
      console.warn('AppCenter does not support clearing breadcrumbs');
    } catch (error) {
      console.error('Failed to clear breadcrumbs:', error);
    }
  }

  protected async destroyProvider(): Promise<void> {
    this.isInitialized = false;
    this.appCenter = null;
    this.crashes = null;
    this.analytics = null;
  }

  async flush(timeout?: number): Promise<boolean> {
    if (!this.isInitialized || this.isWeb) return false;

    try {
      // AppCenter doesn't have a flush method
      return true;
    } catch (error) {
      console.error('Failed to flush AppCenter:', error);
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
      ProviderFeature.ANALYTICS,
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
        ProviderFeature.ANALYTICS,
      ],
      maxBreadcrumbs: 50,
      maxContextSize: 200,
      maxTags: 200,
      supportsOffline: true,
      supportsBatching: true,
      platforms: {
        ios: true,
        android: true,
        web: false,
      },
    };
  }

  /**
   * Check if crash reporting is enabled
   */
  async isCrashesEnabled(): Promise<boolean> {
    if (!this.isInitialized || this.isWeb) return false;

    try {
      return await this.crashes.isEnabled();
    } catch (error) {
      console.error('Failed to check crashes status:', error);
      return false;
    }
  }

  /**
   * Check if analytics is enabled
   */
  async isAnalyticsEnabled(): Promise<boolean> {
    if (!this.isInitialized || this.isWeb) return false;

    try {
      return await this.analytics.isEnabled();
    } catch (error) {
      console.error('Failed to check analytics status:', error);
      return false;
    }
  }

  /**
   * Track custom event
   */
  async trackEvent(eventName: string, properties?: Record<string, string>): Promise<void> {
    if (!this.isInitialized || this.isWeb) return;

    try {
      await this.analytics.trackEvent(eventName, properties);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  /**
   * Generate test crash
   */
  async generateTestCrash(): Promise<void> {
    if (!this.isInitialized || this.isWeb) return;

    try {
      await this.crashes.generateTestCrash();
    } catch (error) {
      console.error('Failed to generate test crash:', error);
    }
  }
}