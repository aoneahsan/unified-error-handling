import { BaseAdapter } from './base-adapter';
import type { NormalizedError, ErrorContext, Breadcrumb } from '../store/types';

export class AppCenterAdapter extends BaseAdapter {
  name = 'appcenter';
  private crashes: any;
  private analytics: any;

  async loadSDK(): Promise<void> {
    if (this.sdkLoaded) return;

    try {
      // AppCenter for web uses different packages
      // For React Native, it would be @appcenter/appcenter-crashes and @appcenter/appcenter-analytics
      // For web, we use a browser-compatible approach
      const AppCenterCrashes = await this.dynamicImport('appcenter-crashes');
      const AppCenterAnalytics = await this.dynamicImport('appcenter-analytics');

      this.crashes = AppCenterCrashes.default || AppCenterCrashes;
      this.analytics = AppCenterAnalytics.default || AppCenterAnalytics;

      this.sdkLoaded = true;
    } catch (_error) {
      throw new Error(
        `Failed to load AppCenter SDK. Please install:\n` +
          `pnpm add appcenter-crashes appcenter-analytics\n` +
          `Note: AppCenter is primarily for React Native/mobile apps.\n` +
          `For web apps, consider using a different adapter.`
      );
    }
  }

  async initializeSDK(): Promise<void> {
    if (!this.config.appSecret) {
      throw new Error('AppCenter requires an appSecret');
    }

    // Enable crashes
    if (this.crashes && typeof this.crashes.setEnabled === 'function') {
      await this.crashes.setEnabled(true);
    }

    // Enable analytics
    if (this.analytics && typeof this.analytics.setEnabled === 'function') {
      await this.analytics.setEnabled(true);
    }

    // Set user ID if provided
    if (this.config.userId && this.crashes && typeof this.crashes.setUserId === 'function') {
      await this.crashes.setUserId(this.config.userId);
    }
  }

  async captureError(error: NormalizedError): Promise<void> {
    const errorObj = new Error(error.message);
    if (error.stack) {
      errorObj.stack = error.stack;
    }
    errorObj.name = error.type || 'Error';

    // Build properties for AppCenter
    const properties: Record<string, string> = {
      level: error.level || 'error',
      source: error.source || 'unknown',
      handled: String(error.handled),
    };

    // Add tags as properties
    if (error.context.tags) {
      for (const [key, value] of Object.entries(error.context.tags)) {
        properties[key] = String(value);
      }
    }

    // Add extra as properties (stringified)
    if (error.context.extra) {
      for (const [key, value] of Object.entries(error.context.extra)) {
        properties[`extra_${key}`] = typeof value === 'string' ? value : JSON.stringify(value);
      }
    }

    // Track error as exception
    if (this.crashes && typeof this.crashes.trackError === 'function') {
      await this.crashes.trackError(errorObj, properties);
    }

    // Also track as analytics event
    if (this.analytics && typeof this.analytics.trackEvent === 'function') {
      await this.analytics.trackEvent('Error', {
        message: error.message.substring(0, 256), // AppCenter has property length limits
        type: error.type || 'Error',
        ...properties,
      });
    }
  }

  async setContext(context: ErrorContext): Promise<void> {
    if (context.user?.id && this.crashes && typeof this.crashes.setUserId === 'function') {
      await this.crashes.setUserId(context.user.id);
    }

    // Track user identification as analytics event
    if (context.user && this.analytics && typeof this.analytics.trackEvent === 'function') {
      await this.analytics.trackEvent('UserIdentified', {
        userId: context.user.id || 'anonymous',
        email: context.user.email || '',
        username: context.user.username || '',
      });
    }
  }

  async addBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    // AppCenter doesn't have native breadcrumbs, track as analytics event
    if (this.analytics && typeof this.analytics.trackEvent === 'function') {
      await this.analytics.trackEvent('Breadcrumb', {
        message: breadcrumb.message.substring(0, 256),
        category: breadcrumb.category || 'custom',
        level: breadcrumb.level || 'info',
      });
    }
  }

  async flush(): Promise<void> {
    // AppCenter handles sending automatically
  }

  async close(): Promise<void> {
    // Disable services
    if (this.crashes && typeof this.crashes.setEnabled === 'function') {
      await this.crashes.setEnabled(false);
    }
    if (this.analytics && typeof this.analytics.setEnabled === 'function') {
      await this.analytics.setEnabled(false);
    }
  }
}
