import { BaseAdapter } from './base-adapter';
import type { NormalizedError, ErrorContext, Breadcrumb } from '../store/types';

export class RollbarAdapter extends BaseAdapter {
  name = 'rollbar';
  private rollbar: any;

  async loadSDK(): Promise<void> {
    if (this.sdkLoaded) return;

    try {
      const RollbarModule = await this.dynamicImport('rollbar');
      this.rollbar = RollbarModule.default || RollbarModule;
      this.sdkLoaded = true;
    } catch (_error) {
      throw new Error(
        `Failed to load Rollbar SDK. Please install:\n` +
          `pnpm add rollbar\n` +
          `or include Rollbar SDK via CDN`
      );
    }
  }

  async initializeSDK(): Promise<void> {
    if (!this.config.accessToken) {
      throw new Error('Rollbar requires an accessToken');
    }

    this.rollbar = new this.rollbar({
      accessToken: this.config.accessToken,
      captureUncaught: this.config.captureUncaught ?? true,
      captureUnhandledRejections: this.config.captureUnhandledRejections ?? true,
      environment: this.config.environment || 'production',
      codeVersion: this.config.codeVersion || this.config.release,
      autoInstrument: this.config.autoInstrument ?? true,
      maxItems: this.config.maxItems || 5,
      itemsPerMinute: this.config.itemsPerMinute || 60,
      captureIp: this.config.captureIp ?? 'anonymize',
      captureEmail: this.config.captureEmail ?? false,
      captureUsername: this.config.captureUsername ?? false,
      verbose: this.config.verbose ?? false,
      logLevel: this.config.logLevel || 'debug',
      payload: {
        ...this.config.payload,
        client: {
          javascript: {
            source_map_enabled: true,
            code_version: this.config.codeVersion || this.config.release,
          },
        },
      },
    });
  }

  async captureError(error: NormalizedError): Promise<void> {
    const errorObj = new Error(error.message);
    if (error.stack) {
      errorObj.stack = error.stack;
    }
    errorObj.name = error.type || 'Error';

    // Map error level to Rollbar level
    let level: string;
    switch (error.level) {
      case 'fatal':
        level = 'critical';
        break;
      case 'error':
        level = 'error';
        break;
      case 'warning':
        level = 'warning';
        break;
      case 'info':
        level = 'info';
        break;
      default:
        level = 'debug';
    }

    // Build custom data
    const custom: Record<string, any> = {
      source: error.source,
      handled: error.handled,
      ...error.context.extra,
    };

    // Add tags as custom data
    if (error.context.tags) {
      custom.tags = error.context.tags;
    }

    // Add breadcrumbs
    if (error.breadcrumbs.length > 0) {
      custom.breadcrumbs = error.breadcrumbs.map((b) => ({
        message: b.message,
        category: b.category,
        level: b.level,
        timestamp: b.timestamp,
      }));
    }

    // Log to Rollbar with appropriate level
    this.rollbar[level](errorObj, custom);
  }

  async setContext(context: ErrorContext): Promise<void> {
    if (context.user) {
      this.rollbar.configure({
        payload: {
          person: {
            id: context.user.id,
            email: context.user.email,
            username: context.user.username,
          },
        },
      });
    }

    if (context.custom) {
      this.rollbar.configure({
        payload: {
          custom: context.custom,
        },
      });
    }
  }

  async addBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    // Rollbar doesn't have native breadcrumbs, so we log them as info
    this.rollbar.info(`[${breadcrumb.category || 'breadcrumb'}] ${breadcrumb.message}`, {
      breadcrumb: true,
      ...breadcrumb.data,
    });
  }

  async flush(): Promise<void> {
    // Wait for pending items to be sent
    if (this.rollbar && typeof this.rollbar.wait === 'function') {
      await new Promise<void>((resolve) => {
        this.rollbar.wait(resolve);
      });
    }
  }

  async close(): Promise<void> {
    // Rollbar doesn't need explicit cleanup
  }
}
