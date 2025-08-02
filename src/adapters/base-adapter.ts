import type { ErrorAdapter, NormalizedError, ErrorContext, Breadcrumb } from '../store/types';

export abstract class BaseAdapter implements ErrorAdapter {
  abstract name: string;
  protected config: any;
  protected sdkInstance: any;
  protected sdkLoaded = false;

  async initialize(config: any): Promise<void> {
    this.config = config;
    await this.loadSDK();
    await this.initializeSDK();
  }

  abstract loadSDK(): Promise<void>;
  abstract initializeSDK(): Promise<void>;
  abstract captureError(error: NormalizedError): Promise<void>;

  async captureMessage(message: string, level?: string): Promise<void> {
    const error: NormalizedError = {
      message,
      timestamp: Date.now(),
      context: {},
      breadcrumbs: [],
      level: level as any || 'info',
      handled: true,
      source: 'manual',
    };
    await this.captureError(error);
  }

  async setContext(_context: ErrorContext): Promise<void> {
    // Override in subclass if supported
  }

  async addBreadcrumb(_breadcrumb: Breadcrumb): Promise<void> {
    // Override in subclass if supported
  }

  async flush(): Promise<void> {
    // Override in subclass if supported
  }

  async close(): Promise<void> {
    // Override in subclass if supported
  }

  protected async dynamicImport(packageName: string): Promise<any> {
    try {
      // Try to import from node_modules first
      return await import(packageName);
    } catch (error) {
      // If that fails, provide helpful error message
      throw new Error(
        `Failed to load ${packageName}. Please install it:\n` +
        `npm install ${packageName}\n` +
        `or\n` +
        `yarn add ${packageName}`
      );
    }
  }
}