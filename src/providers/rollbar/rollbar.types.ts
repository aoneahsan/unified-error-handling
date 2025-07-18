import { RollbarConfig } from '@/types/config';

/**
 * Rollbar SDK specific types
 */
export interface RollbarOptions extends RollbarConfig {
  /**
   * Rollbar access token
   */
  accessToken: string;

  /**
   * Environment
   */
  environment?: string;

  /**
   * Capture uncaught exceptions
   */
  captureUncaught?: boolean;

  /**
   * Capture unhandled rejections
   */
  captureUnhandledRejections?: boolean;

  /**
   * Payload configuration
   */
  payload?: RollbarPayload;

  /**
   * Transform function
   */
  transform?: (payload: any) => any | false;

  /**
   * Endpoint URL
   */
  endpoint?: string;

  /**
   * Log level
   */
  logLevel?: string;

  /**
   * Report level
   */
  reportLevel?: string;
}

/**
 * Rollbar payload configuration
 */
export interface RollbarPayload {
  /**
   * Environment
   */
  environment?: string;

  /**
   * Client configuration
   */
  client?: {
    javascript?: {
      source_map_enabled?: boolean;
      guess_uncaught_frames?: boolean;
    };
  };

  /**
   * Person information
   */
  person?: RollbarPerson;

  /**
   * Context
   */
  context?: string;

  /**
   * Custom data
   */
  custom?: Record<string, any>;

  /**
   * Server information
   */
  server?: {
    host?: string;
    root?: string;
    branch?: string;
    code_version?: string;
  };

  /**
   * Code version
   */
  code_version?: string;

  /**
   * Notifier information
   */
  notifier?: {
    name?: string;
    version?: string;
  };
}

/**
 * Rollbar person information
 */
export interface RollbarPerson {
  /**
   * Person ID
   */
  id?: string;

  /**
   * Person email
   */
  email?: string;

  /**
   * Person username
   */
  username?: string;

  /**
   * Additional person data
   */
  [key: string]: any;
}

/**
 * Rollbar log levels
 */
export enum RollbarLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Rollbar error data
 */
export interface RollbarErrorData {
  /**
   * Error message
   */
  message?: string;

  /**
   * Error level
   */
  level?: string;

  /**
   * Error body
   */
  body?: {
    trace?: {
      frames?: any[];
      exception?: {
        class?: string;
        message?: string;
      };
    };
    message?: string;
  };

  /**
   * Context
   */
  context?: string;

  /**
   * Custom data
   */
  custom?: Record<string, any>;

  /**
   * Person information
   */
  person?: RollbarPerson;

  /**
   * Timestamp
   */
  timestamp?: number;

  /**
   * Tags
   */
  tags?: Record<string, string>;
}