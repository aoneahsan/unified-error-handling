/**
 * Error severity levels
 */
export enum ErrorLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Normalized error structure
 */
export interface NormalizedError {
  /**
   * Error message
   */
  message: string;

  /**
   * Error name/type
   */
  name: string;

  /**
   * Stack trace
   */
  stack?: string;

  /**
   * Error severity level
   */
  level: ErrorLevel;

  /**
   * Timestamp when error occurred
   */
  timestamp: number;

  /**
   * Additional context data
   */
  context?: Record<string, any>;

  /**
   * Tags for categorization
   */
  tags?: Record<string, string>;

  /**
   * User information at time of error
   */
  user?: UserContext;

  /**
   * Device information
   */
  device?: DeviceContext;

  /**
   * App information
   */
  app?: AppContext;

  /**
   * Network state
   */
  network?: NetworkContext;

  /**
   * Custom metadata
   */
  metadata?: Record<string, any>;

  /**
   * Original error object
   */
  originalError?: Error | any;
}

/**
 * User context information
 */
export interface UserContext {
  /**
   * User ID
   */
  id?: string;

  /**
   * Username
   */
  username?: string;

  /**
   * Email address
   */
  email?: string;

  /**
   * IP address
   */
  ipAddress?: string;

  /**
   * Additional user attributes
   */
  [key: string]: any;
}

/**
 * Device context information
 */
export interface DeviceContext {
  /**
   * Device platform (ios, android, web)
   */
  platform?: string;

  /**
   * OS version
   */
  osVersion?: string;

  /**
   * Device model
   */
  model?: string;

  /**
   * Device manufacturer
   */
  manufacturer?: string;

  /**
   * Device orientation
   */
  orientation?: 'portrait' | 'landscape';

  /**
   * Battery level (0-100)
   */
  batteryLevel?: number;

  /**
   * Is device charging
   */
  isCharging?: boolean;

  /**
   * Available memory in bytes
   */
  memoryAvailable?: number;

  /**
   * Total memory in bytes
   */
  memoryTotal?: number;

  /**
   * Available disk space in bytes
   */
  diskAvailable?: number;

  /**
   * Total disk space in bytes
   */
  diskTotal?: number;
}

/**
 * App context information
 */
export interface AppContext {
  /**
   * App version
   */
  version?: string;

  /**
   * Build number
   */
  build?: string;

  /**
   * Bundle identifier
   */
  bundleId?: string;

  /**
   * Release version
   */
  release?: string;

  /**
   * Release stage (development, staging, production)
   */
  releaseStage?: string;

  /**
   * Environment
   */
  environment?: string;
}

/**
 * Network context information
 */
export interface NetworkContext {
  /**
   * Is device online
   */
  isOnline?: boolean;

  /**
   * Connection type (wifi, cellular, none)
   */
  connectionType?: string;

  /**
   * Carrier name
   */
  carrier?: string;
}

/**
 * Error context passed when logging errors
 */
export interface ErrorContext {
  /**
   * Error severity level
   */
  level?: ErrorLevel;

  /**
   * Additional context data
   */
  context?: Record<string, any>;

  /**
   * Tags for categorization
   */
  tags?: Record<string, string>;

  /**
   * User information
   */
  user?: UserContext;

  /**
   * Custom metadata
   */
  metadata?: Record<string, any>;

  /**
   * Fingerprint for error grouping
   */
  fingerprint?: string[];
}

/**
 * Breadcrumb for tracking user actions
 */
export interface Breadcrumb {
  /**
   * Breadcrumb message
   */
  message: string;

  /**
   * Breadcrumb type/category
   */
  category?: string;

  /**
   * Severity level
   */
  level?: ErrorLevel;

  /**
   * Timestamp
   */
  timestamp?: number;

  /**
   * Additional data
   */
  data?: Record<string, any>;
}

/**
 * Error filter function type
 */
export type ErrorFilter = (error: NormalizedError) => boolean;

/**
 * Error transformer function type
 */
export type ErrorTransformer = (error: NormalizedError) => NormalizedError | null;