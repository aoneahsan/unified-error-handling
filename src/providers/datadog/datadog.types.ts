import { DataDogConfig } from '@/types/config';

/**
 * DataDog SDK specific types
 */
export interface DataDogOptions extends DataDogConfig {
  /**
   * Application ID
   */
  applicationId: string;

  /**
   * Client token
   */
  clientToken: string;

  /**
   * Site configuration
   */
  site?: 'datadoghq.com' | 'datadoghq.eu' | 'us3.datadoghq.com' | 'us5.datadoghq.com';

  /**
   * Service name
   */
  service?: string;

  /**
   * Session sample rate (0-100)
   */
  sessionSampleRate?: number;

  /**
   * Session replay sample rate (0-100)
   */
  sessionReplaySampleRate?: number;

  /**
   * Track user interactions
   */
  trackUserInteractions?: boolean;

  /**
   * Track resources
   */
  trackResources?: boolean;

  /**
   * Track long tasks
   */
  trackLongTasks?: boolean;

  /**
   * Default privacy level
   */
  defaultPrivacyLevel?: 'allow' | 'mask' | 'mask-user-input';

  /**
   * Allowed tracing URLs
   */
  allowedTracingUrls?: string[];

  /**
   * Before send hook
   */
  beforeSend?: (event: any) => any | null;
}

/**
 * DataDog RUM event types
 */
export enum DataDogRumEventType {
  ACTION = 'action',
  ERROR = 'error',
  LONG_TASK = 'long_task',
  RESOURCE = 'resource',
  VIEW = 'view',
}

/**
 * DataDog log levels
 */
export enum DataDogLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * DataDog RUM action types
 */
export enum DataDogActionType {
  CLICK = 'click',
  TAP = 'tap',
  SCROLL = 'scroll',
  SWIPE = 'swipe',
  CUSTOM = 'custom',
}

/**
 * DataDog resource types
 */
export enum DataDogResourceType {
  DOCUMENT = 'document',
  XHR = 'xhr',
  FETCH = 'fetch',
  BEACON = 'beacon',
  CSS = 'css',
  JS = 'js',
  IMAGE = 'image',
  FONT = 'font',
  MEDIA = 'media',
  OTHER = 'other',
}