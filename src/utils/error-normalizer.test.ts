import { describe, it, expect, vi } from 'vitest';
import { ErrorNormalizer } from './error-normalizer';
import { ErrorLevel, ErrorContext } from '@/types';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => 'web',
    isNativePlatform: () => false,
  },
}));

describe('ErrorNormalizer', () => {
  describe('normalize', () => {
    it('should normalize string errors', () => {
      const result = ErrorNormalizer.normalize('Something went wrong');

      expect(result).toMatchObject({
        message: 'Something went wrong',
        name: 'StringError',
        level: ErrorLevel.ERROR,
        timestamp: expect.any(Number),
        stack: expect.any(String),
      });
    });

    it('should normalize Error objects', () => {
      const error = new Error('Test error');
      error.name = 'TestError';

      const result = ErrorNormalizer.normalize(error);

      expect(result).toMatchObject({
        message: 'Test error',
        name: 'TestError',
        level: ErrorLevel.ERROR,
        timestamp: expect.any(Number),
        stack: expect.stringContaining('Error: Test error'),
        originalError: error,
      });
    });

    it('should normalize custom error objects', () => {
      const customError = {
        message: 'Custom error message',
        name: 'CustomError',
        code: 'ERR_001',
        statusCode: 404,
        stack: 'Custom stack trace',
      };

      const result = ErrorNormalizer.normalize(customError);

      expect(result).toMatchObject({
        message: 'Custom error message',
        name: 'CustomError',
        level: ErrorLevel.ERROR,
        timestamp: expect.any(Number),
        stack: 'Custom stack trace',
        originalError: customError,
        context: {
          code: 'ERR_001',
          statusCode: 404,
        },
      });
    });

    it('should handle objects without message', () => {
      const obj = {
        error: 'Something failed',
        type: 'FailureType',
      };

      const result = ErrorNormalizer.normalize(obj);

      expect(result).toMatchObject({
        message: 'Something failed',
        name: 'FailureType',
      });
    });

    it('should handle unknown types', () => {
      const result = ErrorNormalizer.normalize(12345);

      expect(result).toMatchObject({
        message: '12345',
        name: 'UnknownError',
        level: ErrorLevel.ERROR,
        originalError: 12345,
      });
    });

    it('should apply context', () => {
      const context: ErrorContext = {
        level: ErrorLevel.WARNING,
        tags: { module: 'auth' },
        context: { action: 'login' },
        user: { id: '123', email: 'test@example.com' },
      };

      const result = ErrorNormalizer.normalize('Test error', context);

      expect(result).toMatchObject({
        level: ErrorLevel.WARNING,
        tags: { module: 'auth' },
        context: { action: 'login' },
        user: { id: '123', email: 'test@example.com' },
      });
    });

    it('should add platform info', () => {
      const result = ErrorNormalizer.normalize('Test error');

      expect(result.device).toMatchObject({
        platform: 'web',
      });

      expect(result.app).toMatchObject({
        environment: expect.any(String),
      });
    });
  });

  describe('parseStackTrace', () => {
    it('should parse Chrome/V8 stack traces', () => {
      const stack = `Error: Test error
    at Object.test (/path/to/file.js:10:15)
    at Context.<anonymous> (/path/to/test.js:20:5)
    at processImmediate (internal/timers.js:456:21)`;

      const frames = ErrorNormalizer.parseStackTrace(stack);

      expect(frames).toHaveLength(3);
      expect(frames[0]).toEqual({
        function: 'Object.test',
        file: '/path/to/file.js',
        line: 10,
        column: 15,
      });
    });

    it('should parse Firefox stack traces', () => {
      const stack = `test@/path/to/file.js:10:15
<anonymous>@/path/to/test.js:20:5
processImmediate@internal/timers.js:456:21`;

      const frames = ErrorNormalizer.parseStackTrace(stack);

      expect(frames).toHaveLength(3);
      expect(frames[0]).toEqual({
        function: 'test',
        file: '/path/to/file.js',
        line: 10,
        column: 15,
      });
    });

    it('should parse Safari stack traces', () => {
      const stack = `test@/path/to/file.js:10
global code@/path/to/test.js:20`;

      const frames = ErrorNormalizer.parseStackTrace(stack);

      expect(frames).toHaveLength(2);
      expect(frames[0]).toEqual({
        function: 'test',
        file: '/path/to/file.js',
        line: 10,
      });
    });

    it('should handle anonymous functions', () => {
      const stack = `Error: Test error
    at /path/to/file.js:10:15
    at Array.forEach (<anonymous>)`;

      const frames = ErrorNormalizer.parseStackTrace(stack);

      expect(frames).toHaveLength(1);
      expect(frames[0]).toEqual({
        file: '/path/to/file.js',
        line: 10,
        column: 15,
      });
    });

    it('should return empty array for invalid stack', () => {
      expect(ErrorNormalizer.parseStackTrace('')).toEqual([]);
      expect(ErrorNormalizer.parseStackTrace(null as any)).toEqual([]);
    });
  });

  describe('extractFingerprint', () => {
    it('should extract fingerprint from error', () => {
      const error = ErrorNormalizer.normalize(new Error('User 12345 not found'));
      error.stack = `Error: User 12345 not found
    at UserService.findUser (/src/services/user.service.js:45:11)`;

      const fingerprint = ErrorNormalizer.extractFingerprint(error);

      expect(fingerprint).toHaveLength(3);
      expect(fingerprint[0]).toBe('Error');
      expect(fingerprint[1]).toBe('User N not found'); // Number replaced
      expect(fingerprint[2]).toContain('user.service.js:45');
    });

    it('should handle errors without stack', () => {
      const error = ErrorNormalizer.normalize('Simple error');
      delete error.stack;

      const fingerprint = ErrorNormalizer.extractFingerprint(error);

      expect(fingerprint).toHaveLength(2);
      expect(fingerprint[0]).toBe('StringError');
      expect(fingerprint[1]).toBe('Simple error');
    });

    it('should replace dynamic values in message', () => {
      const error = ErrorNormalizer.normalize('Failed to fetch https://api.example.com/users/abc123def456');

      const fingerprint = ErrorNormalizer.extractFingerprint(error);

      expect(fingerprint[1]).toBe('Failed to fetch URL');
    });
  });

  describe('sanitize', () => {
    it('should not sanitize when scrubPII is false', () => {
      const error = ErrorNormalizer.normalize('Error with email@example.com');

      const sanitized = ErrorNormalizer.sanitize(error, { scrubPII: false });

      expect(sanitized.message).toBe('Error with email@example.com');
    });

    it('should sanitize PII when enabled', () => {
      const error = ErrorNormalizer.normalize('Error with email@example.com');
      error.context = {
        userEmail: 'user@test.com',
        phone: '+1 (555) 123-4567',
        ssn: '123-45-6789',
        creditCard: '4111 1111 1111 1111',
      };

      const sanitized = ErrorNormalizer.sanitize(error, { scrubPII: true });

      expect(sanitized.message).toBe('Error with [REDACTED]');
      expect(sanitized.context.userEmail).toBe('[REDACTED]');
      expect(sanitized.context.phone).toBe('[REDACTED]');
      expect(sanitized.context.ssn).toBe('[REDACTED]');
      expect(sanitized.context.creditCard).toBe('[REDACTED]');
    });

    it('should use custom PII patterns', () => {
      const error = ErrorNormalizer.normalize('Error with ABC123');

      const sanitized = ErrorNormalizer.sanitize(error, {
        scrubPII: true,
        piiPatterns: [/ABC\d+/g],
      });

      expect(sanitized.message).toBe('Error with [REDACTED]');
    });

    it('should redact specified fields', () => {
      const error = ErrorNormalizer.normalize('Test error');
      error.context = {
        publicData: 'visible',
        sensitiveData: 'secret',
        nested: {
          apiKey: 'sk-12345',
        },
      };

      const sanitized = ErrorNormalizer.sanitize(error, {
        scrubPII: true,
        redactedFields: ['sensitiveData', 'nested.apiKey'],
      });

      expect(sanitized.context.publicData).toBe('visible');
      expect(sanitized.context.sensitiveData).toBe('[REDACTED]');
      expect(sanitized.context.nested.apiKey).toBe('[REDACTED]');
    });

    it('should handle arrays in sanitization', () => {
      const error = ErrorNormalizer.normalize('Test error');
      error.context = {
        emails: ['user1@example.com', 'user2@example.com'],
      };

      const sanitized = ErrorNormalizer.sanitize(error, { scrubPII: true });

      expect(sanitized.context.emails).toEqual(['[REDACTED]', '[REDACTED]']);
    });
  });
});
