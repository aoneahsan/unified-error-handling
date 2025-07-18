import { Preferences } from '@capacitor/preferences';
import { NormalizedError } from '@/types';

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  ERROR_QUEUE: 'unified_error_handling_queue',
  USER_CONTEXT: 'unified_error_handling_user',
  SETTINGS: 'unified_error_handling_settings',
  METRICS: 'unified_error_handling_metrics',
} as const;

/**
 * Queue item structure
 */
export interface QueueItem {
  id: string;
  error: NormalizedError;
  retryCount: number;
  timestamp: number;
  provider: string;
}

/**
 * Storage manager for offline support
 */
export class StorageManager {
  /**
   * Maximum queue size
   */
  private static maxQueueSize: number = 100;

  /**
   * Set maximum queue size
   */
  static setMaxQueueSize(size: number): void {
    this.maxQueueSize = size;
  }

  /**
   * Add error to queue
   */
  static async queueError(error: NormalizedError, provider: string): Promise<void> {
    const queue = await this.getErrorQueue();
    
    const item: QueueItem = {
      id: this.generateId(),
      error,
      retryCount: 0,
      timestamp: Date.now(),
      provider,
    };

    queue.push(item);

    // Limit queue size
    if (queue.length > this.maxQueueSize) {
      queue.splice(0, queue.length - this.maxQueueSize);
    }

    await this.saveErrorQueue(queue);
  }

  /**
   * Get all queued errors
   */
  static async getErrorQueue(): Promise<QueueItem[]> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEYS.ERROR_QUEUE });
      if (value) {
        return JSON.parse(value);
      }
    } catch (error) {
      console.error('Failed to get error queue:', error);
    }
    return [];
  }

  /**
   * Get queued errors for a specific provider
   */
  static async getProviderQueue(provider: string): Promise<QueueItem[]> {
    const queue = await this.getErrorQueue();
    return queue.filter((item) => item.provider === provider);
  }

  /**
   * Remove error from queue
   */
  static async removeFromQueue(id: string): Promise<void> {
    const queue = await this.getErrorQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await this.saveErrorQueue(filtered);
  }

  /**
   * Update retry count
   */
  static async updateRetryCount(id: string, retryCount: number): Promise<void> {
    const queue = await this.getErrorQueue();
    const item = queue.find((i) => i.id === id);
    if (item) {
      item.retryCount = retryCount;
      await this.saveErrorQueue(queue);
    }
  }

  /**
   * Clear error queue
   */
  static async clearQueue(provider?: string): Promise<void> {
    if (provider) {
      const queue = await this.getErrorQueue();
      const filtered = queue.filter((item) => item.provider !== provider);
      await this.saveErrorQueue(filtered);
    } else {
      await Preferences.remove({ key: STORAGE_KEYS.ERROR_QUEUE });
    }
  }

  /**
   * Save user context
   */
  static async saveUserContext(context: any): Promise<void> {
    await Preferences.set({
      key: STORAGE_KEYS.USER_CONTEXT,
      value: JSON.stringify(context),
    });
  }

  /**
   * Get user context
   */
  static async getUserContext(): Promise<any | null> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEYS.USER_CONTEXT });
      if (value) {
        return JSON.parse(value);
      }
    } catch (error) {
      console.error('Failed to get user context:', error);
    }
    return null;
  }

  /**
   * Clear user context
   */
  static async clearUserContext(): Promise<void> {
    await Preferences.remove({ key: STORAGE_KEYS.USER_CONTEXT });
  }

  /**
   * Save settings
   */
  static async saveSettings(settings: Record<string, any>): Promise<void> {
    await Preferences.set({
      key: STORAGE_KEYS.SETTINGS,
      value: JSON.stringify(settings),
    });
  }

  /**
   * Get settings
   */
  static async getSettings(): Promise<Record<string, any>> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEYS.SETTINGS });
      if (value) {
        return JSON.parse(value);
      }
    } catch (error) {
      console.error('Failed to get settings:', error);
    }
    return {};
  }

  /**
   * Update metrics
   */
  static async updateMetrics(update: (metrics: any) => any): Promise<void> {
    const metrics = await this.getMetrics();
    const updated = update(metrics);
    await Preferences.set({
      key: STORAGE_KEYS.METRICS,
      value: JSON.stringify(updated),
    });
  }

  /**
   * Get metrics
   */
  static async getMetrics(): Promise<any> {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEYS.METRICS });
      if (value) {
        return JSON.parse(value);
      }
    } catch (error) {
      console.error('Failed to get metrics:', error);
    }
    return {
      totalErrors: 0,
      successfulErrors: 0,
      failedErrors: 0,
      droppedErrors: 0,
    };
  }

  /**
   * Clear all storage
   */
  static async clearAll(): Promise<void> {
    await Promise.all([
      Preferences.remove({ key: STORAGE_KEYS.ERROR_QUEUE }),
      Preferences.remove({ key: STORAGE_KEYS.USER_CONTEXT }),
      Preferences.remove({ key: STORAGE_KEYS.SETTINGS }),
      Preferences.remove({ key: STORAGE_KEYS.METRICS }),
    ]);
  }

  /**
   * Get storage size
   */
  static async getStorageSize(): Promise<{
    queueSize: number;
    totalItems: number;
    oldestItem?: number;
  }> {
    const queue = await this.getErrorQueue();
    const queueString = JSON.stringify(queue);
    const queueSize = new Blob([queueString]).size;

    let oldestItem: number | undefined;
    if (queue.length > 0) {
      oldestItem = Math.min(...queue.map((item) => item.timestamp));
    }

    return {
      queueSize,
      totalItems: queue.length,
      oldestItem,
    };
  }

  /**
   * Prune old items
   */
  static async pruneOldItems(maxAge: number): Promise<number> {
    const queue = await this.getErrorQueue();
    const cutoff = Date.now() - maxAge;
    const filtered = queue.filter((item) => item.timestamp > cutoff);
    const pruned = queue.length - filtered.length;

    if (pruned > 0) {
      await this.saveErrorQueue(filtered);
    }

    return pruned;
  }

  /**
   * Save error queue
   */
  private static async saveErrorQueue(queue: QueueItem[]): Promise<void> {
    await Preferences.set({
      key: STORAGE_KEYS.ERROR_QUEUE,
      value: JSON.stringify(queue),
    });
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export data for debugging
   */
  static async exportData(): Promise<{
    queue: QueueItem[];
    userContext: any;
    settings: Record<string, any>;
    metrics: any;
  }> {
    const [queue, userContext, settings, metrics] = await Promise.all([
      this.getErrorQueue(),
      this.getUserContext(),
      this.getSettings(),
      this.getMetrics(),
    ]);

    return {
      queue,
      userContext,
      settings,
      metrics,
    };
  }

  /**
   * Import data (for testing/migration)
   */
  static async importData(data: {
    queue?: QueueItem[];
    userContext?: any;
    settings?: Record<string, any>;
    metrics?: any;
  }): Promise<void> {
    const promises: Promise<void>[] = [];

    if (data.queue) {
      promises.push(this.saveErrorQueue(data.queue));
    }

    if (data.userContext) {
      promises.push(this.saveUserContext(data.userContext));
    }

    if (data.settings) {
      promises.push(this.saveSettings(data.settings));
    }

    if (data.metrics) {
      promises.push(
        Preferences.set({
          key: STORAGE_KEYS.METRICS,
          value: JSON.stringify(data.metrics),
        })
      );
    }

    await Promise.all(promises);
  }
}