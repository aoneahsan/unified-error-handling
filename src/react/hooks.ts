import { useCallback, useEffect, useRef, useState } from 'react';
import { useErrorContext } from './provider';
import { ErrorLevel, Breadcrumb, UserContext, ErrorProviderType } from '../types';

/**
 * Hook for error handling functionality
 */
export const useErrorHandler = () => {
  const context = useErrorContext();
  
  // Memoized error logging function
  const logError = useCallback((error: Error | string, contextData?: any) => {
    return context.logError(error, contextData);
  }, [context.logError]);

  // Memoized message logging function
  const logMessage = useCallback((message: string, level?: ErrorLevel, contextData?: any) => {
    return context.logMessage(message, level, contextData);
  }, [context.logMessage]);

  // Memoized breadcrumb function
  const addBreadcrumb = useCallback((breadcrumb: Breadcrumb) => {
    return context.addBreadcrumb(breadcrumb);
  }, [context.addBreadcrumb]);

  // Convenience function to log navigation breadcrumbs
  const logNavigation = useCallback((from: string, to: string, metadata?: any) => {
    return addBreadcrumb({
      message: `Navigation: ${from} → ${to}`,
      category: 'navigation',
      level: ErrorLevel.INFO,
      timestamp: Date.now(),
      data: { from, to, ...metadata },
    });
  }, [addBreadcrumb]);

  // Convenience function to log user actions
  const logUserAction = useCallback((action: string, metadata?: any) => {
    return addBreadcrumb({
      message: `User Action: ${action}`,
      category: 'user',
      level: ErrorLevel.INFO,
      timestamp: Date.now(),
      data: { action, ...metadata },
    });
  }, [addBreadcrumb]);

  // Convenience function to log API calls
  const logApiCall = useCallback((method: string, url: string, status?: number, metadata?: any) => {
    const level = status && status >= 400 ? ErrorLevel.WARNING : ErrorLevel.INFO;
    return addBreadcrumb({
      message: `API Call: ${method} ${url}${status ? ` (${status})` : ''}`,
      category: 'http',
      level,
      timestamp: Date.now(),
      data: { method, url, status, ...metadata },
    });
  }, [addBreadcrumb]);

  return {
    ...context,
    logError,
    logMessage,
    addBreadcrumb,
    logNavigation,
    logUserAction,
    logApiCall,
  };
};

/**
 * Hook for async error handling with automatic error catching
 */
export const useAsyncError = () => {
  const { logError } = useErrorHandler();
  
  const handleAsyncError = useCallback((asyncFn: (...args: any[]) => Promise<any>, context?: any) => {
    return async (...args: any[]) => {
      try {
        return await asyncFn(...args);
      } catch (error) {
        await logError(error as Error, {
          ...context,
          async: true,
          arguments: args,
        });
        throw error; // Re-throw to allow component to handle
      }
    };
  }, [logError]);

  return { handleAsyncError };
};

/**
 * Hook for tracking component lifecycle errors
 */
export const useComponentError = (componentName: string) => {
  const { logError, addBreadcrumb } = useErrorHandler();
  
  useEffect(() => {
    addBreadcrumb({
      message: `Component Mounted: ${componentName}`,
      category: 'lifecycle',
      level: ErrorLevel.DEBUG,
      timestamp: Date.now(),
      data: { component: componentName, event: 'mount' },
    });

    return () => {
      addBreadcrumb({
        message: `Component Unmounted: ${componentName}`,
        category: 'lifecycle',
        level: ErrorLevel.DEBUG,
        timestamp: Date.now(),
        data: { component: componentName, event: 'unmount' },
      });
    };
  }, [componentName, addBreadcrumb]);

  const logComponentError = useCallback((error: Error, phase: string, metadata?: any) => {
    return logError(error, {
      component: componentName,
      phase,
      ...metadata,
    });
  }, [logError, componentName]);

  return { logComponentError };
};

/**
 * Hook for user context management
 */
export const useUserContext = () => {
  const { user, setUser, clearUser } = useErrorContext();
  
  const updateUser = useCallback((userData: Partial<UserContext>) => {
    const updatedUser = user ? { ...user, ...userData } : userData as UserContext;
    return setUser(updatedUser);
  }, [user, setUser]);

  const identifyUser = useCallback((id: string, email?: string, username?: string, metadata?: any) => {
    return setUser({
      id,
      email,
      username,
      ...metadata,
    });
  }, [setUser]);

  return {
    user,
    setUser,
    updateUser,
    identifyUser,
    clearUser,
  };
};

/**
 * Hook for performance monitoring
 */
