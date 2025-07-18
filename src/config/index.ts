/**
 * Configuration management for unified error handling
 *
 * This module provides comprehensive configuration management including:
 * - Default configurations for all providers
 * - Configuration merging with user precedence
 * - Validation and sanitization
 * - Configuration builders and utilities
 */

// Export defaults
export * from './defaults';

// Export merging utilities
export * from './merger';

// Export validation utilities
export * from './validator';

// Re-export commonly used functions
export {
  DEFAULT_UNIFIED_CONFIG,
  BASE_DEFAULTS,
  PROVIDER_DEFAULTS,
  ENVIRONMENT_PRESETS,
  getProviderDefaults,
  getEnvironmentPreset,
  getDefaultConfig,
} from './defaults';

export {
  deepMerge,
  mergeWithDefaults,
  mergeProviderConfig,
  createConfigBuilder,
  createEnvironmentConfig,
  createProviderConfig,
  ConfigBuilder,
} from './merger';

export {
  validateConfig,
  validateBaseConfig,
  validateFirebaseConfig,
  validateSentryConfig,
  sanitizeConfig,
  createValidator,
  isValidConfig,
  formatValidationErrors,
  ConfigValidator,
} from './validator';

export type { ValidationResult, ValidationError, ValidationWarning } from './validator';
