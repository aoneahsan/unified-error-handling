import { EventEmitter } from 'events';

/**
 * Network state information
 */
export interface NetworkState {
  /**
   * Is currently online
   */
  isOnline: boolean;

  /**
   * Connection type
   */
  connectionType?: string;

  /**
   * Effective connection type (slow-2g, 2g, 3g, 4g)
   */
  effectiveType?: string;

  /**
   * Downlink speed in Mbps
   */
  downlink?: number;

  /**
   * Round trip time in ms
   */
  rtt?: number;

  /**
   * Last state change timestamp
   */
  lastChanged: number;
}

/**
 * Network monitor for tracking connectivity changes
 */
export class NetworkMonitor extends EventEmitter {
  private state: NetworkState;
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring: boolean = false;

  constructor() {
    super();
    this.state = {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      lastChanged: Date.now(),
    };
  }

  /**
   * Start monitoring network state
   */
  start(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // Initial state update
    this.updateNetworkState();

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      // Monitor connection changes
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.addEventListener('change', this.handleConnectionChange);
      }
    }

    // Start periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.updateNetworkState();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection.removeEventListener('change', this.handleConnectionChange);
      }
    }

    // Clear interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Get current network state
   */
  getState(): NetworkState {
    return { ...this.state };
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return this.state.isOnline;
  }

  /**
   * Wait for online state
   */
  waitForOnline(timeout?: number): Promise<void> {
    if (this.state.isOnline) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;

      const handleOnline = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        this.removeListener('online', handleOnline);
        resolve();
      };

      this.once('online', handleOnline);

      if (timeout) {
        timeoutId = setTimeout(() => {
          this.removeListener('online', handleOnline);
          reject(new Error('Timeout waiting for online state'));
        }, timeout);
      }
    });
  }

  /**
   * Test network connectivity
   */
  async testConnectivity(url: string = 'https://www.google.com/favicon.ico'): Promise<boolean> {
    if (!this.state.isOnline) {
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get connection quality
   */
  getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'offline' {
    if (!this.state.isOnline) {
      return 'offline';
    }

    const effectiveType = this.state.effectiveType;
    const downlink = this.state.downlink;

    if (effectiveType === '4g' || (downlink && downlink >= 10)) {
      return 'excellent';
    } else if (effectiveType === '3g' || (downlink && downlink >= 2)) {
      return 'good';
    } else if (effectiveType === '2g' || (downlink && downlink >= 0.5)) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  /**
   * Update network state
   */
  private updateNetworkState(): void {
    const previousState = { ...this.state };

    // Update online status
    this.state.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // Update connection info
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        this.state.connectionType = connection.type;
        this.state.effectiveType = connection.effectiveType;
        this.state.downlink = connection.downlink;
        this.state.rtt = connection.rtt;
      }
    }

    // Check if state changed
    if (this.hasStateChanged(previousState, this.state)) {
      this.state.lastChanged = Date.now();
      this.emit('change', this.state);

      if (previousState.isOnline !== this.state.isOnline) {
        this.emit(this.state.isOnline ? 'online' : 'offline');
      }
    }
  }

  /**
   * Check if state has changed
   */
  private hasStateChanged(oldState: NetworkState, newState: NetworkState): boolean {
    return (
      oldState.isOnline !== newState.isOnline ||
      oldState.connectionType !== newState.connectionType ||
      oldState.effectiveType !== newState.effectiveType ||
      oldState.downlink !== newState.downlink ||
      oldState.rtt !== newState.rtt
    );
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    this.updateNetworkState();
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    this.updateNetworkState();
  };

  /**
   * Handle connection change
   */
  private handleConnectionChange = (): void => {
    this.updateNetworkState();
  };

  /**
   * Get network statistics
   */
  getStatistics(): {
    totalOfflineTime: number;
    offlineCount: number;
    lastOfflineTimestamp?: number;
    averageDownlink?: number;
    averageRtt?: number;
  } {
    // This would require storing historical data
    // For now, return current state-based stats
    return {
      totalOfflineTime: 0,
      offlineCount: 0,
      averageDownlink: this.state.downlink,
      averageRtt: this.state.rtt,
    };
  }
}

// Create singleton instance
export const networkMonitor = new NetworkMonitor();