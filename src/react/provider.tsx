import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { UnifiedErrorHandlingPlugin } from '../definitions';
import { UnifiedErrorConfig, ErrorLevel, UserContext, Breadcrumb, ErrorProviderType } from '../types';
import { UnifiedErrorHandling } from '../index';

/**
 * Error context interface
 */
interface ErrorContextValue {
  /**
   * Whether the error handler is initialized
   */
  isInitialized: boolean;

  /**
   * Current error provider type
   */
  currentProvider: ErrorProviderType | null;

  /**
   * Current user context
   */
  user: UserContext | null;

  /**
   * Recent breadcrumbs
   */
  breadcrumbs: Breadcrumb[];

  /**
   * Error handler methods
   */
  logError: (error: Error | string, context?: any) => Promise<void>;
  logMessage: (message: string, level?: ErrorLevel, context?: any) => Promise<void>;
  setUser: (user: UserContext | null) => Promise<void>;
  setContext: (key: string, value: any) => Promise<void>;
  addBreadcrumb: (breadcrumb: Breadcrumb) => Promise<void>;
  setTags: (tags: Record<string, string>) => Promise<void>;
  setTag: (key: string, value: string) => Promise<void>;
  setExtra: (key: string, value: any) => Promise<void>;
  clearBreadcrumbs: () => Promise<void>;
  clearUser: () => Promise<void>;
  switchProvider: (provider: ErrorProviderType, config?: any) => Promise<void>;
  flush: (timeout?: number) => Promise<boolean>;
  testError: () => Promise<void>;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
}

/**
 * Error provider props
 */
interface ErrorProviderProps {
  /**
   * Error handler configuration
   */
  config: UnifiedErrorConfig;

  /**
   * Children components
   */
  children: ReactNode;

  /**
   * Fallback component for unhandled errors
   */
  fallback?: React.ComponentType<{ error: Error; errorInfo: any; resetError: () => void }>;

  /**
   * Error callback
   */
  onError?: (error: Error, errorInfo: any) => void;

  /**
   * Enable debug mode
   */
  debug?: boolean;

  /**
   * Auto-capture unhandled errors
   */
  autoCapture?: boolean;
}

/**
 * Error context
 */
const ErrorContext = createContext<ErrorContextValue | null>(null);

/**
 * Hook to get error context
 */
export const useErrorContext = (): ErrorContextValue => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
};

/**
 * Error provider component
 */
