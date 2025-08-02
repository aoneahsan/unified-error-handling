export interface ErrorContext {
  user?: UserContext;
  device?: DeviceContext;
  custom?: Record<string, any>;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

export interface UserContext {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: any;
}

export interface DeviceContext {
  platform?: string;
  model?: string;
  osVersion?: string;
  appVersion?: string;
  [key: string]: any;
}

export type ErrorLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

export interface Breadcrumb {
  timestamp: number;
  message: string;
  category?: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

export interface NormalizedError {
  message: string;
  stack?: string;
  type?: string;
  code?: string;
  timestamp: number;
  context: ErrorContext;
  breadcrumbs: Breadcrumb[];
  fingerprint?: string;
  level?: ErrorLevel;
  handled?: boolean;
  source?: 'manual' | 'global' | 'unhandledRejection' | 'react';
}

export interface ErrorAdapter {
  name: string;
  initialize(config: any): Promise<void>;
  captureError(error: NormalizedError): Promise<void>;
  captureMessage?(message: string, level?: string): Promise<void>;
  setContext?(context: ErrorContext): Promise<void>;
  addBreadcrumb?(breadcrumb: Breadcrumb): Promise<void>;
  flush?(): Promise<void>;
  close?(): Promise<void>;
}

export interface ErrorStoreState {
  context: ErrorContext;
  breadcrumbs: Breadcrumb[];
  adapters: Map<string, ErrorAdapter>;
  activeAdapter: string | null;
  config: ErrorStoreConfig;
  initialized: boolean;
  offline: boolean;
  errorQueue: NormalizedError[];
}

export interface ErrorStoreConfig {
  maxBreadcrumbs?: number;
  enableGlobalHandlers?: boolean;
  enableOfflineQueue?: boolean;
  enableConsoleCapture?: boolean;
  enableNetworkCapture?: boolean;
  beforeSend?: (error: NormalizedError) => NormalizedError | null;
  environment?: string;
  release?: string;
  debug?: boolean;
}

export interface ErrorStoreActions {
  initialize(config?: ErrorStoreConfig): void;
  captureError(error: Error | string, additionalContext?: Partial<ErrorContext>): void;
  captureMessage(message: string, level?: string): void;
  setUser(user: UserContext | null): void;
  setContext(context: Partial<ErrorContext>): void;
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void;
  clearBreadcrumbs(): void;
  useAdapter(name: string, config?: any): Promise<void>;
  removeAdapter(name: string): void;
  flush(): Promise<void>;
  reset(): void;
}

export type ErrorStore = ErrorStoreState & ErrorStoreActions;

export type ErrorListener = (error: NormalizedError) => void;

export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}