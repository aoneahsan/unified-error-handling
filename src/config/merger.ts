/**
 * Configuration merging utilities
 *
 * This module provides utilities for merging user configurations with defaults,
 * ensuring that user-provided values always take precedence.
 */

import { DEFAULT_UNIFIED_CONFIG, getProviderDefaults, getEnvironmentPreset } from './defaults';
import type { UnifiedErrorConfig, ErrorProviderType } from '../types';

/**
 * Deep merge two objects, with source taking precedence over target
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      // If source value is undefined, keep target value
      if (sourceValue === undefined) {
        continue;
      }

      // If source value is null, use null (explicit override)
      if (sourceValue === null) {
        result[key] = null as any;
        continue;
      }

      // If both are objects (but not arrays), recursively merge
      if (
        typeof sourceValue === 'object' &&
        typeof targetValue === 'object' &&
        !Array.isArray(sourceValue) &&
        !Array.isArray(targetValue) &&
        sourceValue !== null &&
        targetValue !== null
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        // For all other cases, source takes precedence
        result[key] = sourceValue as any;
      }
    }
  }

  return result;
}

/**
 * Merge user configuration with defaults
 */
export function mergeWithDefaults(
  userConfig: Partial<UnifiedErrorConfig>,
  environment?: 'development' | 'staging' | 'production',
): UnifiedErrorConfig {
  // Start with base defaults
  let defaultConfig = { ...DEFAULT_UNIFIED_CONFIG };

  // Apply environment preset if specified
  if (environment) {
    const envPreset = getEnvironmentPreset(environment);
    defaultConfig = deepMerge(defaultConfig, envPreset);
  }

  // If user specifies a provider, get provider-specific defaults
  if (userConfig.provider?.provider) {
    const providerDefaults = getProviderDefaults(userConfig.provider.provider);
    defaultConfig = deepMerge(defaultConfig, {
      provider: {
        provider: userConfig.provider.provider,
        ...providerDefaults,
      },
    });
  }

  // Merge with user configuration (user values take precedence)
  const mergedConfig = deepMerge(defaultConfig, userConfig);

  return mergedConfig as UnifiedErrorConfig;
}

/**
 * Merge provider-specific configuration
 */
export function mergeProviderConfig<T extends Record<string, any>>(
  providerType: ErrorProviderType,
  userConfig: Partial<T>,
): T {
  const defaults = getProviderDefaults(providerType);
  return deepMerge(defaults, userConfig);
}

/**
 * Check if a configuration value is user-provided (not default)
 */
export function isUserProvided<T>(userConfig: Partial<T>, defaultConfig: T, key: keyof T): boolean {
  return Object.prototype.hasOwnProperty.call(userConfig, key) && userConfig[key] !== defaultConfig[key];
}

/**
 * Get configuration diff between user config and defaults
 */
export function getConfigDiff<T extends Record<string, any>>(userConfig: Partial<T>, defaultConfig: T): Partial<T> {
  const diff: Partial<T> = {};

  for (const key in userConfig) {
    if (Object.prototype.hasOwnProperty.call(userConfig, key)) {
      const userValue = userConfig[key];
      const defaultValue = defaultConfig[key];

      if (userValue !== defaultValue) {
        diff[key] = userValue;
      }
    }
  }

  return diff;
}

/**
 * Validate that user configuration only contains valid keys
 */
export function validateConfigKeys<T extends Record<string, any>>(
  userConfig: Partial<T>,
  validKeys: (keyof T)[],
): { isValid: boolean; invalidKeys: string[] } {
  const invalidKeys: string[] = [];

  for (const key in userConfig) {
    if (Object.prototype.hasOwnProperty.call(userConfig, key) && !validKeys.includes(key as keyof T)) {
      invalidKeys.push(key);
    }
  }

  return {
    isValid: invalidKeys.length === 0,
    invalidKeys,
  };
}

/**
 * Create a configuration builder for fluent API
 */
export class ConfigBuilder {
  private config: Partial<UnifiedErrorConfig> = {};

  constructor(provider?: ErrorProviderType) {
    if (provider) {
      this.config.provider = { provider };
    }
  }

  /**
   * Set the error provider
   */
  withProvider(provider: ErrorProviderType): this {
    this.config.provider = { provider };
    return this;
  }

  /**
   * Set the environment
   */
  withEnvironment(environment: 'development' | 'staging' | 'production'): this {
    this.config.environment = environment;
    return this;
  }

  /**
   * Enable debug mode
   */
  withDebug(debug: boolean = true): this {
    this.config.debug = debug;
    return this;
  }

  /**
   * Set sample rate
   */
  withSampleRate(rate: number): this {
    this.config.sampleRate = rate;
    return this;
  }

  /**
   * Set maximum breadcrumbs
   */
  withMaxBreadcrumbs(max: number): this {
    this.config.maxBreadcrumbs = max;
    return this;
  }

  /**
   * Enable offline support
   */
  withOfflineSupport(enabled: boolean = true): this {
    this.config.enableOffline = enabled;
    return this;
  }

  /**
   * Set provider-specific configuration
   */
  withProviderConfig<T>(providerConfig: Partial<T>): this {
    if (this.config.provider) {
      this.config.provider = { ...this.config.provider, ...providerConfig };
    }
    return this;
  }

  /**
   * Set ignored errors
   */
  withIgnoredErrors(errors: (string | RegExp)[]): this {
    this.config.ignoreErrors = errors;
    return this;
  }

  /**
   * Build the final configuration
   */
  build(): UnifiedErrorConfig {
    return mergeWithDefaults(this.config);
  }
}

/**
 * Create a new configuration builder
 */
export function createConfigBuilder(provider?: ErrorProviderType): ConfigBuilder {
  return new ConfigBuilder(provider);
}

/**
 * Create a configuration for a specific environment
 */
export function createEnvironmentConfig(
  environment: 'development' | 'staging' | 'production',
  overrides?: Partial<UnifiedErrorConfig>,
): UnifiedErrorConfig {
  const config = overrides || {};
  return mergeWithDefaults(config, environment);
}

/**
 * Create a provider-specific configuration
 */
export function createProviderConfig<T extends Record<string, any>>(
  provider: ErrorProviderType,
  config: Partial<T>,
): UnifiedErrorConfig {
  return mergeWithDefaults({
    provider: {
      provider,
      ...config,
    },
  });
}
