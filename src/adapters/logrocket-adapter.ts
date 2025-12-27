import { BaseAdapter } from './base-adapter';
import type { NormalizedError, ErrorContext, Breadcrumb } from '../store/types';

export class LogRocketAdapter extends BaseAdapter {
  name = 'logrocket';
  private logRocket: any;

  async loadSDK(): Promise<void> {
    if (this.sdkLoaded) return;

    try {
      const LogRocketModule = await this.dynamicImport('logrocket');
      this.logRocket = LogRocketModule.default || LogRocketModule;
      this.sdkLoaded = true;
    } catch (_error) {
      throw new Error(
        `Failed to load LogRocket SDK. Please install:\n` +
          `pnpm add logrocket\n` +
          `or include LogRocket SDK via CDN`
      );
    }
  }

  async initializeSDK(): Promise<void> {
    if (!this.config.appId) {
      throw new Error('LogRocket requires an appId');
    }

    this.logRocket.init(this.config.appId, {
      release: this.config.release,
      console: {
        isEnabled: this.config.console ?? true,
      },
      network: {
        isEnabled: this.config.network ?? true,
        requestSanitizer: this.config.requestSanitizer,
        responseSanitizer: this.config.responseSanitizer,
      },
      dom: {
        isEnabled: this.config.dom ?? true,
        inputSanitizer: this.config.inputSanitizer ?? true,
        textSanitizer: this.config.textSanitizer ?? false,
      },
      shouldCaptureIP: this.config.shouldCaptureIP ?? false,
      rootHostname: this.config.rootHostname,
      mergeIframes: this.config.mergeIframes ?? false,
    });
  }

  async captureError(error: NormalizedError): Promise<void> {
    const errorObj = new Error(error.message);
    if (error.stack) {
      errorObj.stack = error.stack;
    }
    errorObj.name = error.type || 'Error';

    // LogRocket captureException
    this.logRocket.captureException(errorObj, {
      tags: error.context.tags || {},
      extra: {
        level: error.level,
        source: error.source,
        handled: error.handled,
        ...error.context.extra,
      },
    });

    // Also track as an event for analytics
    this.logRocket.track('Error', {
      message: error.message,
      type: error.type,
      level: error.level,
      source: error.source,
      handled: error.handled,
    });
  }

  async setContext(context: ErrorContext): Promise<void> {
    if (context.user) {
      this.logRocket.identify(context.user.id || 'anonymous', {
        email: context.user.email,
        name: context.user.username,
        ...context.user,
      });
    }

    if (context.custom) {
      for (const [key, value] of Object.entries(context.custom)) {
        this.logRocket.track(key, value);
      }
    }
  }

  async addBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    // LogRocket doesn't have explicit breadcrumbs, use track instead
    this.logRocket.track(breadcrumb.category || 'breadcrumb', {
      message: breadcrumb.message,
      level: breadcrumb.level,
      ...breadcrumb.data,
    });
  }

  async flush(): Promise<void> {
    // LogRocket handles flushing automatically
  }

  async close(): Promise<void> {
    // LogRocket doesn't need explicit cleanup
  }
}
