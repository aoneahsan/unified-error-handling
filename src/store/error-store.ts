import type {
  ErrorStore,
  ErrorStoreConfig,
  ErrorContext,
  UserContext,
  Breadcrumb,
  NormalizedError,
  ErrorAdapter,
  ErrorListener,
} from './types';
import { enrichError } from '../utils/error-enricher';
import { consoleInterceptor } from '../utils/console-interceptor';
import { networkInterceptor } from '../utils/network-interceptor';

class ErrorStoreImpl implements ErrorStore {
  // State
  context: ErrorContext = {};
  breadcrumbs: Breadcrumb[] = [];
  adapters: Map<string, ErrorAdapter> = new Map();
  activeAdapter: string | null = null;
  config: ErrorStoreConfig = {
    maxBreadcrumbs: 100,
    enableGlobalHandlers: true,
    enableOfflineQueue: true,
    enableConsoleCapture: true,
    enableNetworkCapture: false,
    debug: false,
  };
  initialized = false;
  offline = false;
  errorQueue: NormalizedError[] = [];

  // Private properties
  private listeners = new Set<ErrorListener>();
  private globalHandlersInstalled = false;
  private offlineHandler?: () => void;
  private onlineHandler?: () => void;

  constructor() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.setupOfflineHandlers();
    }
  }

  // Actions
  initialize(config?: ErrorStoreConfig): void {
    if (this.initialized) {
      console.warn('[ErrorStore] Already initialized');
      return;
    }

    this.config = { ...this.config, ...config };
    this.initialized = true;

    if (this.config.enableGlobalHandlers && typeof window !== 'undefined') {
      this.installGlobalHandlers();
    }

    if (this.config.enableConsoleCapture) {
      consoleInterceptor.enable();
    }

    if (this.config.enableNetworkCapture) {
      networkInterceptor.enable();
    }

    // Set up device context automatically
    if (typeof window !== 'undefined') {
      this.setContext({
        device: {
          platform: 'web',
          userAgent: navigator.userAgent,
          language: navigator.language,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        },
      });
    }
  }

  captureError(error: Error | string, additionalContext?: Partial<ErrorContext>): void {
    if (!this.initialized) {
      console.warn('[ErrorStore] Not initialized. Call initialize() first.');
      return;
    }

    let normalizedError = this.normalizeError(error, additionalContext);
    
    // Enrich the error with additional context
    normalizedError = enrichError(normalizedError);
    
    // Apply beforeSend hook
    if (this.config.beforeSend) {
      const processed = this.config.beforeSend(normalizedError);
      if (!processed) return; // Skip if beforeSend returns null
    }

    // Add to offline queue if offline
    if (this.offline && this.config.enableOfflineQueue) {
      this.errorQueue.push(normalizedError);
      return;
    }

    // Send to active adapter
    this.sendToAdapter(normalizedError);

    // Notify listeners
    this.listeners.forEach(listener => listener(normalizedError));
  }

  captureMessage(message: string, level: string = 'info'): void {
    const error = new Error(message);
    error.name = 'CapturedMessage';
    this.captureError(error, { extra: { level } });
  }

  setUser(user: UserContext | null): void {
    if (user === null) {
      delete this.context.user;
    } else {
      this.context.user = { ...user };
    }
    
    // Update adapter context if it supports it
    if (this.activeAdapter) {
      const adapter = this.adapters.get(this.activeAdapter);
      adapter?.setContext?.(this.context);
    }
  }

  setContext(context: Partial<ErrorContext>): void {
    this.context = {
      ...this.context,
      ...context,
      // Deep merge for nested objects
      user: context.user ? { ...this.context.user, ...context.user } : this.context.user,
      device: context.device ? { ...this.context.device, ...context.device } : this.context.device,
      custom: context.custom ? { ...this.context.custom, ...context.custom } : this.context.custom,
      tags: context.tags ? { ...this.context.tags, ...context.tags } : this.context.tags,
      extra: context.extra ? { ...this.context.extra, ...context.extra } : this.context.extra,
    };

    // Update adapter context if it supports it
    if (this.activeAdapter) {
      const adapter = this.adapters.get(this.activeAdapter);
      adapter?.setContext?.(this.context);
    }
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Trim breadcrumbs if needed
    if (this.config.maxBreadcrumbs && this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }

    // Send to adapter if it supports breadcrumbs
    if (this.activeAdapter) {
      const adapter = this.adapters.get(this.activeAdapter);
      adapter?.addBreadcrumb?.(fullBreadcrumb);
    }
  }

  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  async useAdapter(name: string, config?: any): Promise<void> {
    // Check if adapter is already registered
    let adapter = this.adapters.get(name);
    
    if (!adapter) {
      // Try to load built-in adapter
      adapter = await this.loadBuiltInAdapter(name) || undefined;
      
      if (!adapter) {
        throw new Error(`Adapter '${name}' not found. You may need to register a custom adapter.`);
      }
    }

    // Initialize the adapter
    await adapter.initialize(config);
    
    // Register and activate
    this.adapters.set(name, adapter);
    this.activeAdapter = name;

    // Send current context to adapter
    if (adapter.setContext) {
      await adapter.setContext(this.context);
    }

    // Send existing breadcrumbs
    if (adapter.addBreadcrumb) {
      for (const breadcrumb of this.breadcrumbs) {
        await adapter.addBreadcrumb(breadcrumb);
      }
    }

    // Process offline queue
    if (this.errorQueue.length > 0) {
      await this.processOfflineQueue();
    }
  }

  removeAdapter(name: string): void {
    const adapter = this.adapters.get(name);
    if (adapter) {
      adapter.close?.();
      this.adapters.delete(name);
      
      if (this.activeAdapter === name) {
        this.activeAdapter = null;
      }
    }
  }

  async flush(): Promise<void> {
    if (this.activeAdapter) {
      const adapter = this.adapters.get(this.activeAdapter);
      await adapter?.flush?.();
    }
  }

  reset(): void {
    // Close all adapters
    this.adapters.forEach(adapter => adapter.close?.());
    
    // Reset state
    this.context = {};
    this.breadcrumbs = [];
    this.adapters.clear();
    this.activeAdapter = null;
    this.errorQueue = [];
    this.initialized = false;
    
    // Remove global handlers
    if (this.globalHandlersInstalled) {
      this.removeGlobalHandlers();
    }
    
    // Disable interceptors
    consoleInterceptor.disable();
    networkInterceptor.disable();
  }

  // Public methods for advanced usage
  subscribe(listener: ErrorListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  registerAdapter(name: string, adapter: ErrorAdapter): void {
    this.adapters.set(name, adapter);
  }

  // Private methods
  private normalizeError(error: Error | string, additionalContext?: Partial<ErrorContext>): NormalizedError {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    return {
      message: errorObj.message || 'Unknown error',
      stack: errorObj.stack,
      type: errorObj.name || 'Error',
      timestamp: Date.now(),
      context: {
        ...this.context,
        ...additionalContext,
      },
      breadcrumbs: [...this.breadcrumbs],
      level: 'error',
      handled: true,
      source: 'manual',
    };
  }

  private async sendToAdapter(error: NormalizedError): Promise<void> {
    if (!this.activeAdapter) {
      if (this.config.debug) {
        console.error('[ErrorStore] No active adapter. Error:', error);
      }
      return;
    }

    const adapter = this.adapters.get(this.activeAdapter);
    if (adapter) {
      try {
        await adapter.captureError(error);
      } catch (err) {
        console.error(`[ErrorStore] Failed to send error to adapter '${this.activeAdapter}':`, err);
      }
    }
  }

  private installGlobalHandlers(): void {
    if (this.globalHandlersInstalled) return;

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        extra: {
          source: 'global',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      this.captureError(error, {
        extra: {
          source: 'unhandledRejection',
          promise: event.promise,
        },
      });
    });

    this.globalHandlersInstalled = true;
  }

  private removeGlobalHandlers(): void {
    // Note: We can't remove anonymous event listeners
    // This is why we should refactor to use named functions if needed
    this.globalHandlersInstalled = false;
  }

  private setupOfflineHandlers(): void {
    this.offline = !navigator.onLine;

    this.offlineHandler = () => {
      this.offline = true;
      this.addBreadcrumb({
        message: 'Device went offline',
        category: 'network',
        level: 'warning',
      });
    };

    this.onlineHandler = () => {
      this.offline = false;
      this.addBreadcrumb({
        message: 'Device came online',
        category: 'network',
        level: 'info',
      });
      
      // Process offline queue
      if (this.errorQueue.length > 0) {
        this.processOfflineQueue();
      }
    };

    window.addEventListener('offline', this.offlineHandler);
    window.addEventListener('online', this.onlineHandler);
  }

  private async processOfflineQueue(): Promise<void> {
    const errors = [...this.errorQueue];
    this.errorQueue = [];

    for (const error of errors) {
      await this.sendToAdapter(error);
    }
  }

  private async loadBuiltInAdapter(name: string): Promise<ErrorAdapter | null> {
    switch (name) {
      case 'console':
        return {
          name: 'console',
          async initialize() {
            console.log('[ConsoleAdapter] Initialized');
          },
          async captureError(error: NormalizedError) {
            console.error('[Error]', error);
          },
          async captureMessage(message: string, level?: string) {
            console.log(`[${level || 'info'}]`, message);
          },
        };
      
      case 'sentry':
      case 'firebase':
        // Dynamically load adapter
        const { loadAdapter } = await import('../adapters');
        return await loadAdapter(name);
      
      default:
        return null;
    }
  }
}

// Create singleton instance
export const errorStore = new ErrorStoreImpl();

// Export convenience methods
export const {
  initialize,
  captureError,
  captureMessage,
  setUser,
  setContext,
  addBreadcrumb,
  clearBreadcrumbs,
  useAdapter,
  removeAdapter,
  flush,
  reset,
  subscribe,
  registerAdapter,
} = errorStore;