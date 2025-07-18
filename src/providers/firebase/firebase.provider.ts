import { BaseProvider } from '../base.provider';
import {
  NormalizedError,
  UserContext,
  Breadcrumb,
  ProviderCapabilities,
  ProviderFeature,
  ProviderConfig,
  ErrorProviderType,
  FirebaseConfig,
} from '@/types';
import { FirebaseCrashlyticsOptions, FirebaseCustomAttribute } from './firebase.types';

/**
 * Firebase Crashlytics provider implementation
 */
export class FirebaseCrashlyticsProvider extends BaseProvider {
  readonly name = 'firebase';
  readonly version = '1.0.0';

  private crashlytics: any;
  private isWeb: boolean = false;
  private customAttributes: Map<string, FirebaseCustomAttribute> = new Map();
  private logs: string[] = [];
  private maxLogs: number = 64;

  protected async initializeProvider(config: ProviderConfig): Promise<void> {
    const firebaseConfig = config as FirebaseCrashlyticsOptions;

    try {
      // Check if we're on web or native
      const { Capacitor } = await import('@capacitor/core');
      this.isWeb = Capacitor.getPlatform() === 'web';

      if (this.isWeb) {
        // Web implementation - Firebase Crashlytics doesn't support web
        console.warn(
          'Firebase Crashlytics does not support web platform. Errors will be logged to console instead.'
        );
      } else {
        // Native implementation using @capacitor-firebase/crashlytics
        try {
          const { FirebaseCrashlytics } = await import('@capacitor-firebase/crashlytics');
          this.crashlytics = FirebaseCrashlytics;

          // Enable crash collection
          if (firebaseConfig.crashlyticsEnabled !== false) {
            await this.crashlytics.setCrashlyticsCollectionEnabled({ enabled: true });
          }

          // Set automatic data collection
          if (firebaseConfig.automaticDataCollectionEnabled !== undefined) {
            await this.crashlytics.setCrashlyticsCollectionEnabled({
              enabled: firebaseConfig.automaticDataCollectionEnabled,
            });
          }

          // Set custom log limit
          if (firebaseConfig.logLimit) {
            this.maxLogs = firebaseConfig.logLimit;
          }
        } catch (error) {
          console.error('Failed to initialize Firebase Crashlytics:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Failed to initialize Firebase provider:', error);
      throw error;
    }
  }

  protected async sendError(error: NormalizedError): Promise<void> {
    if (this.isWeb) {
      // Web fallback - log to console
      console.error('[Firebase Crashlytics]', error.message, error);
      return;
    }

    try {
      // Record the error
      if (error.originalError instanceof Error) {
        // For actual Error objects, use recordException
        await this.crashlytics.recordException({
          message: error.message,
          stacktrace: error.stack || '',
        });
      } else {
        // For other errors, log as fatal or non-fatal based on level
        await this.crashlytics.log({ message: `${error.level}: ${error.message}` });

        if (error.level === 'fatal') {
          // Force a crash for fatal errors
          await this.crashlytics.crash();
        }
      }

      // Add context as custom keys
      if (error.context) {
        for (const [key, value] of Object.entries(error.context)) {
          await this.setCustomKey(key, value);
        }
      }

      // Add tags as custom keys
      if (error.tags) {
        for (const [key, value] of Object.entries(error.tags)) {
          await this.setCustomKey(key, value);
        }
      }

      // Send pending reports
      await this.crashlytics.sendUnsentReports();
    } catch (err) {
      console.error('Failed to send error to Firebase Crashlytics:', err);
      throw err;
    }
  }

  protected async updateUserContext(user: UserContext | null): Promise<void> {
    if (this.isWeb) return;

    try {
      if (user) {
        // Set user identifier
        if (user.id) {
          await this.crashlytics.setUserId({ userId: user.id });
        }

        // Set user attributes as custom keys
        if (user.email) {
          await this.setCustomKey('user_email', user.email);
        }
        if (user.username) {
          await this.setCustomKey('user_username', user.username);
        }

        // Set additional attributes
        for (const [key, value] of Object.entries(user)) {
          if (key !== 'id' && key !== 'email' && key !== 'username' && value !== undefined) {
            await this.setCustomKey(`user_${key}`, value);
          }
        }
      } else {
        // Clear user
        await this.crashlytics.setUserId({ userId: '' });
        
        // Clear user-related custom keys
        for (const [key] of this.customAttributes) {
          if (key.startsWith('user_')) {
            this.customAttributes.delete(key);
          }
        }
      }
    } catch (error) {
      console.error('Failed to update user context:', error);
    }
  }

  protected async updateCustomContext(key: string, context: any): Promise<void> {
    if (this.isWeb) return;

    try {
      await this.setCustomKey(`context_${key}`, context);
    } catch (error) {
      console.error('Failed to update custom context:', error);
    }
  }

  protected async updateBreadcrumb(breadcrumb: Breadcrumb): Promise<void> {
    if (this.isWeb) return;

    try {
      // Firebase Crashlytics doesn't have native breadcrumb support
      // Log breadcrumbs as custom logs
      const breadcrumbLog = `[${breadcrumb.category || 'default'}] ${breadcrumb.message}`;
      
      await this.crashlytics.log({ message: breadcrumbLog });
      
      // Keep local copy for web fallback
      this.logs.push(breadcrumbLog);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
    } catch (error) {
      console.error('Failed to add breadcrumb:', error);
    }
  }

  protected async updateTags(tags: Record<string, string>): Promise<void> {
    if (this.isWeb) return;

    try {
      for (const [key, value] of Object.entries(tags)) {
        await this.setCustomKey(`tag_${key}`, value);
      }
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  }

  protected async updateExtraData(key: string, value: any): Promise<void> {
    if (this.isWeb) return;

    try {
      await this.setCustomKey(`extra_${key}`, value);
    } catch (error) {
      console.error('Failed to update extra data:', error);
    }
  }

  protected async clearProviderBreadcrumbs(): Promise<void> {
    // Firebase doesn't support clearing logs
    this.logs = [];
  }

  protected async destroyProvider(): Promise<void> {
    this.customAttributes.clear();
    this.logs = [];
    this.crashlytics = null;
  }

  async flush(timeout?: number): Promise<boolean> {
    if (this.isWeb) return true;

    try {
      // Send any unsent reports
      await this.crashlytics.sendUnsentReports();
      return true;
    } catch (error) {
      console.error('Failed to flush Firebase Crashlytics:', error);
      return false;
    }
  }

  supportsFeature(feature: ProviderFeature): boolean {
    const supportedFeatures = [
      ProviderFeature.USER_CONTEXT,
      ProviderFeature.CUSTOM_CONTEXT,
      ProviderFeature.TAGS,
      ProviderFeature.EXTRA_DATA,
      ProviderFeature.ERROR_FILTERING,
      ProviderFeature.RELEASE_TRACKING,
    ];

    return supportedFeatures.includes(feature);
  }

  getCapabilities(): ProviderCapabilities {
    return {
      features: [
        ProviderFeature.USER_CONTEXT,
        ProviderFeature.CUSTOM_CONTEXT,
        ProviderFeature.TAGS,
        ProviderFeature.EXTRA_DATA,
        ProviderFeature.ERROR_FILTERING,
        ProviderFeature.RELEASE_TRACKING,
      ],
      maxBreadcrumbs: this.maxLogs,
      maxContextSize: 64, // Firebase limit for custom keys
      maxTags: 64,
      supportsOffline: true,
      supportsBatching: false,
      platforms: {
        ios: true,
        android: true,
        web: false,
      },
    };
  }

  /**
   * Set a custom key in Firebase Crashlytics
   */
  private async setCustomKey(key: string, value: any): Promise<void> {
    if (!this.crashlytics) return;

    // Firebase has a limit of 64 custom keys
    if (this.customAttributes.size >= 64) {
      console.warn('Firebase Crashlytics custom key limit reached (64)');
      return;
    }

    try {
      // Convert value to appropriate type
      let finalValue: string | boolean | number;
      let type: 'string' | 'boolean' | 'int' | 'float';

      if (typeof value === 'boolean') {
        finalValue = value;
        type = 'boolean';
      } else if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          finalValue = value;
          type = 'int';
        } else {
          finalValue = value;
          type = 'float';
        }
      } else {
        finalValue = String(value);
        type = 'string';
      }

      // Set the custom key
      switch (type) {
        case 'boolean':
          await this.crashlytics.setCustomKey({
            key,
            value: finalValue as boolean,
            type: 'boolean',
          });
          break;
        case 'int':
          await this.crashlytics.setCustomKey({
            key,
            value: finalValue as number,
            type: 'int',
          });
          break;
        case 'float':
          await this.crashlytics.setCustomKey({
            key,
            value: finalValue as number,
            type: 'float',
          });
          break;
        default:
          await this.crashlytics.setCustomKey({
            key,
            value: finalValue as string,
            type: 'string',
          });
      }

      // Track custom attribute
      this.customAttributes.set(key, {
        key,
        value: finalValue,
        type: type as any,
      });
    } catch (error) {
      console.error('Failed to set custom key:', error);
    }
  }

  /**
   * Check if crash reports are being collected
   */
  async isCrashlyticsCollectionEnabled(): Promise<boolean> {
    if (this.isWeb || !this.crashlytics) return false;

    try {
      const result = await this.crashlytics.isCrashlyticsCollectionEnabled();
      return result.enabled;
    } catch (error) {
      console.error('Failed to check collection status:', error);
      return false;
    }
  }

  /**
   * Delete all unsent reports
   */
  async deleteUnsentReports(): Promise<void> {
    if (this.isWeb || !this.crashlytics) return;

    try {
      await this.crashlytics.deleteUnsentReports();
    } catch (error) {
      console.error('Failed to delete unsent reports:', error);
    }
  }

  /**
   * Check if the app crashed on the previous run
   */
  async didCrashOnPreviousExecution(): Promise<boolean> {
    if (this.isWeb || !this.crashlytics) return false;

    try {
      const result = await this.crashlytics.didCrashOnPreviousExecution();
      return result.crashed;
    } catch (error) {
      console.error('Failed to check crash status:', error);
      return false;
    }
  }
}