export const ErrorProvider: React.FC<ErrorProviderProps> = ({
  config,
  children,
  fallback: FallbackComponent,
  onError,
  debug = false,
  autoCapture = true,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<ErrorProviderType | null>(null);
  const [user, setUserState] = useState<UserContext | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [isEnabled, setIsEnabledState] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<any>(null);

  /**
   * Initialize the error handler
   */
  const initializeErrorHandler = useCallback(async () => {
    try {
      await UnifiedErrorHandling.initialize(config);
      setIsInitialized(true);
      setCurrentProvider(config.provider.provider);
      
      if (debug) {
        console.log('✅ Unified Error Handling initialized with provider:', config.provider.provider);
      }
    } catch (err) {
      console.error('❌ Failed to initialize Unified Error Handling:', err);
      if (onError) {
        onError(err as Error, { phase: 'initialization' });
      }
    }
  }, [config, debug, onError]);

  /**
   * Log an error
   */
  const logError = useCallback(async (error: Error | string, context?: any) => {
    if (!isInitialized) return;

    try {
      await UnifiedErrorHandling.logError(error, context);
      if (debug) {
        console.log('📝 Error logged:', error);
      }
    } catch (err) {
      console.error('Failed to log error:', err);
    }
  }, [isInitialized, debug]);

  /**
   * Log a message
   */
  const logMessage = useCallback(async (message: string, level: ErrorLevel = ErrorLevel.INFO, context?: any) => {
    if (!isInitialized) return;

    try {
      await UnifiedErrorHandling.logMessage(message, level, context);
      if (debug) {
        console.log('📝 Message logged:', message, level);
      }
    } catch (err) {
      console.error('Failed to log message:', err);
    }
  }, [isInitialized, debug]);

  /**
   * Set user context
   */
  const setUser = useCallback(async (user: UserContext | null) => {
    if (!isInitialized) return;

    try {
      await UnifiedErrorHandling.setUser(user);
      setUserState(user);
      if (debug) {
        console.log('👤 User context set:', user);
      }
    } catch (err) {
      console.error('Failed to set user context:', err);
    }
  }, [isInitialized, debug]);

  /**
   * Set custom context
   */
  const setContext = useCallback(async (key: string, value: any) => {
    if (!isInitialized) return;

    try {
      await UnifiedErrorHandling.setContext(key, value);
      if (debug) {
        console.log('🏷️ Context set:', key, value);
      }
    } catch (err) {
      console.error('Failed to set context:', err);
    }
  }, [isInitialized, debug]);

  /**
   * Add breadcrumb
   */
  const addBreadcrumb = useCallback(async (breadcrumb: Breadcrumb) => {
    if (!isInitialized) return;

    try {
      await UnifiedErrorHandling.addBreadcrumb(breadcrumb);
      
      // Update local breadcrumbs
      setBreadcrumbs((prev) => {
        const newBreadcrumbs = [...prev, breadcrumb];
        // Keep only last 10 breadcrumbs for UI
        return newBreadcrumbs.slice(-10);
      });
      
      if (debug) {
        console.log('🍞 Breadcrumb added:', breadcrumb);
      }
    } catch (err) {
      console.error('Failed to add breadcrumb:', err);
    }
  }, [isInitialized, debug]);

  /**
   * Set tags
   */
  const setTags = useCallback(async (tags: Record<string, string>) => {
    if (!isInitialized) return;

    try {
      await UnifiedErrorHandling.setTags(tags);
      if (debug) {
        console.log('🏷️ Tags set:', tags);
      }
    } catch (err) {
      console.error('Failed to set tags:', err);
    }
  }, [isInitialized, debug]);

  /**
   * Set a single tag
   */
  const setTag = useCallback(async (key: string, value: string) => {
    if (!isInitialized) return;

    try {
      await UnifiedErrorHandling.setTag(key, value);
      if (debug) {
        console.log('🏷️ Tag set:', key, value);
      }
    } catch (err) {
      console.error('Failed to set tag:', err);
    }
  }, [isInitialized, debug]);

  /**
   * Set extra data
   */
  const setExtra = useCallback(async (key: string, value: any) => {
    if (!isInitialized) return;

    try {
      await UnifiedErrorHandling.setExtra(key, value);
      if (debug) {
        console.log('📋 Extra data set:', key, value);
      }
    } catch (err) {
      console.error('Failed to set extra data:', err);
    }
  }, [isInitialized, debug]);

  /**
   * Clear breadcrumbs
   */
  const clearBreadcrumbs = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await UnifiedErrorHandling.clearBreadcrumbs();
      setBreadcrumbs([]);
      if (debug) {
        console.log('🗑️ Breadcrumbs cleared');
      }
    } catch (err) {\n      console.error('Failed to clear breadcrumbs:', err);
    }
  }, [isInitialized, debug]);

  /**
   * Clear user
   */
  const clearUser = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await UnifiedErrorHandling.clearUser();
      setUserState(null);
      if (debug) {
        console.log('👤 User cleared');
      }
    } catch (err) {
      console.error('Failed to clear user:', err);
    }
  }, [isInitialized, debug]);

  /**
   * Switch provider
   */
  const switchProvider = useCallback(async (provider: ErrorProviderType, providerConfig?: any) => {
    if (!isInitialized) return;

    try {
      await UnifiedErrorHandling.switchProvider(provider, providerConfig);
      setCurrentProvider(provider);
      if (debug) {
        console.log('🔄 Provider switched to:', provider);
      }
    } catch (err) {
      console.error('Failed to switch provider:', err);
    }
  }, [isInitialized, debug]);

  /**
   * Flush pending errors
   */
  const flush = useCallback(async (timeout?: number) => {
    if (!isInitialized) return false;

    try {
      const result = await UnifiedErrorHandling.flush(timeout);
      if (debug) {
        console.log('💾 Flush result:', result);
      }
      return result.success;
    } catch (err) {
      console.error('Failed to flush:', err);
      return false;
    }
  }, [isInitialized, debug]);

  /**
   * Test error
   */
  const testError = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await UnifiedErrorHandling.testError();
      if (debug) {
        console.log('🧪 Test error sent');
      }
    } catch (err) {
      console.error('Failed to send test error:', err);
    }
  }, [isInitialized, debug]);

  /**
   * Set enabled state
   */
  const setEnabled = useCallback(async (enabled: boolean) => {
    if (!isInitialized) return;

    try {
      await UnifiedErrorHandling.setEnabled(enabled);
      setIsEnabledState(enabled);
      if (debug) {
        console.log('⚡ Error handling enabled:', enabled);
      }
    } catch (err) {
      console.error('Failed to set enabled state:', err);
    }
  }, [isInitialized, debug]);

  /**
   * Reset error state
   */
  const resetError = useCallback(() => {
    setError(null);
    setErrorInfo(null);
  }, []);

  /**
   * Handle React errors
   */
  const handleError = useCallback((error: Error, errorInfo: any) => {
    setError(error);
    setErrorInfo(errorInfo);
    
    if (onError) {
      onError(error, errorInfo);
    }
    
    if (autoCapture) {
      logError(error, {
        errorInfo,
        componentStack: errorInfo.componentStack,
        phase: 'react-error-boundary',
      });
    }
  }, [onError, autoCapture, logError]);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initializeErrorHandler();
  }, [initializeErrorHandler]);

  /**
   * Setup global error handlers
   */
  useEffect(() => {
    if (!autoCapture || !isInitialized) return;

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logError(event.reason, {
        type: 'unhandledRejection',
        promise: event.promise,
      });
    };

    const handleGlobalError = (event: ErrorEvent) => {
      logError(event.error || event.message, {
        type: 'globalError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGlobalError);
    };
  }, [autoCapture, isInitialized, logError]);

  /**
   * Context value
   */
  const contextValue: ErrorContextValue = {
    isInitialized,
    currentProvider,
    user,
    breadcrumbs,
    logError,
    logMessage,
    setUser,
    setContext,
    addBreadcrumb,
    setTags,
    setTag,
    setExtra,
    clearBreadcrumbs,
    clearUser,
    switchProvider,
    flush,
    testError,
    isEnabled,
    setEnabled,
  };

  /**
   * Render error fallback
   */
  if (error && FallbackComponent) {
    return <FallbackComponent error={error} errorInfo={errorInfo} resetError={resetError} />;
  }

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
};

/**
 * Default error fallback component
 */
export const DefaultErrorFallback: React.FC<{
  error: Error;
  errorInfo: any;
  resetError: () => void;
}> = ({ error, errorInfo, resetError }) => {
  return (
    <div style={{
      padding: '20px',
      border: '1px solid #ff6b6b',
      borderRadius: '8px',
      backgroundColor: '#fff5f5',
      color: '#c92a2a',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
        Something went wrong
      </h2>
      <details style={{ marginBottom: '16px' }}>
        <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
          Error Details
        </summary>
        <pre style={{
          fontSize: '12px',
          backgroundColor: '#f8f9fa',
          padding: '8px',
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '200px',
        }}>
          {error.stack}
        </pre>
      </details>
      <button
        onClick={resetError}
        style={{
          padding: '8px 16px',
          backgroundColor: '#ff6b6b',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
};