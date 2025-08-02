import { BaseAdapter } from './base-adapter';
import type { NormalizedError, ErrorContext, Breadcrumb } from '../store/types';

export class SentryAdapter extends BaseAdapter {
  name = 'sentry';
  private Sentry: any;

  async loadSDK(): Promise<void> {
    if (this.sdkLoaded) return;

    try {
      // Try to dynamically import Sentry
      const sentryModule = await this.dynamicImport('@sentry/browser');
      this.Sentry = sentryModule;
      this.sdkLoaded = true;
    } catch (error) {
      // If dynamic import fails, check if it's available on window (CDN)
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        this.Sentry = (window as any).Sentry;
        this.sdkLoaded = true;
      } else {
        throw error;
      }
    }
  }

  async initializeSDK(): Promise<void> {
    if (!this.config.dsn) {
      throw new Error('Sentry DSN is required');
    }

    this.Sentry.init({
      dsn: this.config.dsn,
      environment: this.config.environment,
      release: this.config.release,
      debug: this.config.debug,
      beforeSend: this.config.beforeSend,
      // Disable Sentry's own global handlers since we handle them
      integrations: this.config.integrations ? 
        this.config.integrations :
        (integrations: any[]) => 
          integrations.filter(integration => 
            !['GlobalHandlers', 'TryCatch'].includes(integration.name)
          ),
    });
  }

  async captureError(error: NormalizedError): Promise<void> {
    // Convert our normalized error to Sentry format
    const sentryError = new Error(error.message);
    if (error.stack) {
      sentryError.stack = error.stack;
    }

    this.Sentry.captureException(sentryError, {
      level: error.level as any,
      contexts: {
        custom: error.context.custom,
        device: error.context.device,
      },
      tags: error.context.tags,
      extra: {
        ...error.context.extra,
        fingerprint: error.fingerprint,
        handled: error.handled,
        source: error.source,
      },
      user: error.context.user,
      breadcrumbs: error.breadcrumbs.map(b => ({
        timestamp: b.timestamp / 1000, // Sentry expects seconds
        message: b.message,
        category: b.category,
        level: b.level as any,
        data: b.data,
      })),
    });
  }

  async setContext(context: ErrorContext): Promise<void> {
    if (context.user) {
      this.Sentry.setUser(context.user);
    }
    
    if (context.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        this.Sentry.setTag(key, value);
      });
    }

    if (context.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        this.Sentry.setExtra(key, value);
      });
    }

    if (context.custom) {
      this.Sentry.setContext('custom', context.custom);
    }

    if (context.device) {
      this.Sentry.setContext('device', context.device);
    }
  }

  async addBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    this.Sentry.addBreadcrumb({
      timestamp: breadcrumb.timestamp / 1000,
      message: breadcrumb.message,
      category: breadcrumb.category,
      level: breadcrumb.level as any,
      data: breadcrumb.data,
    });
  }

  async flush(): Promise<void> {
    await this.Sentry.flush();
  }

  async close(): Promise<void> {
    await this.Sentry.close();
  }
}