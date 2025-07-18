import { LogRocketConfig } from '@/types/config';

/**
 * LogRocket SDK specific types
 */
export interface LogRocketOptions extends Omit<LogRocketConfig, 'console' | 'network' | 'dom'> {
  /**
   * LogRocket App ID
   */
  appId: string;

  /**
   * Console capture configuration
   */
  console?: boolean | LogRocketConsoleConfig;

  /**
   * Network capture configuration
   */
  network?: boolean | LogRocketNetworkConfig;

  /**
   * DOM capture configuration
   */
  dom?: boolean | LogRocketDomConfig;

  /**
   * Redux middleware options
   */
  reduxMiddlewareOptions?: LogRocketReduxOptions;

  /**
   * Should capture IP
   */
  shouldCaptureIP?: boolean;

  /**
   * Sanitizers
   */
  sanitizers?: LogRocketSanitizers;

  /**
   * Upload timeout
   */
  uploadTimeoutMs?: number;

  /**
   * Max session length
   */
  maxSessionLengthMs?: number;

  /**
   * Capture performance
   */
  capturePerformance?: boolean;

  /**
   * Capture exceptions
   */
  captureExceptions?: boolean;

  /**
   * Merge config
   */
  mergeIframes?: boolean;

  /**
   * Parent domain
   */
  parentDomain?: string;

  /**
   * Root host whitelist
   */
  rootHostWhitelist?: string[];
}

/**
 * LogRocket console configuration
 */
export interface LogRocketConsoleConfig {
  /**
   * Should capture console
   */
  shouldCaptureConsole?: boolean;

  /**
   * Should aggregate console logs
   */
  shouldAggregateConsole?: boolean;

  /**
   * Should capture console errors
   */
  shouldCaptureConsoleErrors?: boolean;
}

/**
 * LogRocket network configuration
 */
export interface LogRocketNetworkConfig {
  /**
   * Should capture network
   */
  shouldCaptureNetwork?: boolean;

  /**
   * Request sanitizer
   */
  requestSanitizer?: (request: any) => any;

  /**
   * Response sanitizer
   */
  responseSanitizer?: (response: any) => any;
}

/**
 * LogRocket DOM configuration
 */
export interface LogRocketDomConfig {
  /**
   * Should capture DOM
   */
  shouldCaptureDom?: boolean;

  /**
   * Input sanitizer
   */
  inputSanitizer?: (input: any) => any;

  /**
   * Text sanitizer
   */
  textSanitizer?: (text: any) => any;

  /**
   * Attribute sanitizer
   */
  attributeSanitizer?: (attribute: any) => any;
}

/**
 * LogRocket Redux options
 */
export interface LogRocketReduxOptions {
  /**
   * State sanitizer
   */
  stateSanitizer?: (state: any) => any;

  /**
   * Action sanitizer
   */
  actionSanitizer?: (action: any) => any;

  /**
   * Should capture actions
   */
  shouldCaptureActions?: boolean;

  /**
   * Should capture state
   */
  shouldCaptureState?: boolean;
}

/**
 * LogRocket sanitizers
 */
export interface LogRocketSanitizers {
  /**
   * Input sanitizer
   */
  inputSanitizer?: (input: any) => any;

  /**
   * Text sanitizer
   */
  textSanitizer?: (text: any) => any;

  /**
   * Attribute sanitizer
   */
  attributeSanitizer?: (attribute: any) => any;
}

/**
 * LogRocket user identification
 */
export interface LogRocketUser {
  /**
   * User ID
   */
  id: string;

  /**
   * User info
   */
  info?: Record<string, any>;
}

/**
 * LogRocket session URL
 */
export interface LogRocketSessionUrl {
  /**
   * Session URL
   */
  url: string;

  /**
   * Session ID
   */
  sessionId: string;
}

/**
 * LogRocket tag
 */
export interface LogRocketTag {
  /**
   * Tag name
   */
  name: string;

  /**
   * Tag value
   */
  value?: string;
}
