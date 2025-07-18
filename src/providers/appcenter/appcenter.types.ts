import { AppCenterConfig } from '@/types/config';

/**
 * AppCenter SDK specific types
 */
export interface AppCenterOptions extends AppCenterConfig {
  /**
   * AppCenter app secret
   */
  appSecret: string;

  /**
   * Use in production
   */
  useInProduction?: boolean;

  /**
   * Log level
   */
  logLevel?: AppCenterLogLevel;

  /**
   * Country code
   */
  countryCode?: string;

  /**
   * User ID
   */
  userId?: string;

  /**
   * Distribute options
   */
  distribute?: AppCenterDistributeOptions;

  /**
   * Crashes options
   */
  crashes?: AppCenterCrashesOptions;

  /**
   * Analytics options
   */
  analytics?: AppCenterAnalyticsOptions;

  /**
   * Services to start
   */
  services?: AppCenterService[];
}

/**
 * AppCenter log levels
 */
export enum AppCenterLogLevel {
  VERBOSE = 0,
  DEBUG = 1,
  INFO = 2,
  WARNING = 3,
  ERROR = 4,
  ASSERT = 5,
  NONE = 6,
}

/**
 * AppCenter services
 */
export enum AppCenterService {
  ANALYTICS = 'analytics',
  CRASHES = 'crashes',
  DISTRIBUTE = 'distribute',
  PUSH = 'push',
}

/**
 * AppCenter Distribute options
 */
export interface AppCenterDistributeOptions {
  /**
   * Disable automatic check for updates
   */
  disableAutomaticCheckForUpdate?: boolean;

  /**
   * Check for updates on start
   */
  checkForUpdateOnStart?: boolean;

  /**
   * Update dialog
   */
  updateDialog?: AppCenterUpdateDialog;

  /**
   * Mandatory update dialog
   */
  mandatoryUpdateDialog?: AppCenterUpdateDialog;

  /**
   * Browser to use for authentication
   */
  browser?: AppCenterBrowser;

  /**
   * Custom domain
   */
  customDomain?: string;

  /**
   * Install URL
   */
  installUrl?: string;

  /**
   * API token
   */
  apiToken?: string;

  /**
   * Distribution groups
   */
  distributionGroups?: string[];
}

/**
 * AppCenter Crashes options
 */
export interface AppCenterCrashesOptions {
  /**
   * Should process error reports
   */
  shouldProcessErrorReports?: boolean;

  /**
   * Should await user confirmation
   */
  shouldAwaitUserConfirmation?: boolean;

  /**
   * Get error attachments
   */
  getErrorAttachments?: (report: any) => AppCenterErrorAttachment[];

  /**
   * User confirmation handler
   */
  userConfirmationHandler?: (reports: any[]) => AppCenterUserConfirmation;

  /**
   * Before sending error report
   */
  beforeSendingErrorReport?: (report: any) => void;

  /**
   * Error report sent
   */
  errorReportSent?: (report: any) => void;

  /**
   * On error report failed
   */
  onErrorReportFailed?: (report: any, error: any) => void;
}

/**
 * AppCenter Analytics options
 */
export interface AppCenterAnalyticsOptions {
  /**
   * Transmission interval
   */
  transmissionInterval?: number;

  /**
   * Should track sessions
   */
  shouldTrackSessions?: boolean;

  /**
   * Automatically collect page views
   */
  automaticallyCollectPageViews?: boolean;

  /**
   * Event properties
   */
  eventProperties?: Record<string, any>;

  /**
   * Custom properties
   */
  customProperties?: Record<string, any>;
}

/**
 * AppCenter update dialog
 */
export interface AppCenterUpdateDialog {
  /**
   * Title
   */
  title?: string;

  /**
   * Message
   */
  message?: string;

  /**
   * Update button text
   */
  updateButtonText?: string;

  /**
   * Cancel button text
   */
  cancelButtonText?: string;
}

/**
 * AppCenter browser
 */
export enum AppCenterBrowser {
  EMBEDDED = 'embedded',
  EXTERNAL = 'external',
}

/**
 * AppCenter error attachment
 */
export interface AppCenterErrorAttachment {
  /**
   * Attachment text
   */
  text?: string;

  /**
   * Attachment binary
   */
  binary?: Uint8Array;

  /**
   * Attachment filename
   */
  filename?: string;

  /**
   * Content type
   */
  contentType?: string;
}

/**
 * AppCenter user confirmation
 */
export enum AppCenterUserConfirmation {
  DONT_SEND = 'dont_send',
  SEND = 'send',
  ALWAYS_SEND = 'always_send',
}

/**
 * AppCenter crash report
 */
export interface AppCenterCrashReport {
  /**
   * Report ID
   */
  id: string;

  /**
   * Thread name
   */
  threadName?: string;

  /**
   * App start time
   */
  appStartTime?: Date;

  /**
   * App error time
   */
  appErrorTime?: Date;

  /**
   * Device info
   */
  device?: AppCenterDeviceInfo;

  /**
   * Stack trace
   */
  stackTrace?: string;

  /**
   * Exception
   */
  exception?: any;

  /**
   * User ID
   */
  userId?: string;

  /**
   * Properties
   */
  properties?: Record<string, string>;

  /**
   * Attachments
   */
  attachments?: AppCenterErrorAttachment[];
}

/**
 * AppCenter device info
 */
export interface AppCenterDeviceInfo {
  /**
   * SDK name
   */
  sdkName?: string;

  /**
   * SDK version
   */
  sdkVersion?: string;

  /**
   * Model
   */
  model?: string;

  /**
   * OEM name
   */
  oemName?: string;

  /**
   * OS name
   */
  osName?: string;

  /**
   * OS version
   */
  osVersion?: string;

  /**
   * OS build
   */
  osBuild?: string;

  /**
   * OS API level
   */
  osApiLevel?: number;

  /**
   * Locale
   */
  locale?: string;

  /**
   * Time zone offset
   */
  timeZoneOffset?: number;

  /**
   * Screen size
   */
  screenSize?: string;

  /**
   * App version
   */
  appVersion?: string;

  /**
   * App build
   */
  appBuild?: string;

  /**
   * App namespace
   */
  appNamespace?: string;

  /**
   * Carrier name
   */
  carrierName?: string;

  /**
   * Carrier country
   */
  carrierCountry?: string;

  /**
   * Wrapper SDK name
   */
  wrapperSdkName?: string;

  /**
   * Wrapper SDK version
   */
  wrapperSdkVersion?: string;

  /**
   * Wrapper runtime version
   */
  wrapperRuntimeVersion?: string;

  /**
   * Live update release label
   */
  liveUpdateReleaseLabel?: string;

  /**
   * Live update deployment key
   */
  liveUpdateDeploymentKey?: string;

  /**
   * Live update package hash
   */
  liveUpdatePackageHash?: string;
}
