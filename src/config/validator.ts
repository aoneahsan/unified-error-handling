/**
 * Configuration validation utilities
 *
 * This module provides comprehensive validation for configuration objects,
 * ensuring that all settings are valid and secure.
 */

import { ErrorProviderType } from '../types';
import type { UnifiedErrorConfig, FirebaseConfig, SentryConfig } from '../types';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

/**
 * Validation warning interface
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
}

/**
 * Configuration validation rules
 */
export const VALIDATION_RULES = {
  // Sample rate validation
  sampleRate: {
    min: 0,
    max: 1,
    message: 'Sample rate must be between 0 and 1',
  },

  // Breadcrumb validation
  maxBreadcrumbs: {
    min: 0,
    max: 1000,
    message: 'Max breadcrumbs must be between 0 and 1000',
  },

  // Offline queue validation
  maxOfflineQueueSize: {
    min: 0,
    max: 10000,
    message: 'Max offline queue size must be between 0 and 10000',
  },

  // Retry validation
  offlineRetryDelay: {
    min: 1000,
    max: 300000, // 5 minutes
    message: 'Offline retry delay must be between 1000ms and 300000ms',
  },

  // Environment validation
  environment: {
    validValues: ['development', 'staging', 'production'] as const,
    message: 'Environment must be one of: development, staging, production',
  },
} as const;

/**
 * Validate a numeric value within a range
 */
