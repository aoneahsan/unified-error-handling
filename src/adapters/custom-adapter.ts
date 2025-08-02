import type { ErrorAdapter, NormalizedError, ErrorContext, Breadcrumb } from '../store/types';

export interface CustomAdapterConfig {
  send: (error: NormalizedError, context: ErrorContext) => Promise<void>;
  initialize?: () => Promise<void>;
  setContext?: (context: ErrorContext) => Promise<void>;
  addBreadcrumb?: (breadcrumb: Breadcrumb) => Promise<void>;
  flush?: () => Promise<void>;
  close?: () => Promise<void>;
}

export class CustomAdapter implements ErrorAdapter {
  name = 'custom';
  private config: CustomAdapterConfig;
  private context: ErrorContext = {};
  private breadcrumbs: Breadcrumb[] = [];

  constructor(config: CustomAdapterConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.config.initialize) {
      await this.config.initialize();
    }
  }

  async captureError(error: NormalizedError): Promise<void> {
    // Merge stored context with error context
    const fullContext = {
      ...this.context,
      ...error.context,
    };

    // Call user's send function
    await this.config.send(error, fullContext);
  }

  async captureMessage(message: string, level?: string): Promise<void> {
    const error: NormalizedError = {
      message,
      timestamp: Date.now(),
      context: this.context,
      breadcrumbs: [...this.breadcrumbs],
      level: level as any || 'info',
      handled: true,
      source: 'manual',
    };
    await this.captureError(error);
  }

  async setContext(context: ErrorContext): Promise<void> {
    this.context = { ...context };
    
    if (this.config.setContext) {
      await this.config.setContext(context);
    }
  }

  async addBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    this.breadcrumbs.push(breadcrumb);
    
    if (this.config.addBreadcrumb) {
      await this.config.addBreadcrumb(breadcrumb);
    }
  }

  async flush(): Promise<void> {
    if (this.config.flush) {
      await this.config.flush();
    }
  }

  async close(): Promise<void> {
    if (this.config.close) {
      await this.config.close();
    }
  }
}

// Factory function for easier usage
export function createCustomAdapter(config: CustomAdapterConfig): ErrorAdapter {
  return new CustomAdapter(config);
}