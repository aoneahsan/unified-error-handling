import { describe, it, expect } from 'vitest';
import {
  BASE_DEFAULTS,
  PROVIDER_DEFAULTS,
  ENVIRONMENT_PRESETS,
  DEFAULT_UNIFIED_CONFIG,
  getProviderDefaults,
  getEnvironmentPreset,
  getDefaultConfig,
} from './defaults';
import { ErrorProviderType, ErrorLevel } from '../types';

describe('Configuration Defaults', () => {
  describe('BASE_DEFAULTS', () => {
    it('should have correct base defaults', () => {
      expect(BASE_DEFAULTS).toEqual({
        debug: false,
        environment: 'production',
        enableOffline: true,
        maxOfflineQueueSize: 100,
        offlineRetryDelay: 30000,
        offlineRetryMaxAttempts: 3,
        networkTracking: true,
        consoleTracking: true,
        autoSessionTracking: true,
        maxBreadcrumbs: 100,
        sampleRate: 1.0,
        ignoreErrors: [],
        enablePerformanceMonitoring: false,
        performanceSampleRate: 0.1,
        sanitizeData: true,
        scrubFields: ['password', 'token', 'apiKey', 'secret', 'auth'],
        retryDelay: 1000,
        retryMaxAttempts: 3,
        retryBackoffMultiplier: 2,
      });
    });

    it('should have valid sample rate', () => {
      expect(BASE_DEFAULTS.sampleRate).toBeGreaterThanOrEqual(0);
      expect(BASE_DEFAULTS.sampleRate).toBeLessThanOrEqual(1);
    });

    it('should have valid performance sample rate', () => {
      expect(BASE_DEFAULTS.performanceSampleRate).toBeGreaterThanOrEqual(0);
      expect(BASE_DEFAULTS.performanceSampleRate).toBeLessThanOrEqual(1);
    });

    it('should have reasonable defaults for retry configuration', () => {
      expect(BASE_DEFAULTS.retryDelay).toBeGreaterThan(0);
      expect(BASE_DEFAULTS.retryMaxAttempts).toBeGreaterThan(0);
      expect(BASE_DEFAULTS.retryBackoffMultiplier).toBeGreaterThan(1);
    });
  });

  describe('PROVIDER_DEFAULTS', () => {
    it('should have defaults for all providers', () => {
      const expectedProviders = [
        ErrorProviderType.FIREBASE,
        ErrorProviderType.SENTRY,
        ErrorProviderType.DATADOG,
        ErrorProviderType.BUGSNAG,
        ErrorProviderType.ROLLBAR,
        ErrorProviderType.LOGROCKET,
        ErrorProviderType.RAYGUN,
        ErrorProviderType.APPCENTER,
      ];

      expectedProviders.forEach(provider => {
        expect(PROVIDER_DEFAULTS[provider]).toBeDefined();
      });
    });

    it('should have valid Firebase defaults', () => {
      const firebaseDefaults = PROVIDER_DEFAULTS[ErrorProviderType.FIREBASE];
      
      expect(firebaseDefaults).toEqual(
        expect.objectContaining({
          crashlyticsEnabled: true,
          customKeysLimit: 64,
          logLimit: 64,
          logLevel: ErrorLevel.ERROR,
          collectUserIds: true,
          collectDeviceInfo: true,
          collectAppInfo: true,
        })
      );
    });

    it('should have valid Sentry defaults', () => {
      const sentryDefaults = PROVIDER_DEFAULTS[ErrorProviderType.SENTRY];
      
      expect(sentryDefaults).toEqual(
        expect.objectContaining({
          maxBreadcrumbs: 100,
          sampleRate: 1.0,
          tracesSampleRate: 0.1,
          profilesSampleRate: 0.1,
          attachStacktrace: true,
          autoSessionTracking: true,
        })
      );
    });

    it('should have valid DataDog defaults', () => {
      const datadogDefaults = PROVIDER_DEFAULTS[ErrorProviderType.DATADOG];
      
      expect(datadogDefaults).toEqual(
        expect.objectContaining({
          sessionSampleRate: 100,
          trackInteractions: true,
          trackResources: true,
          trackLongTasks: true,
          enablePerformanceMonitoring: true,
        })
      );
    });

    it('should have valid Bugsnag defaults', () => {
      const bugsnagDefaults = PROVIDER_DEFAULTS[ErrorProviderType.BUGSNAG];
      
      expect(bugsnagDefaults).toEqual(
        expect.objectContaining({
          autoDetectErrors: true,
          autoTrackSessions: true,
          maxBreadcrumbs: 25,
          maxEvents: 100,
          enableAppHangDetection: true,
        })
      );
    });

    it('should have valid Rollbar defaults', () => {
      const rollbarDefaults = PROVIDER_DEFAULTS[ErrorProviderType.ROLLBAR];
      
      expect(rollbarDefaults).toEqual(
        expect.objectContaining({
          captureUncaught: true,
          captureUnhandledRejections: true,
          autoInstrument: true,
          maxItems: 5,
          itemsPerMinute: 60,
        })
      );
    });

    it('should have valid LogRocket defaults', () => {
      const logrocketDefaults = PROVIDER_DEFAULTS[ErrorProviderType.LOGROCKET];
      
      expect(logrocketDefaults).toEqual(
        expect.objectContaining({
          console: true,
          network: true,
          dom: true,
          shouldCaptureIP: false,
          capturePerformance: true,
          captureExceptions: true,
        })
      );
    });

    it('should have valid Raygun defaults', () => {
      const raygunDefaults = PROVIDER_DEFAULTS[ErrorProviderType.RAYGUN];
      
      expect(raygunDefaults).toEqual(
        expect.objectContaining({
          enableOfflineStorage: true,
          enableCrashReporting: true,
          enablePulse: false,
          enableUserTracking: false,
          enableCustomData: true,
        })
      );
    });

    it('should have valid AppCenter defaults', () => {
      const appcenterDefaults = PROVIDER_DEFAULTS[ErrorProviderType.APPCENTER];
      
      expect(appcenterDefaults).toEqual(
        expect.objectContaining({
          useInProduction: true,
          services: ['crashes', 'analytics'],
          logLevel: 2,
          collectUserIds: true,
          collectDeviceInfo: true,
        })
      );
    });
  });

  describe('ENVIRONMENT_PRESETS', () => {
    it('should have presets for all environments', () => {
      expect(ENVIRONMENT_PRESETS.development).toBeDefined();
      expect(ENVIRONMENT_PRESETS.staging).toBeDefined();
      expect(ENVIRONMENT_PRESETS.production).toBeDefined();
    });

    it('should have correct development preset', () => {
      expect(ENVIRONMENT_PRESETS.development).toEqual({
        debug: true,
        environment: 'development',
        sampleRate: 1.0,
        enablePerformanceMonitoring: false,
        consoleTracking: true,
        networkTracking: true,
        sanitizeData: false,
      });
    });

    it('should have correct staging preset', () => {
      expect(ENVIRONMENT_PRESETS.staging).toEqual({
        debug: false,
        environment: 'staging',
        sampleRate: 1.0,
        enablePerformanceMonitoring: true,
        consoleTracking: true,
        networkTracking: true,
        sanitizeData: true,
      });
    });

    it('should have correct production preset', () => {
      expect(ENVIRONMENT_PRESETS.production).toEqual({
        debug: false,
        environment: 'production',
        sampleRate: 0.1,
        enablePerformanceMonitoring: true,
        consoleTracking: false,
        networkTracking: true,
        sanitizeData: true,
      });
    });

    it('should have different sample rates for different environments', () => {
      expect(ENVIRONMENT_PRESETS.development.sampleRate).toBe(1.0);
      expect(ENVIRONMENT_PRESETS.staging.sampleRate).toBe(1.0);
      expect(ENVIRONMENT_PRESETS.production.sampleRate).toBe(0.1);
    });

    it('should have different debug settings for different environments', () => {
      expect(ENVIRONMENT_PRESETS.development.debug).toBe(true);
      expect(ENVIRONMENT_PRESETS.staging.debug).toBe(false);
      expect(ENVIRONMENT_PRESETS.production.debug).toBe(false);
    });
  });

  describe('DEFAULT_UNIFIED_CONFIG', () => {
    it('should have Firebase as default provider', () => {
      expect(DEFAULT_UNIFIED_CONFIG.provider?.provider).toBe(ErrorProviderType.FIREBASE);
    });

    it('should include base defaults', () => {
      expect(DEFAULT_UNIFIED_CONFIG).toEqual(
        expect.objectContaining(BASE_DEFAULTS)
      );
    });

    it('should include Firebase provider defaults', () => {
      expect(DEFAULT_UNIFIED_CONFIG.provider).toEqual(
        expect.objectContaining(PROVIDER_DEFAULTS[ErrorProviderType.FIREBASE])
      );
    });
  });

  describe('getProviderDefaults', () => {
    it('should return correct defaults for each provider', () => {
      Object.values(ErrorProviderType).forEach(provider => {
        const defaults = getProviderDefaults(provider);
        expect(defaults).toBeDefined();
        expect(defaults).toEqual(PROVIDER_DEFAULTS[provider]);
      });
    });

    it('should return empty object for unknown provider', () => {
      const defaults = getProviderDefaults('unknown' as ErrorProviderType);
      expect(defaults).toEqual({});
    });
  });

  describe('getEnvironmentPreset', () => {
    it('should return correct preset for each environment', () => {
      expect(getEnvironmentPreset('development')).toEqual(ENVIRONMENT_PRESETS.development);
      expect(getEnvironmentPreset('staging')).toEqual(ENVIRONMENT_PRESETS.staging);
      expect(getEnvironmentPreset('production')).toEqual(ENVIRONMENT_PRESETS.production);
    });

    it('should return production preset for unknown environment', () => {
      const preset = getEnvironmentPreset('unknown' as keyof typeof ENVIRONMENT_PRESETS);
      expect(preset).toEqual(ENVIRONMENT_PRESETS.production);
    });
  });

  describe('getDefaultConfig', () => {
    it('should return config with base defaults', () => {
      const config = getDefaultConfig(ErrorProviderType.FIREBASE);
      
      expect(config).toEqual(
        expect.objectContaining(BASE_DEFAULTS)
      );
    });

    it('should return config with provider defaults', () => {
      const config = getDefaultConfig(ErrorProviderType.SENTRY);
      
      expect(config.provider).toEqual(
        expect.objectContaining({
          provider: ErrorProviderType.SENTRY,
          ...PROVIDER_DEFAULTS[ErrorProviderType.SENTRY],
        })
      );
    });

    it('should return config with environment preset when specified', () => {
      const config = getDefaultConfig(ErrorProviderType.FIREBASE, 'development');
      
      expect(config).toEqual(
        expect.objectContaining(ENVIRONMENT_PRESETS.development)
      );
    });

    it('should merge all configurations correctly', () => {
      const config = getDefaultConfig(ErrorProviderType.DATADOG, 'staging');
      
      expect(config).toEqual(
        expect.objectContaining({
          ...BASE_DEFAULTS,
          ...ENVIRONMENT_PRESETS.staging,
          provider: expect.objectContaining({
            provider: ErrorProviderType.DATADOG,
            ...PROVIDER_DEFAULTS[ErrorProviderType.DATADOG],
          }),
        })
      );
    });
  });

  describe('configuration consistency', () => {
    it('should have consistent sample rates across providers', () => {
      const checkSampleRate = (config: any) => {
        if (config.sampleRate !== undefined) {
          expect(config.sampleRate).toBeGreaterThanOrEqual(0);
          expect(config.sampleRate).toBeLessThanOrEqual(1);
        }
      };

      Object.values(PROVIDER_DEFAULTS).forEach(checkSampleRate);
    });

    it('should have consistent breadcrumb limits', () => {
      const checkBreadcrumbs = (config: any) => {
        if (config.maxBreadcrumbs !== undefined) {
          expect(config.maxBreadcrumbs).toBeGreaterThan(0);
          expect(config.maxBreadcrumbs).toBeLessThanOrEqual(1000);
        }
      };

      Object.values(PROVIDER_DEFAULTS).forEach(checkBreadcrumbs);
    });

    it('should have consistent timeout values', () => {
      const checkTimeouts = (config: any) => {
        if (config.flushTimeout !== undefined) {
          expect(config.flushTimeout).toBeGreaterThan(0);
        }
        if (config.uploadTimeoutMs !== undefined) {
          expect(config.uploadTimeoutMs).toBeGreaterThan(0);
        }
      };

      Object.values(PROVIDER_DEFAULTS).forEach(checkTimeouts);
    });
  });
});