export const usePerformanceMonitor = () => {
  const { addBreadcrumb } = useErrorHandler();
  
  const measurePerformance = useCallback((name: string, fn: () => any) => {
    const start = performance.now();
    let result: any;
    let error: Error | null = null;
    
    try {
      result = fn();
    } catch (err) {
      error = err as Error;
    }
    
    const duration = performance.now() - start;
    
    addBreadcrumb({
      message: `Performance: ${name} (${duration.toFixed(2)}ms)`,
      category: 'performance',
      level: duration > 1000 ? ErrorLevel.WARNING : ErrorLevel.INFO,
      timestamp: Date.now(),
      data: {
        name,
        duration,
        error: error?.message,
      },
    });
    
    if (error) {
      throw error;
    }
    
    return result;
  }, [addBreadcrumb]);

  const measureAsyncPerformance = useCallback(async (name: string, fn: () => Promise<any>) => {
    const start = performance.now();
    let result: any;
    let error: Error | null = null;
    
    try {
      result = await fn();
    } catch (err) {
      error = err as Error;
    }
    
    const duration = performance.now() - start;
    
    addBreadcrumb({
      message: `Async Performance: ${name} (${duration.toFixed(2)}ms)`,
      category: 'performance',
      level: duration > 2000 ? ErrorLevel.WARNING : ErrorLevel.INFO,
      timestamp: Date.now(),
      data: {
        name,
        duration,
        async: true,
        error: error?.message,
      },
    });
    
    if (error) {
      throw error;
    }
    
    return result;
  }, [addBreadcrumb]);

  return {
    measurePerformance,
    measureAsyncPerformance,
  };
};

/**
 * Hook for error retry functionality
 */
export const useErrorRetry = (maxRetries: number = 3) => {
  const { logError } = useErrorHandler();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const retryWithBackoff = useCallback(async (
    fn: () => Promise<any>,
    context?: any
  ) => {
    if (retryCount >= maxRetries) {
      throw new Error(`Maximum retry attempts (${maxRetries}) exceeded`);
    }
    
    setIsRetrying(true);
    
    try {
      const result = await fn();
      setRetryCount(0); // Reset on success
      return result;
    } catch (error) {
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      
      await logError(error as Error, {
        ...context,
        retry: true,
        retryCount: newRetryCount,
        maxRetries,
      });
      
      if (newRetryCount < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, newRetryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return retryWithBackoff(fn, context);
      }
      
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, maxRetries, logError]);

  const resetRetry = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retryWithBackoff,
    resetRetry,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries,
  };
};

/**
 * Hook for provider management
 */
export const useProviderManager = () => {
  const { currentProvider, switchProvider, flush } = useErrorContext();
  
  const switchWithFallback = useCallback(async (
    provider: ErrorProviderType,
    config?: any,
    fallbackProvider?: ErrorProviderType
  ) => {
    try {
      await switchProvider(provider, config);
    } catch (error) {
      if (fallbackProvider) {
        console.warn(`Failed to switch to ${provider}, falling back to ${fallbackProvider}`);
        await switchProvider(fallbackProvider, config);
      } else {
        throw error;
      }
    }
  }, [switchProvider]);

  return {
    currentProvider,
    switchProvider,
    switchWithFallback,
    flush,
  };
};

/**
 * Hook for error metrics and debugging
 */
export const useErrorMetrics = () => {
  const { breadcrumbs, isInitialized, currentProvider } = useErrorContext();
  const [errorCount, setErrorCount] = useState(0);
  const [lastError, setLastError] = useState<Error | null>(null);
  const errorRef = useRef<Error[]>([]);

  useEffect(() => {
    const handleError = (event: CustomEvent) => {
      const error = event.detail.error;
      errorRef.current.push(error);
      setErrorCount(prev => prev + 1);
      setLastError(error);
    };

    window.addEventListener('errorBoundaryError', handleError as EventListener);
    
    return () => {
      window.removeEventListener('errorBoundaryError', handleError as EventListener);
    };
  }, []);

  const getErrorSummary = useCallback(() => {
    return {
      totalErrors: errorCount,
      lastError,
      recentErrors: errorRef.current.slice(-5),
      breadcrumbCount: breadcrumbs.length,
      isInitialized,
      currentProvider,
    };
  }, [errorCount, lastError, breadcrumbs.length, isInitialized, currentProvider]);

  const clearMetrics = useCallback(() => {
    setErrorCount(0);
    setLastError(null);
    errorRef.current = [];
  }, []);

  return {
    errorCount,
    lastError,
    getErrorSummary,
    clearMetrics,
  };
};

/**
 * Hook for development debugging
 */
export const useErrorDebug = () => {
  const { testError, flush, breadcrumbs } = useErrorContext();
  const isDevelopment = process.env.NODE_ENV === 'development';

  const debugLog = useCallback((message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[Error Debug] ${message}`, data);
    }
  }, [isDevelopment]);

  const debugError = useCallback((error: Error, context?: any) => {
    if (isDevelopment) {
      console.error(`[Error Debug] ${error.message}`, {
        error,
        context,
        stack: error.stack,
        breadcrumbs: breadcrumbs.slice(-3),
      });
    }
  }, [isDevelopment, breadcrumbs]);

  const sendTestError = useCallback(() => {
    if (isDevelopment) {
      return testError();
    }
    console.warn('Test errors only available in development mode');
  }, [isDevelopment, testError]);

  const flushAndLog = useCallback(async (timeout?: number) => {
    const result = await flush(timeout);
    debugLog('Flush result', { success: result, timeout });
    return result;
  }, [flush, debugLog]);

  return {
    debugLog,
    debugError,
    sendTestError,
    flushAndLog,
    isDevelopment,
  };
};