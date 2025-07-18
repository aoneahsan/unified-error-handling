import {
  NormalizedError,
  ErrorLevel,
  ErrorContext,
  DeviceContext,
  AppContext,
  NetworkContext,
} from '@/types';
import { Capacitor } from '@capacitor/core';

/**
 * Error normalizer utility
 * Converts various error formats into a normalized structure
 */
export class ErrorNormalizer {
  /**
   * Normalize an error into standard format
   */
  static normalize(
    error: Error | string | any,
    context?: ErrorContext
  ): NormalizedError {
    let normalized: NormalizedError;

    if (typeof error === 'string') {
      normalized = this.normalizeString(error, context);
    } else if (error instanceof Error) {
      normalized = this.normalizeError(error, context);
    } else if (error && typeof error === 'object') {
      normalized = this.normalizeObject(error, context);
    } else {
      normalized = this.normalizeUnknown(error, context);
    }

    // Apply context
    if (context) {
      normalized = this.applyContext(normalized, context);
    }

    // Add platform info
    normalized = this.addPlatformInfo(normalized);

    return normalized;
  }

  /**
   * Normalize string error
   */
  private static normalizeString(message: string, context?: ErrorContext): NormalizedError {
    return {
      message,
      name: 'StringError',
      level: context?.level || ErrorLevel.ERROR,
      timestamp: Date.now(),
      stack: this.generateStackTrace(),
    };
  }

  /**
   * Normalize Error object
   */
  private static normalizeError(error: Error, context?: ErrorContext): NormalizedError {
    return {
      message: error.message || 'Unknown error',
      name: error.name || 'Error',
      stack: error.stack || this.generateStackTrace(),
      level: context?.level || ErrorLevel.ERROR,
      timestamp: Date.now(),
      originalError: error,
    };
  }

  /**
   * Normalize generic object
   */
  private static normalizeObject(obj: any, context?: ErrorContext): NormalizedError {
    const normalized: NormalizedError = {
      message: obj.message || obj.error || obj.reason || JSON.stringify(obj),
      name: obj.name || obj.type || obj.code || 'ObjectError',
      level: obj.level || context?.level || ErrorLevel.ERROR,
      timestamp: obj.timestamp || Date.now(),
    };

    // Try to extract stack trace
    if (obj.stack) {
      normalized.stack = obj.stack;
    } else if (obj.stackTrace) {
      normalized.stack = obj.stackTrace;
    } else if (obj.stacktrace) {
      normalized.stack = obj.stacktrace;
    } else {
      normalized.stack = this.generateStackTrace();
    }

    // Preserve original object
    normalized.originalError = obj;

    // Extract additional properties
    if (obj.code) {
      normalized.context = { ...normalized.context, code: obj.code };
    }

    if (obj.statusCode || obj.status) {
      normalized.context = {
        ...normalized.context,
        statusCode: obj.statusCode || obj.status,
      };
    }

    return normalized;
  }

  /**
   * Normalize unknown type
   */
  private static normalizeUnknown(value: any, context?: ErrorContext): NormalizedError {
    return {
      message: String(value),
      name: 'UnknownError',
      level: context?.level || ErrorLevel.ERROR,
      timestamp: Date.now(),
      stack: this.generateStackTrace(),
      originalError: value,
    };
  }

  /**
   * Apply context to normalized error
   */
  private static applyContext(
    error: NormalizedError,
    context: ErrorContext
  ): NormalizedError {
    return {
      ...error,
      level: context.level || error.level,
      context: { ...error.context, ...context.context },
      tags: { ...error.tags, ...context.tags },
      user: context.user || error.user,
      metadata: { ...error.metadata, ...context.metadata },
    };
  }

  /**
   * Add platform-specific information
   */
  private static addPlatformInfo(error: NormalizedError): NormalizedError {
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();

    const device: DeviceContext = {
      platform,
    };

    const app: AppContext = {
      environment: process.env.NODE_ENV || 'production',
    };

    return {
      ...error,
      device: { ...device, ...error.device },
      app: { ...app, ...error.app },
    };
  }

  /**
   * Generate a synthetic stack trace
   */
  private static generateStackTrace(): string {
    try {
      throw new Error();
    } catch (e: any) {
      const stack = e.stack || '';
      // Remove the first lines that reference this function
      const lines = stack.split('\n');
      const filteredLines = lines.filter(
        (line) => !line.includes('ErrorNormalizer') && !line.includes('generateStackTrace')
      );
      return filteredLines.join('\n');
    }
  }