function validateNumericRange(value: number, min: number, max: number, fieldName: string): ValidationError | null {
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid number`,
      code: 'INVALID_TYPE',
      severity: 'error',
    };
  }

  if (value < min || value > max) {
    return {
      field: fieldName,
      message: `${fieldName} must be between ${min} and ${max}`,
      code: 'OUT_OF_RANGE',
      severity: 'error',
    };
  }

  return null;
}

/**
 * Validate a string value against allowed values
 */
function validateStringEnum(value: string, allowedValues: string[], fieldName: string): ValidationError | null {
  if (typeof value !== 'string') {
    return {
      field: fieldName,
      message: `${fieldName} must be a string`,
      code: 'INVALID_TYPE',
      severity: 'error',
    };
  }

  if (!allowedValues.includes(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      code: 'INVALID_VALUE',
      severity: 'error',
    };
  }

  return null;
}

/**
 * Validate API key format
 */
function validateApiKey(apiKey: string, provider: ErrorProviderType): ValidationError | null {
  if (!apiKey || typeof apiKey !== 'string') {
    return {
      field: 'apiKey',
      message: 'API key is required and must be a string',
      code: 'MISSING_API_KEY',
      severity: 'error',
    };
  }

  // Provider-specific API key validation
  switch (provider) {
    case ErrorProviderType.SENTRY:
      if (!apiKey.includes('@')) {
        return {
          field: 'apiKey',
          message: 'Sentry DSN must contain @ symbol',
          code: 'INVALID_DSN_FORMAT',
          severity: 'error',
        };
      }
      break;

    case ErrorProviderType.DATADOG:
      if (apiKey.length < 32) {
        return {
          field: 'apiKey',
          message: 'DataDog client token must be at least 32 characters',
          code: 'INVALID_TOKEN_LENGTH',
          severity: 'error',
        };
      }
      break;

    case ErrorProviderType.FIREBASE:
      // Firebase uses google-services.json, no API key validation needed
      break;

    default:
      if (apiKey.length < 16) {
        return {
          field: 'apiKey',
          message: 'API key appears to be too short',
          code: 'SUSPICIOUS_KEY_LENGTH',
          severity: 'warning',
        };
      }
  }

  return null;
}

/**
 * Validate base configuration
 */
export function validateBaseConfig(config: Partial<UnifiedErrorConfig>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate sample rate
  if (config.sampleRate !== undefined) {
    const error = validateNumericRange(
      config.sampleRate,
      VALIDATION_RULES.sampleRate.min,
      VALIDATION_RULES.sampleRate.max,
      'sampleRate',
    );
    if (error) errors.push(error);
  }

  // Validate max breadcrumbs
  if (config.maxBreadcrumbs !== undefined) {
    const error = validateNumericRange(
      config.maxBreadcrumbs,
      VALIDATION_RULES.maxBreadcrumbs.min,
      VALIDATION_RULES.maxBreadcrumbs.max,
      'maxBreadcrumbs',
    );
    if (error) errors.push(error);
  }

  // Validate offline queue size
  if (config.maxOfflineQueueSize !== undefined) {
    const error = validateNumericRange(
      config.maxOfflineQueueSize,
      VALIDATION_RULES.maxOfflineQueueSize.min,
      VALIDATION_RULES.maxOfflineQueueSize.max,
      'maxOfflineQueueSize',
    );
    if (error) errors.push(error);
  }

  // Validate retry delay
  if (config.offlineRetryDelay !== undefined) {
    const error = validateNumericRange(
      config.offlineRetryDelay,
      VALIDATION_RULES.offlineRetryDelay.min,
      VALIDATION_RULES.offlineRetryDelay.max,
      'offlineRetryDelay',
    );
    if (error) errors.push(error);
  }

  // Validate environment
  if (config.environment !== undefined) {
    const error = validateStringEnum(config.environment, [...VALIDATION_RULES.environment.validValues], 'environment');
    if (error) errors.push(error);
  }

  // Validate provider configuration
  if (config.provider) {
    if (!config.provider.provider) {
      errors.push({
        field: 'provider.provider',
        message: 'Provider type is required',
        code: 'MISSING_PROVIDER_TYPE',
        severity: 'error',
      });
    }

    // Validate API key if present
    if (config.provider.apiKey) {
      const error = validateApiKey(config.provider.apiKey, config.provider.provider);
      if (error) {
        if (error.severity === 'error') {
          errors.push(error);
        } else {
          warnings.push({
            field: error.field,
            message: error.message,
            code: error.code,
            suggestion: 'Please verify your API key is correct',
          });
        }
      }
    }
  }

  // Validate ignored errors
  if (config.ignoreErrors) {
    if (!Array.isArray(config.ignoreErrors)) {
      errors.push({
        field: 'ignoreErrors',
        message: 'Ignored errors must be an array',
        code: 'INVALID_TYPE',
        severity: 'error',
      });
    } else {
      config.ignoreErrors.forEach((error, index) => {
        if (typeof error !== 'string' && !(error instanceof RegExp)) {
          errors.push({
            field: `ignoreErrors[${index}]`,
            message: 'Ignored error must be a string or RegExp',
            code: 'INVALID_TYPE',
            severity: 'error',
          });
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Firebase-specific configuration
 */
export function validateFirebaseConfig(config: Partial<FirebaseConfig>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate custom keys limit
  if (config.customKeysLimit !== undefined) {
    const error = validateNumericRange(config.customKeysLimit, 1, 64, 'customKeysLimit');
    if (error) errors.push(error);
  }

  // Validate log limit
  if (config.logLimit !== undefined) {
    const error = validateNumericRange(config.logLimit, 1, 64, 'logLimit');
    if (error) errors.push(error);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Sentry-specific configuration
 */
export function validateSentryConfig(config: Partial<SentryConfig>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate DSN format
  if (config.dsn) {
    if (!config.dsn.includes('ingest.sentry.io') && !config.dsn.includes('sentry.io')) {
      warnings.push({
        field: 'dsn',
        message: 'DSN does not appear to be a valid Sentry DSN',
        code: 'SUSPICIOUS_DSN',
        suggestion: 'Please verify your DSN from Sentry dashboard',
      });
    }
  }

  // Validate traces sample rate
  if (config.tracesSampleRate !== undefined) {
    const error = validateNumericRange(config.tracesSampleRate, 0, 1, 'tracesSampleRate');
    if (error) errors.push(error);
  }

  // Validate profiles sample rate
  if (config.profilesSampleRate !== undefined) {
    const error = validateNumericRange(config.profilesSampleRate, 0, 1, 'profilesSampleRate');
    if (error) errors.push(error);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate complete configuration
 */
export function validateConfig(config: Partial<UnifiedErrorConfig>): ValidationResult {
  const baseResult = validateBaseConfig(config);
  let providerResult: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Validate provider-specific configuration
  if (config.provider) {
    switch (config.provider.provider) {
      case ErrorProviderType.FIREBASE:
        providerResult = validateFirebaseConfig(config.provider as Partial<FirebaseConfig>);
        break;
      case ErrorProviderType.SENTRY:
        providerResult = validateSentryConfig(config.provider as Partial<SentryConfig>);
        break;
      // Add more provider validations as needed
    }
  }

  // Combine results
  return {
    isValid: baseResult.isValid && providerResult.isValid,
    errors: [...baseResult.errors, ...providerResult.errors],
    warnings: [...baseResult.warnings, ...providerResult.warnings],
  };
}

/**
 * Sanitize configuration for logging (remove sensitive data)
 */
export function sanitizeConfig(config: any): any {
  const sensitiveFields = ['apiKey', 'dsn', 'token', 'secret', 'password', 'auth'];
  const sanitized = JSON.parse(JSON.stringify(config));

  function sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    for (const key in obj) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
        obj[key] = '***REDACTED***';
      } else if (typeof obj[key] === 'object') {
        obj[key] = sanitizeObject(obj[key]);
      }
    }

    return obj;
  }

  return sanitizeObject(sanitized);
}

/**
 * Create a configuration validator
 */
export class ConfigValidator {
  private customRules: Map<string, (value: any) => ValidationError | null> = new Map();

  /**
   * Add a custom validation rule
   */
  addRule(field: string, validator: (value: any) => ValidationError | null): this {
    this.customRules.set(field, validator);
    return this;
  }

  /**
   * Validate configuration with custom rules
   */
  validate(config: Partial<UnifiedErrorConfig>): ValidationResult {
    const result = validateConfig(config);

    // Apply custom rules
    for (const [field, validator] of this.customRules) {
      const value = this.getNestedValue(config, field);
      if (value !== undefined) {
        const error = validator(value);
        if (error) {
          result.errors.push(error);
          result.isValid = false;
        }
      }
    }

    return result;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

/**
 * Create a new configuration validator
 */
export function createValidator(): ConfigValidator {
  return new ConfigValidator();
}

/**
 * Quick validation function for development
 */
export function isValidConfig(config: Partial<UnifiedErrorConfig>): boolean {
  return validateConfig(config).isValid;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(result: ValidationResult): string {
  const messages: string[] = [];

  if (result.errors.length > 0) {
    messages.push('Validation Errors:');
    result.errors.forEach((error) => {
      messages.push(`  - ${error.field}: ${error.message}`);
    });
  }

  if (result.warnings.length > 0) {
    messages.push('Validation Warnings:');
    result.warnings.forEach((warning) => {
      messages.push(`  - ${warning.field}: ${warning.message}`);
      if (warning.suggestion) {
        messages.push(`    Suggestion: ${warning.suggestion}`);
      }
    });
  }

  return messages.join('\n');
}
