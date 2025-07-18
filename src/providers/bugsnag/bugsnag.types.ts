import { BugsnagConfig } from '@/types/config';

/**
 * Bugsnag SDK specific types
 */
export interface BugsnagOptions extends BugsnagConfig {
  /**
   * Bugsnag API key
   */
  apiKey: string;

  /**
   * App version
   */
  appVersion?: string;

  /**
   * App type
   */
  appType?: string;

  /**
   * Release stage
   */
  releaseStage?: string;

  /**
   * Enabled release stages
   */
  enabledReleaseStages?: string[];

  /**
   * Auto detect errors
   */
  autoDetectErrors?: boolean;

  /**
   * Maximum breadcrumbs
   */
  maxBreadcrumbs?: number;

  /**
   * Enabled breadcrumb types
   */
  enabledBreadcrumbTypes?: string[];

  /**
   * Redacted keys
   */
  redactedKeys?: string[];

  /**
   * Metadata
   */
  metadata?: Record<string, any>;

  /**
   * Before send hook
   */
  beforeSend?: (event: any) => any | null;

  /**
   * On error hook
   */
  onError?: (event: any) => boolean;

  /**
   * Plugins
   */
  plugins?: any[];

  /**
   * Logger
   */
  logger?: any;
}

/**
 * Bugsnag severity levels
 */
export enum BugsnagSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Bugsnag breadcrumb types
 */
export enum BugsnagBreadcrumbType {
  NAVIGATION = 'navigation',
  REQUEST = 'request',
  PROCESS = 'process',
  LOG = 'log',
  USER = 'user',
  STATE = 'state',
  ERROR = 'error',
  MANUAL = 'manual',
}

/**
 * Bugsnag feature flag
 */
export interface BugsnagFeatureFlag {
  /**
   * Feature flag name
   */
  name: string;

  /**
   * Feature flag variant
   */
  variant?: string;
}

/**
 * Bugsnag user
 */
export interface BugsnagUser {
  /**
   * User ID
   */
  id?: string;

  /**
   * User email
   */
  email?: string;

  /**
   * User name
   */
  name?: string;

  /**
   * Additional user data
   */
  [key: string]: any;
}