import { BaseAdapter } from './base-adapter';
import type { NormalizedError, ErrorContext, Breadcrumb } from '../store/types';

export class RaygunAdapter extends BaseAdapter {
  name = 'raygun';
  private raygun: any;

  async loadSDK(): Promise<void> {
    if (this.sdkLoaded) return;

    try {
      const RaygunModule = await this.dynamicImport('raygun4js');
      this.raygun = RaygunModule.default || RaygunModule;
      this.sdkLoaded = true;
    } catch (_error) {
      throw new Error(
        `Failed to load Raygun SDK. Please install:\n` +
          `pnpm add raygun4js\n` +
          `or include Raygun SDK via CDN`
      );
    }
  }

  async initializeSDK(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('Raygun requires an apiKey');
    }

    this.raygun('apiKey', this.config.apiKey);

    // Configure options
    this.raygun('options', {
      ignoreAjaxAbort: this.config.ignoreAjaxAbort ?? true,
      ignoreAjaxError: this.config.ignoreAjaxError ?? false,
      debugMode: this.config.debug ?? false,
      wrapAsynchronousCallbacks: true,
      disableAnonymousUserTracking: this.config.disableAnonymousUserTracking ?? false,
      disableErrorTracking: this.config.disableErrorTracking ?? false,
      disablePulse: this.config.disablePulse ?? true,
      pulseMaxVirtualPageDuration: 30 * 60 * 1000, // 30 minutes
      pulseIgnoreUrlCasing: true,
    });

    // Set version
    if (this.config.release) {
      this.raygun('setVersion', this.config.release);
    }

    // Enable crash reporting
    this.raygun('enableCrashReporting', this.config.enableCrashReporting ?? true);

    // Enable Pulse (Real User Monitoring) if configured
    if (!this.config.disablePulse) {
      this.raygun('enablePulse', true);
    }

    // Set initial tags
    if (this.config.withTags && this.config.withTags.length > 0) {
      this.raygun('withTags', this.config.withTags);
    }

    // Set custom data
    if (this.config.customData) {
      this.raygun('withCustomData', this.config.customData);
    }
  }

  async captureError(error: NormalizedError): Promise<void> {
    const errorObj = new Error(error.message);
    if (error.stack) {
      errorObj.stack = error.stack;
    }
    errorObj.name = error.type || 'Error';

    // Build custom data
    const customData: Record<string, any> = {
      level: error.level,
      source: error.source,
      handled: error.handled,
      breadcrumbs: error.breadcrumbs.map((b) => ({
        message: b.message,
        category: b.category,
        timestamp: b.timestamp,
      })),
      ...error.context.extra,
    };

    // Build tags
    const tags: string[] = [];
    if (error.context.tags) {
      for (const [key, value] of Object.entries(error.context.tags)) {
        tags.push(`${key}:${value}`);
      }
    }
    tags.push(`level:${error.level}`);
    tags.push(`handled:${error.handled}`);

    // Send error
    this.raygun('send', errorObj, customData, tags);
  }

  async setContext(context: ErrorContext): Promise<void> {
    if (context.user) {
      this.raygun('setUser', {
        identifier: context.user.id,
        email: context.user.email,
        fullName: context.user.username,
        isAnonymous: !context.user.id,
      });
    }

    if (context.custom) {
      this.raygun('withCustomData', context.custom);
    }

    if (context.tags) {
      const tags = Object.entries(context.tags).map(([key, value]) => `${key}:${value}`);
      this.raygun('withTags', tags);
    }
  }

  async addBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    // Raygun doesn't have native breadcrumbs, record as custom data
    this.raygun('recordBreadcrumb', breadcrumb.message, {
      category: breadcrumb.category,
      level: breadcrumb.level,
      ...breadcrumb.data,
    });
  }

  async flush(): Promise<void> {
    // Raygun handles sending automatically
  }

  async close(): Promise<void> {
    // Disable tracking
    this.raygun('enableCrashReporting', false);
    this.raygun('enablePulse', false);
  }
}
