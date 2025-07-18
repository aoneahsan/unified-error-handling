import { WebPlugin } from '@capacitor/core';
import type {
  UnifiedErrorHandlingPlugin,
  InitializeOptions,
} from './definitions';
import {
  ErrorContext,
  UserContext,
  Breadcrumb,
  ErrorLevel,
  UnifiedErrorConfig,
  ProviderConfig,
  ErrorProviderType,
  ErrorProvider,
  ProviderRegistry,
  // NormalizedError,
} from './types';
import {
  ErrorNormalizer,
  BreadcrumbManager,
  ContextManager,
  networkMonitor,
  StorageManager,
} from './utils';
import { ProviderRegistryImpl } from './providers/registry';
import { OfflineQueue } from './native/offline-queue';

export class UnifiedErrorHandlingWeb extends WebPlugin implements UnifiedErrorHandlingPlugin {
  private currentProvider?: ErrorProvider;
  private config?: UnifiedErrorConfig;
  private breadcrumbManager?: BreadcrumbManager;
  private offlineQueue?: OfflineQueue;
  private registry: ProviderRegistry = new ProviderRegistryImpl();
  private initialized: boolean = false;

  async initialize(options: InitializeOptions): Promise<void> {
    if (this.initialized) {
      throw new Error('UnifiedErrorHandling is already initialized');
    }

    // Initialize context manager
    await ContextManager.initialize();

    // Start network monitoring
    networkMonitor.start();

    // Initialize breadcrumb manager
    this.breadcrumbManager = new BreadcrumbManager({
      maxBreadcrumbs: options.provider.maxBreadcrumbs,
      consoleTracking: options.provider.consoleTracking,
      networkTracking: options.provider.networkTracking,
    });

    // Initialize offline queue
    this.offlineQueue = new OfflineQueue({
      maxSize: options.provider.maxOfflineQueueSize || 100,
      retryDelay: options.provider.offlineRetryDelay || 30000,
    });

    // Set configuration
    this.config = options;

    // Initialize provider
    await this.initializeProvider(options.provider);

    // Set up global error handlers
    this.setupGlobalErrorHandlers();

    // Subscribe breadcrumb manager to provider
    if (this.breadcrumbManager && this.currentProvider) {
      this.breadcrumbManager.subscribe((breadcrumb) => {
        this.currentProvider?.addBreadcrumb(breadcrumb);
      });
    }

    // Start offline queue processing
    if (this.offlineQueue && this.currentProvider) {
      this.offlineQueue.start(this.currentProvider);
    }

    this.initialized = true;
  }

  async logError(error: Error | string, context?: ErrorContext): Promise<void> {
    this.ensureInitialized();

    // Normalize error
    const normalizedError = ErrorNormalizer.normalize(error, context);

    // Add device and app context
    const contexts = await ContextManager.getAllContexts();
    normalizedError.device = { ...contexts.device, ...normalizedError.device };
    normalizedError.app = { ...contexts.app, ...normalizedError.app };
    normalizedError.network = contexts.network;

    // Apply privacy settings
    const sanitized = this.config?.privacy?.scrubPII
      ? ErrorNormalizer.sanitize(normalizedError, this.config.privacy)
      : normalizedError;

    // Log to provider
    if (this.currentProvider) {
      try {
        await this.currentProvider.logError(sanitized);
        
        // Update metrics
        await StorageManager.updateMetrics((metrics) => ({
          ...metrics,
          totalErrors: metrics.totalErrors + 1,
          successfulErrors: metrics.successfulErrors + 1,
        }));
      } catch (error) {
        console.error('Failed to log error:', error);
        
        // Queue for offline retry if enabled
        if (this.config?.provider.enableOffline && this.offlineQueue) {
          await this.offlineQueue.enqueue(sanitized, this.config.provider.provider);
        }

        // Update metrics
        await StorageManager.updateMetrics((metrics) => ({
          ...metrics,
          totalErrors: metrics.totalErrors + 1,
          failedErrors: metrics.failedErrors + 1,
        }));

        throw error;
      }
    }
  }

  async logMessage(
    message: string,
    level: ErrorLevel = ErrorLevel.INFO,
    context?: ErrorContext
  ): Promise<void> {
    this.ensureInitialized();

    if (this.currentProvider) {
      await this.currentProvider.logMessage(message, level, context);
    }
  }

  async setUser(user: UserContext | null): Promise<void> {
    this.ensureInitialized();

    // Save to storage
    if (user) {
      await StorageManager.saveUserContext(user);
    } else {
      await StorageManager.clearUserContext();
    }

    // Update provider
    if (this.currentProvider) {
      await this.currentProvider.setUser(user);
    }
  }

