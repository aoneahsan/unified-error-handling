import { BaseAdapter } from './base-adapter';
import type { NormalizedError, ErrorContext, Breadcrumb } from '../store/types';

export class FirebaseAdapter extends BaseAdapter {
  name = 'firebase';
  private crashlytics: any;
  private analytics: any;

  async loadSDK(): Promise<void> {
    if (this.sdkLoaded) return;

    try {
      // Try to import Firebase SDK
      const { initializeApp, getApps } = await this.dynamicImport('firebase/app');
      const { getCrashlytics } = await this.dynamicImport('firebase/crashlytics');
      const { getAnalytics } = await this.dynamicImport('firebase/analytics');

      // Initialize Firebase app if not already initialized
      let app;
      if (getApps().length === 0) {
        if (!this.config.firebaseConfig) {
          throw new Error('Firebase configuration is required');
        }
        app = initializeApp(this.config.firebaseConfig);
      } else {
        app = getApps()[0];
      }

      this.crashlytics = getCrashlytics(app);
      
      // Analytics is optional
      if (this.config.enableAnalytics !== false) {
        try {
          this.analytics = getAnalytics(app);
        } catch (e) {
          console.warn('Firebase Analytics not available:', e);
        }
      }

      this.sdkLoaded = true;
    } catch (error) {
      throw new Error(
        `Failed to load Firebase SDK. Please install:\n` +
        `npm install firebase\n` +
        `or include Firebase SDK via CDN`
      );
    }
  }

  async initializeSDK(): Promise<void> {
    // Firebase Crashlytics is initialized when getCrashlytics is called
    // Additional configuration can be done here if needed
  }

  async captureError(error: NormalizedError): Promise<void> {
    const { recordException, log, setCustomKey } = await this.dynamicImport('firebase/crashlytics');

    // Set custom keys for context
    if (error.context.tags) {
      for (const [key, value] of Object.entries(error.context.tags)) {
        setCustomKey(this.crashlytics, key, value);
      }
    }

    // Set custom data
    if (error.context.extra) {
      for (const [key, value] of Object.entries(error.context.extra)) {
        setCustomKey(this.crashlytics, key, JSON.stringify(value));
      }
    }

    // Set error metadata
    setCustomKey(this.crashlytics, 'error_level', error.level || 'error');
    setCustomKey(this.crashlytics, 'error_source', error.source || 'unknown');
    setCustomKey(this.crashlytics, 'error_handled', String(error.handled));

    // Log breadcrumbs
    for (const breadcrumb of error.breadcrumbs) {
      log(this.crashlytics, `[${breadcrumb.category || 'general'}] ${breadcrumb.message}`);
    }

    // Create error object
    const errorObj = new Error(error.message);
    if (error.stack) {
      errorObj.stack = error.stack;
    }
    errorObj.name = error.type || 'Error';

    // Record the exception
    recordException(this.crashlytics, errorObj);

    // Also log to Analytics if available
    if (this.analytics) {
      const { logEvent } = await this.dynamicImport('firebase/analytics');
      logEvent(this.analytics, 'exception', {
        description: error.message,
        fatal: error.level === 'fatal',
      });
    }
  }

  async setContext(context: ErrorContext): Promise<void> {
    const { setUserId, setCustomKey } = await this.dynamicImport('firebase/crashlytics');

    if (context.user?.id) {
      setUserId(this.crashlytics, context.user.id);
    }

    if (context.user) {
      for (const [key, value] of Object.entries(context.user)) {
        if (key !== 'id') {
          setCustomKey(this.crashlytics, `user_${key}`, String(value));
        }
      }
    }

    if (context.device) {
      for (const [key, value] of Object.entries(context.device)) {
        setCustomKey(this.crashlytics, `device_${key}`, String(value));
      }
    }

    if (context.custom) {
      for (const [key, value] of Object.entries(context.custom)) {
        setCustomKey(this.crashlytics, key, JSON.stringify(value));
      }
    }
  }

  async addBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    const { log } = await this.dynamicImport('firebase/crashlytics');
    const level = breadcrumb.level || 'info';
    const category = breadcrumb.category || 'general';
    log(this.crashlytics, `[${level}][${category}] ${breadcrumb.message}`);
  }

  async flush(): Promise<void> {
    // Firebase Crashlytics doesn't have a flush method
    // Errors are sent automatically
  }

  async close(): Promise<void> {
    // Firebase Crashlytics doesn't need to be closed
  }
}