import { BaseAdapter } from './base-adapter';
import type { NormalizedError, ErrorContext, Breadcrumb } from '../store/types';

export class BugsnagAdapter extends BaseAdapter {
  name = 'bugsnag';
  private bugsnag: any;

  async loadSDK(): Promise<void> {
    if (this.sdkLoaded) return;

    try {
      const BugsnagModule = await this.dynamicImport('@bugsnag/js');
      this.bugsnag = BugsnagModule.default || BugsnagModule;
      this.sdkLoaded = true;
    } catch (_error) {
      throw new Error(
        `Failed to load Bugsnag SDK. Please install:\n` +
          `pnpm add @bugsnag/js\n` +
          `or include Bugsnag SDK via CDN`
      );
    }
  }

  async initializeSDK(): Promise<void> {
    if (!this.config.apiKey) {
      throw new Error('Bugsnag requires an apiKey');
    }

    this.bugsnag.start({
      apiKey: this.config.apiKey,
      appVersion: this.config.appVersion || this.config.release,
      appType: this.config.appType || 'browser',
      releaseStage: this.config.environment || 'production',
      enabledReleaseStages: this.config.enabledReleaseStages || [
        'development',
        'staging',
        'production',
      ],
      autoDetectErrors: this.config.autoDetectErrors ?? true,
      autoTrackSessions: this.config.autoSessionTracking ?? true,
      maxBreadcrumbs: this.config.maxBreadcrumbs || 25,
      enabledBreadcrumbTypes: this.config.enabledBreadcrumbTypes || [
        'error',
        'log',
        'navigation',
        'request',
        'user',
      ],
      redactedKeys: this.config.redactedKeys || ['password', 'token', 'secret', 'apiKey'],
      onError: (event: any) => {
        // Apply custom context
        if (this.config.context) {
          event.addMetadata('custom', this.config.context);
        }
        if (this.config.tags) {
          event.addMetadata('tags', this.config.tags);
        }
        return true;
      },
    });
  }

  async captureError(error: NormalizedError): Promise<void> {
    const errorObj = new Error(error.message);
    if (error.stack) {
      errorObj.stack = error.stack;
    }
    errorObj.name = error.type || 'Error';

    this.bugsnag.notify(errorObj, (event: any) => {
      // Set severity based on error level
      switch (error.level) {
        case 'fatal':
        case 'error':
          event.severity = 'error';
          break;
        case 'warning':
          event.severity = 'warning';
          break;
        default:
          event.severity = 'info';
      }

      // Add metadata
      if (error.context.tags) {
        event.addMetadata('tags', error.context.tags);
      }
      if (error.context.extra) {
        event.addMetadata('extra', error.context.extra);
      }

      // Set handled status
      event.unhandled = !error.handled;

      // Add breadcrumbs
      for (const breadcrumb of error.breadcrumbs) {
        event.addMetadata('breadcrumbs', {
          [breadcrumb.timestamp || Date.now()]: breadcrumb.message,
        });
      }
    });
  }

  async setContext(context: ErrorContext): Promise<void> {
    if (context.user) {
      this.bugsnag.setUser(context.user.id, context.user.email, context.user.username);
    }

    if (context.custom) {
      this.bugsnag.addMetadata('custom', context.custom);
    }

    if (context.device) {
      this.bugsnag.addMetadata('device', context.device);
    }

    if (context.tags) {
      this.bugsnag.addMetadata('tags', context.tags);
    }
  }

  async addBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    this.bugsnag.leaveBreadcrumb(breadcrumb.message, breadcrumb.data || {}, breadcrumb.category);
  }

  async flush(): Promise<void> {
    // Bugsnag doesn't have an explicit flush method
    // Events are sent automatically
  }

  async close(): Promise<void> {
    // Bugsnag doesn't need explicit cleanup
  }
}