  async setContext(key: string, value: any): Promise<void> {
    this.ensureInitialized();

    if (this.currentProvider) {
      await this.currentProvider.setContext(key, value);
    }
  }

  async addBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    this.ensureInitialized();

    // Add to breadcrumb manager
    if (this.breadcrumbManager) {
      this.breadcrumbManager.add(breadcrumb);
    }
  }

  async setTags(tags: Record<string, string>): Promise<void> {
    this.ensureInitialized();

    if (this.currentProvider) {
      await this.currentProvider.setTags(tags);
    }
  }

  async setTag(key: string, value: string): Promise<void> {
    await this.setTags({ [key]: value });
  }

  async setExtra(key: string, value: any): Promise<void> {
    this.ensureInitialized();

    if (this.currentProvider) {
      await this.currentProvider.setExtra(key, value);
    }
  }

  async clearBreadcrumbs(): Promise<void> {
    this.ensureInitialized();

    // Clear in breadcrumb manager
    if (this.breadcrumbManager) {
      this.breadcrumbManager.clear();
    }

    // Clear in provider
    if (this.currentProvider) {
      await this.currentProvider.clearBreadcrumbs();
    }
  }

  async clearUser(): Promise<void> {
    await this.setUser(null);
  }

  async switchProvider(
    provider: ErrorProviderType,
    config?: ProviderConfig
  ): Promise<void> {
    this.ensureInitialized();

    // Flush current provider
    if (this.currentProvider) {
      await this.currentProvider.flush();
      await this.currentProvider.destroy();
    }

    // Update config
    const newConfig: ProviderConfig = config || {
      ...this.config!.provider,
      provider,
    } as ProviderConfig;

    // Initialize new provider
    await this.initializeProvider(newConfig);

    // Update config
    this.config = {
      ...this.config!,
      provider: newConfig,
    };
  }

  async getCurrentProvider(): Promise<{ provider: ErrorProviderType }> {
    this.ensureInitialized();
    return { provider: this.config!.provider.provider };
  }

  async flush(timeout?: number): Promise<{ success: boolean }> {
    this.ensureInitialized();

    let success = true;

    if (this.currentProvider) {
      success = await this.currentProvider.flush(timeout);
    }

    // Also flush offline queue
    if (this.offlineQueue) {
      await this.offlineQueue.flush();
    }

    return { success };
  }

  async isInitialized(): Promise<{ initialized: boolean }> {
    return { initialized: this.initialized };
  }

  async getMetrics(): Promise<{
    totalErrors: number;
    successfulErrors: number;
    failedErrors: number;
    queueSize: number;
  }> {
    const metrics = await StorageManager.getMetrics();
    const queue = await StorageManager.getErrorQueue();

    return {
      totalErrors: metrics.totalErrors || 0,
      successfulErrors: metrics.successfulErrors || 0,
      failedErrors: metrics.failedErrors || 0,
      queueSize: queue.length,
    };
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.ensureInitialized();

    // Update settings
    const settings = await StorageManager.getSettings();
    await StorageManager.saveSettings({ ...settings, enabled });

    // Enable/disable providers
    if (this.currentProvider) {
      // Providers don't have a standard enable/disable method
      // This would need to be implemented per provider
    }
  }

  async testError(): Promise<void> {
    await this.logError(new Error('Test error from UnifiedErrorHandling'), {
      level: ErrorLevel.ERROR,
      tags: { test: 'true' },
      context: { source: 'testError' },
    });
  }

  async testNativeCrash(): Promise<void> {
    // Web doesn't support native crashes
    console.warn('testNativeCrash is not supported on web platform');
  }

  private async initializeProvider(config: ProviderConfig): Promise<void> {
    // Get provider from registry
    const provider = this.registry.get(config.provider);
    if (!provider) {
      throw new Error(`Provider ${config.provider} not found. Did you forget to register it?`);
    }

    // Initialize provider
    await provider.initialize(config);

    // Restore user context if available
    const userContext = await StorageManager.getUserContext();
    if (userContext) {
      await provider.setUser(userContext);
    }

    this.currentProvider = provider;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        if (this.config?.autoCaptureErrors !== false) {
          this.logError(event.error || event.message, {
            level: ErrorLevel.ERROR,
            context: {
              source: 'window.onerror',
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
            },
          }).catch(console.error);
        }
      });

      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        if (this.config?.autoCaptureErrors !== false) {
          this.logError(event.reason, {
            level: ErrorLevel.ERROR,
            context: {
              source: 'unhandledrejection',
              promise: event.promise,
            },
          }).catch(console.error);
        }
      });
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('UnifiedErrorHandling is not initialized. Call initialize() first.');
    }
  }
}