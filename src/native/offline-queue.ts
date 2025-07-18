import { NormalizedError, ErrorProvider } from '@/types';
import { StorageManager, networkMonitor } from '@/utils';

/**
 * Offline queue options
 */
export interface OfflineQueueOptions {
  /**
   * Maximum queue size
   */
  maxSize?: number;

  /**
   * Retry delay in ms
   */
  retryDelay?: number;

  /**
   * Maximum retry attempts
   */
  maxRetries?: number;

  /**
   * Exponential backoff multiplier
   */
  backoffMultiplier?: number;
}

/**
 * Offline queue for error handling
 */
export class OfflineQueue {
  private options: Required<OfflineQueueOptions>;
  private isProcessing: boolean = false;
  private retryTimeout?: NodeJS.Timeout;
  private provider?: ErrorProvider;

  constructor(options: OfflineQueueOptions = {}) {
    this.options = {
      maxSize: options.maxSize || 100,
      retryDelay: options.retryDelay || 30000,
      maxRetries: options.maxRetries || 3,
      backoffMultiplier: options.backoffMultiplier || 2,
    };

    // Set storage max size
    StorageManager.setMaxQueueSize(this.options.maxSize);
  }

  /**
   * Start queue processing
   */
  start(provider: ErrorProvider): void {
    this.provider = provider;

    // Listen for network changes
    networkMonitor.on('online', () => {
      this.scheduleRetry(1000); // Try quickly when coming online
    });

    // Initial processing
    this.scheduleRetry();
  }

  /**
   * Stop queue processing
   */
  stop(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = undefined;
    }
    this.isProcessing = false;
  }

  /**
   * Enqueue an error
   */
  async enqueue(error: NormalizedError, provider: string): Promise<void> {
    await StorageManager.queueError(error, provider);
  }

  /**
   * Process the queue
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.provider) {
      return;
    }

    // Check if online
    if (!networkMonitor.isOnline()) {
      this.scheduleRetry();
      return;
    }

    this.isProcessing = true;

    try {
      const queue = await StorageManager.getErrorQueue();

      for (const item of queue) {
        if (item.retryCount >= this.options.maxRetries) {
          // Drop error if max retries exceeded
          await StorageManager.removeFromQueue(item.id);
          await StorageManager.updateMetrics((metrics) => ({
            ...metrics,
            droppedErrors: (metrics.droppedErrors || 0) + 1,
          }));
          continue;
        }

        try {
          // Check if we should process this item
          if (item.provider !== this.provider.name) {
            continue;
          }

          // Send error
          await this.provider.logError(item.error);

          // Remove from queue on success
          await StorageManager.removeFromQueue(item.id);

          // Update metrics
          await StorageManager.updateMetrics((metrics) => ({
            ...metrics,
            successfulErrors: (metrics.successfulErrors || 0) + 1,
          }));
        } catch (error) {
          // Update retry count
          await StorageManager.updateRetryCount(item.id, item.retryCount + 1);

          // If still online, it's a real error, not network issue
          if (networkMonitor.isOnline()) {
            console.error('Failed to send queued error:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }

    // Schedule next retry if queue not empty
    const remainingQueue = await StorageManager.getErrorQueue();
    if (remainingQueue.length > 0) {
      this.scheduleRetry();
    }
  }

  /**
   * Flush the queue immediately
   */
  async flush(): Promise<void> {
    await this.processQueue();
  }

  /**
   * Schedule a retry
   */
  private scheduleRetry(delay?: number): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    const retryDelay = delay || this.options.retryDelay;

    this.retryTimeout = setTimeout(() => {
      this.processQueue().catch(console.error);
    }, retryDelay);
  }

  /**
   * Get queue statistics
   */
  async getStatistics(): Promise<{
    queueSize: number;
    oldestItem?: Date;
    retryDistribution: Record<number, number>;
  }> {
    const queue = await StorageManager.getErrorQueue();

    const retryDistribution: Record<number, number> = {};
    let oldestTimestamp: number | undefined;

    for (const item of queue) {
      retryDistribution[item.retryCount] = (retryDistribution[item.retryCount] || 0) + 1;

      if (!oldestTimestamp || item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
      }
    }

    return {
      queueSize: queue.length,
      oldestItem: oldestTimestamp ? new Date(oldestTimestamp) : undefined,
      retryDistribution,
    };
  }

  /**
   * Clear the queue
   */
  async clear(provider?: string): Promise<void> {
    await StorageManager.clearQueue(provider);
  }

  /**
   * Prune old items
   */
  async pruneOldItems(maxAge: number): Promise<number> {
    return StorageManager.pruneOldItems(maxAge);
  }
}
