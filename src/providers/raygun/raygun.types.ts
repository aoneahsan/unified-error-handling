import { RaygunConfig } from '@/types/config';

/**
 * Raygun SDK specific types
 */
export interface RaygunOptions extends RaygunConfig {
  /**
   * Raygun API key
   */
  apiKey: string;

  /**
   * API endpoint
   */
  apiEndpoint?: string;

  /**
   * Disable anonymous user tracking
   */
  disableAnonymousUserTracking?: boolean;

  /**
   * Disable error tracking
   */
  disableErrorTracking?: boolean;

  /**
   * Disable pulse (Real User Monitoring)
   */
  disablePulse?: boolean;

  /**
   * With tags
   */
  withTags?: string[];

  /**
   * Custom data
   */
  customData?: Record<string, any>;

  /**
   * Grouping key
   */
  groupingKey?: string;

  /**
   * Version
   */
  version?: string;

  /**
   * Filters
   */
  filters?: string[];

  /**
   * Ignore case
   */
  ignoreCase?: boolean;

  /**
   * Ignore 3rd party errors
   */
  ignore3rdPartyErrors?: boolean;

  /**
   * Wrapping of async callbacks
   */
  wrapAsyncCallbacks?: boolean;

  /**
   * Before send callback
   */
  beforeSend?: (payload: any) => any | null;

  /**
   * On error callback
   */
  onError?: (error: any) => void;

  /**
   * Debug mode
   */
  debugMode?: boolean;

  /**
   * Excluded hostnames
   */
  excludedHostnames?: string[];

  /**
   * Excluded user agents
   */
  excludedUserAgents?: string[];

  /**
   * Pulse options
   */
  pulseOptions?: RaygunPulseOptions;
}

/**
 * Raygun Pulse (RUM) options
 */
export interface RaygunPulseOptions {
  /**
   * Enable pulse
   */
  enabled?: boolean;

  /**
   * Virtual page duration
   */
  virtualPageDuration?: number;

  /**
   * Ignore URL case
   */
  ignoreUrlCasing?: boolean;

  /**
   * Disable anonymous user tracking
   */
  disableAnonymousUserTracking?: boolean;

  /**
   * Ignored views
   */
  ignoredViews?: string[];

  /**
   * Custom timings
   */
  customTimings?: RaygunCustomTiming[];

  /**
   * Automatic performance tracking
   */
  automaticPerformanceTracking?: boolean;

  /**
   * Capture missing requests
   */
  captureMissingRequests?: boolean;

  /**
   * Before send callback
   */
  beforeSend?: (payload: any) => any | null;

  /**
   * On error callback
   */
  onError?: (error: any) => void;
}

/**
 * Raygun custom timing
 */
export interface RaygunCustomTiming {
  /**
   * Timing name
   */
  name: string;

  /**
   * Timing value
   */
  value: number;
}

/**
 * Raygun user
 */
export interface RaygunUser {
  /**
   * User identifier
   */
  identifier: string;

  /**
   * Is anonymous
   */
  isAnonymous?: boolean;

  /**
   * Email
   */
  email?: string;

  /**
   * First name
   */
  firstName?: string;

  /**
   * Full name
   */
  fullName?: string;

  /**
   * UUID
   */
  uuid?: string;

  /**
   * Additional user data
   */
  [key: string]: any;
}

/**
 * Raygun breadcrumb
 */
export interface RaygunBreadcrumb {
  /**
   * Breadcrumb message
   */
  message: string;

  /**
   * Breadcrumb category
   */
  category?: string;

  /**
   * Breadcrumb level
   */
  level?: RaygunBreadcrumbLevel;

  /**
   * Breadcrumb timestamp
   */
  timestamp?: number;

  /**
   * Breadcrumb data
   */
  customData?: Record<string, any>;
}

/**
 * Raygun breadcrumb levels
 */
export enum RaygunBreadcrumbLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

/**
 * Raygun error severity
 */
export enum RaygunSeverity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

/**
 * Raygun error payload
 */
export interface RaygunErrorPayload {
  /**
   * Error details
   */
  details: {
    /**
     * Error message
     */
    message: string;

    /**
     * Error class name
     */
    className?: string;

    /**
     * Stack trace
     */
    stackTrace?: any[];

    /**
     * Error data
     */
    data?: Record<string, any>;

    /**
     * Tags
     */
    tags?: string[];

    /**
     * User custom data
     */
    userCustomData?: Record<string, any>;

    /**
     * Request information
     */
    request?: RaygunRequestInfo;

    /**
     * Response information
     */
    response?: RaygunResponseInfo;

    /**
     * User information
     */
    user?: RaygunUser;

    /**
     * Version
     */
    version?: string;

    /**
     * Client information
     */
    client?: RaygunClientInfo;

    /**
     * Breadcrumbs
     */
    breadcrumbs?: RaygunBreadcrumb[];
  };
}

/**
 * Raygun request information
 */
export interface RaygunRequestInfo {
  /**
   * Request URL
   */
  url?: string;

  /**
   * HTTP method
   */
  method?: string;

  /**
   * Request headers
   */
  headers?: Record<string, string>;

  /**
   * Query parameters
   */
  queryParameters?: Record<string, string>;

  /**
   * Request body
   */
  data?: any;

  /**
   * IP address
   */
  ipAddress?: string;
}

/**
 * Raygun response information
 */
export interface RaygunResponseInfo {
  /**
   * Response status code
   */
  statusCode?: number;

  /**
   * Response headers
   */
  headers?: Record<string, string>;
}

/**
 * Raygun client information
 */
export interface RaygunClientInfo {
  /**
   * Client name
   */
  name?: string;

  /**
   * Client version
   */
  version?: string;

  /**
   * Client URL
   */
  url?: string;
}
