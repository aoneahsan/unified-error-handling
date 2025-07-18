import { DeviceContext, AppContext, NetworkContext } from '@/types';
import { Capacitor } from '@capacitor/core';

/**
 * Context manager for collecting device, app, and network information
 */
export class ContextManager {
  private static deviceContext: DeviceContext | null = null;
  private static appContext: AppContext | null = null;
  private static networkContext: NetworkContext | null = null;
  private static updateCallbacks: Set<() => void> = new Set();

  /**
   * Initialize context collection
   */
  static async initialize(): Promise<void> {
    await this.updateDeviceContext();
    await this.updateAppContext();
    await this.updateNetworkContext();

    // Set up network monitoring if available
    if (typeof window !== 'undefined' && 'addEventListener' in window) {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }

    // Set up orientation change monitoring
    if (typeof window !== 'undefined' && 'addEventListener' in window) {
      window.addEventListener('orientationchange', () => this.updateDeviceContext());
    }
  }

  /**
   * Get current device context
   */
  static async getDeviceContext(): Promise<DeviceContext> {
    if (!this.deviceContext) {
      await this.updateDeviceContext();
    }
    return { ...this.deviceContext! };
  }

  /**
   * Get current app context
   */
  static async getAppContext(): Promise<AppContext> {
    if (!this.appContext) {
      await this.updateAppContext();
    }
    return { ...this.appContext! };
  }

  /**
   * Get current network context
   */
  static async getNetworkContext(): Promise<NetworkContext> {
    if (!this.networkContext) {
      await this.updateNetworkContext();
    }
    return { ...this.networkContext! };
  }

  /**
   * Get all contexts combined
   */
  static async getAllContexts(): Promise<{
    device: DeviceContext;
    app: AppContext;
    network: NetworkContext;
  }> {
    const [device, app, network] = await Promise.all([
      this.getDeviceContext(),
      this.getAppContext(),
      this.getNetworkContext(),
    ]);

    return { device, app, network };
  }

  /**
   * Update device context
   */
  private static async updateDeviceContext(): Promise<void> {
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();

    this.deviceContext = {
      platform,
      orientation: this.getOrientation(),
    };

    // Add web-specific information
    if (platform === 'web' && typeof window !== 'undefined') {
      const navigator = window.navigator as any;

      // Get OS information from user agent
      const userAgent = navigator.userAgent;
      let osVersion = 'Unknown';

      if (userAgent.includes('Windows')) {
        osVersion = 'Windows';
      } else if (userAgent.includes('Mac')) {
        osVersion = 'macOS';
      } else if (userAgent.includes('Linux')) {
        osVersion = 'Linux';
      } else if (userAgent.includes('Android')) {
        osVersion = 'Android';
      } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        osVersion = 'iOS';
      }

      this.deviceContext.osVersion = osVersion;

      // Get memory information if available
      if (navigator.deviceMemory) {
        this.deviceContext.memoryTotal = navigator.deviceMemory * 1024 * 1024 * 1024; // Convert GB to bytes
      }

      // Get battery information if available
      if (navigator.getBattery) {
        try {
          const battery = await navigator.getBattery();
          this.deviceContext.batteryLevel = Math.round(battery.level * 100);
          this.deviceContext.isCharging = battery.charging;
        } catch {
          // Battery API not supported or failed
        }
      }
    }

    // For native platforms, we would need to use platform-specific plugins
    // This would be implemented in the iOS and Android native code
  }

  /**
   * Update app context
   */
  private static async updateAppContext(): Promise<void> {
    this.appContext = {
      environment: process.env.NODE_ENV || 'production',
    };

    // Try to get version from package.json if available
    if (typeof process !== 'undefined' && process.env.npm_package_version) {
      this.appContext.version = process.env.npm_package_version;
    }

    // Try to get app info from Capacitor config
    try {
      const config = (window as any).Capacitor?.config;
      if (config) {
        this.appContext.bundleId = config.appId;
        this.appContext.version = config.version;
      }
    } catch {
      // Capacitor config not available
    }
  }

  /**
   * Update network context
   */
  private static async updateNetworkContext(): Promise<void> {
    this.networkContext = {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    };

    // Get connection information if available
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        this.networkContext.connectionType = connection.effectiveType || connection.type;

        // Map connection types
        if (connection.type) {
          switch (connection.type) {
            case 'wifi':
              this.networkContext.connectionType = 'wifi';
              break;
            case 'cellular':
              this.networkContext.connectionType = 'cellular';
              break;
            case 'none':
              this.networkContext.connectionType = 'none';
              break;
            default:
              this.networkContext.connectionType = connection.type;
          }
        }
      }
    }
  }

  /**
   * Get device orientation
   */
  private static getOrientation(): 'portrait' | 'landscape' | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }

    // Check screen orientation API
    if (window.screen && 'orientation' in window.screen) {
      const orientation = (window.screen as any).orientation;
      if (orientation) {
        return orientation.type.includes('portrait') ? 'portrait' : 'landscape';
      }
    }

    // Fallback to window dimensions
    if (window.innerWidth && window.innerHeight) {
      return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }

    return undefined;
  }

  /**
   * Handle network change
   */
  private static handleNetworkChange(isOnline: boolean): void {
    this.networkContext = {
      ...this.networkContext,
      isOnline,
    };

    // Update connection type
    this.updateNetworkContext();

    // Notify callbacks
    this.notifyCallbacks();
  }

  /**
   * Subscribe to context updates
   */
  static subscribe(callback: () => void): () => void {
    this.updateCallbacks.add(callback);
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Notify all callbacks
   */
  private static notifyCallbacks(): void {
    this.updateCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('Error in context update callback:', error);
      }
    });
  }

  /**
   * Get memory usage (web only)
   */
  static getMemoryUsage(): { used: number; total: number } | null {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return null;
    }

    const performance = window.performance as any;
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
      };
    }

    return null;
  }

  /**
   * Get performance metrics
   */
  static getPerformanceMetrics(): Record<string, number> | null {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return null;
    }

    const metrics: Record<string, number> = {};
    const performance = window.performance;

    // Get navigation timing
    if (performance.timing) {
      const timing = performance.timing;
      metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      metrics.domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
      metrics.firstPaintTime = timing.responseEnd - timing.navigationStart;
    }

    // Get paint timing
    if (performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-paint') {
          metrics.firstPaint = Math.round(entry.startTime);
        } else if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = Math.round(entry.startTime);
        }
      });
    }

    return Object.keys(metrics).length > 0 ? metrics : null;
  }

  /**
   * Reset all contexts
   */
  static reset(): void {
    this.deviceContext = null;
    this.appContext = null;
    this.networkContext = null;
  }
}