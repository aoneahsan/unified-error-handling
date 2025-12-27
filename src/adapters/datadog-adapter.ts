import { BaseAdapter } from './base-adapter';
import type { NormalizedError, ErrorContext, Breadcrumb } from '../store/types';

export class DataDogAdapter extends BaseAdapter {
  name = 'datadog';
  private datadogRum: any;
  private datadogLogs: any;

  async loadSDK(): Promise<void> {
    if (this.sdkLoaded) return;

    try {
      const ddRum = await this.dynamicImport('@datadog/browser-rum');
      const ddLogs = await this.dynamicImport('@datadog/browser-logs');

      this.datadogRum = ddRum.datadogRum;
      this.datadogLogs = ddLogs.datadogLogs;

      this.sdkLoaded = true;
    } catch (_error) {
      throw new Error(
        `Failed to load DataDog SDK. Please install:\n` +
          `pnpm add @datadog/browser-rum @datadog/browser-logs\n` +
          `or include DataDog SDK via CDN`
      );
    }
  }

  async initializeSDK(): Promise<void> {
    if (!this.config.applicationId || !this.config.clientToken) {
      throw new Error('DataDog requires applicationId and clientToken');
    }

    // Initialize RUM
    this.datadogRum.init({
      applicationId: this.config.applicationId,
      clientToken: this.config.clientToken,
      site: this.config.site || 'datadoghq.com',
      service: this.config.service || 'unified-error-handling',
      env: this.config.environment || 'production',
      version: this.config.release || '1.0.0',
      sessionSampleRate: this.config.sessionSampleRate ?? 100,
      sessionReplaySampleRate: this.config.sessionReplaySampleRate ?? 0,
      trackUserInteractions: this.config.trackInteractions ?? true,
      trackResources: true,
      trackLongTasks: true,
      defaultPrivacyLevel: this.config.defaultPrivacyLevel || 'mask-user-input',
    });

    // Initialize Logs
    this.datadogLogs.init({
      clientToken: this.config.clientToken,
      site: this.config.site || 'datadoghq.com',
      service: this.config.service || 'unified-error-handling',
      env: this.config.environment || 'production',
      forwardErrorsToLogs: true,
      sessionSampleRate: 100,
    });

    // Start session replay if enabled
    if (this.config.sessionReplaySampleRate && this.config.sessionReplaySampleRate > 0) {
      this.datadogRum.startSessionReplayRecording();
    }
  }

  async captureError(error: NormalizedError): Promise<void> {
    // Create error object
    const errorObj = new Error(error.message);
    if (error.stack) {
      errorObj.stack = error.stack;
    }
    errorObj.name = error.type || 'Error';

    // Add error to RUM
    this.datadogRum.addError(errorObj, {
      source: error.source || 'custom',
      level: error.level || 'error',
      handled: error.handled,
      ...error.context.extra,
    });

    // Also log to DataDog Logs
    this.datadogLogs.logger.error(error.message, {
      error: {
        kind: error.type,
        message: error.message,
        stack: error.stack,
      },
      ...error.context.tags,
      ...error.context.extra,
    });
  }

  async setContext(context: ErrorContext): Promise<void> {
    if (context.user) {
      this.datadogRum.setUser({
        id: context.user.id,
        email: context.user.email,
        name: context.user.username,
        ...context.user,
      });
    }

    if (context.custom) {
      for (const [key, value] of Object.entries(context.custom)) {
        this.datadogRum.setGlobalContextProperty(key, value);
      }
    }

    if (context.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        this.datadogRum.setGlobalContextProperty(key, value);
      }
    }
  }

  async addBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    this.datadogRum.addAction(breadcrumb.message, {
      category: breadcrumb.category || 'custom',
      level: breadcrumb.level || 'info',
      ...breadcrumb.data,
    });
  }

  async flush(): Promise<void> {
    // DataDog SDK handles flushing automatically
  }

  async close(): Promise<void> {
    // Stop session replay recording if it was started
    if (this.config.sessionReplaySampleRate && this.config.sessionReplaySampleRate > 0) {
      this.datadogRum.stopSessionReplayRecording();
    }
  }
}