  /**
   * Parse stack trace into structured format
   */
  static parseStackTrace(stack: string): Array<{
    function?: string;
    file?: string;
    line?: number;
    column?: number;
  }> {
    const frames: Array<{
      function?: string;
      file?: string;
      line?: number;
      column?: number;
    }> = [];

    if (!stack) {
      return frames;
    }

    const lines = stack.split('\n');

    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) {
        continue;
      }

      // Chrome/V8 stack format
      const chromeMatch = line.match(/^\s*at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)$/);
      if (chromeMatch) {
        frames.push({
          function: chromeMatch[1],
          file: chromeMatch[2],
          line: parseInt(chromeMatch[3], 10),
          column: parseInt(chromeMatch[4], 10),
        });
        continue;
      }

      // Chrome/V8 anonymous function
      const chromeAnonymousMatch = line.match(/^\s*at\s+(.+?):(\d+):(\d+)$/);
      if (chromeAnonymousMatch) {
        frames.push({
          file: chromeAnonymousMatch[1],
          line: parseInt(chromeAnonymousMatch[2], 10),
          column: parseInt(chromeAnonymousMatch[3], 10),
        });
        continue;
      }

      // Firefox stack format
      const firefoxMatch = line.match(/^(.+?)@(.+?):(\d+):(\d+)$/);
      if (firefoxMatch) {
        frames.push({
          function: firefoxMatch[1],
          file: firefoxMatch[2],
          line: parseInt(firefoxMatch[3], 10),
          column: parseInt(firefoxMatch[4], 10),
        });
        continue;
      }

      // Safari stack format
      const safariMatch = line.match(/^(.+?)@(.+?):(\d+)$/);
      if (safariMatch) {
        frames.push({
          function: safariMatch[1],
          file: safariMatch[2],
          line: parseInt(safariMatch[3], 10),
        });
        continue;
      }
    }

    return frames;
  }

  /**
   * Extract error fingerprint for grouping
   */
  static extractFingerprint(error: NormalizedError): string[] {
    const fingerprint: string[] = [];

    // Add error name
    fingerprint.push(error.name);

    // Add error message pattern (remove dynamic values)
    const messagePattern = error.message
      .replace(/\b\d+\b/g, 'N') // Replace numbers
      .replace(/\b[a-f0-9]{8,}\b/gi, 'ID') // Replace IDs/hashes
      .replace(/https?:\/\/[^\s]+/g, 'URL') // Replace URLs
      .substring(0, 100); // Limit length

    fingerprint.push(messagePattern);

    // Add top stack frame if available
    if (error.stack) {
      const frames = this.parseStackTrace(error.stack);
      if (frames.length > 0) {
        const topFrame = frames[0];
        if (topFrame.file) {
          // Extract file name without path
          const fileName = topFrame.file.split('/').pop() || topFrame.file;
          fingerprint.push(`${fileName}:${topFrame.line || 0}`);
        }
      }
    }

    return fingerprint;
  }

  /**
   * Sanitize error data for privacy
   */
  static sanitize(
    error: NormalizedError,
    options?: {
      scrubPII?: boolean;
      piiPatterns?: RegExp[];
      redactedFields?: string[];
    }
  ): NormalizedError {
    if (!options?.scrubPII) {
      return error;
    }

    const sanitized = JSON.parse(JSON.stringify(error));
    const patterns = options.piiPatterns || [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
      /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, // Credit card
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
      /\b(?:\+\d{1,3}\s?)?(?:\(\d{1,4}\)\s?)?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4}\b/g, // Phone
    ];

    const redact = (obj: any, path: string = ''): any => {
      if (typeof obj === 'string') {
        let redacted = obj;
        for (const pattern of patterns) {
          redacted = redacted.replace(pattern, '[REDACTED]');
        }
        return redacted;
      }

      if (Array.isArray(obj)) {
        return obj.map((item, index) => redact(item, `${path}[${index}]`));
      }

      if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const fullPath = path ? `${path}.${key}` : key;
            if (options.redactedFields?.includes(fullPath) || options.redactedFields?.includes(key)) {
              result[key] = '[REDACTED]';
            } else {
              result[key] = redact(obj[key], fullPath);
            }
          }
        }
        return result;
      }

      return obj;
    };

    return redact(sanitized);
  }
}