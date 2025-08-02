import { useCallback } from 'react';
import { useErrorHandler } from './hooks';
import { errorStore } from '../store/error-store';

// Hook for tracking component errors
export function useComponentError(componentName: string) {
  const handleError = useErrorHandler();

  const logComponentError = useCallback((error: Error, phase: string, context?: any) => {
    return handleError(error, {
      tags: { component: componentName, phase },
      extra: context
    });
  }, [handleError, componentName]);

  return { logComponentError };
}

// Hook for performance monitoring
export function usePerformanceMonitor() {
  const measurePerformance = useCallback(<T>(name: string, fn: () => T): T => {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      
      errorStore.addBreadcrumb({
        message: `Performance: ${name}`,
        category: 'performance',
        level: 'info',
        data: { duration }
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      errorStore.addBreadcrumb({
        message: `Performance error: ${name}`,
        category: 'performance',
        level: 'error',
        data: { duration, error: String(error) }
      });
      
      throw error;
    }
  }, []);

  return { measurePerformance };
}

// Extended error handler with more features
export function useExtendedErrorHandler() {
  const handleError = useErrorHandler();

  const logError = useCallback((error: Error, context?: any) => {
    return handleError(error, context);
  }, [handleError]);

  const logNavigation = useCallback((from: string, to: string, metadata?: any): void => {
    errorStore.addBreadcrumb({
      message: `Navigation: ${from} → ${to}`,
      category: 'navigation',
      level: 'info',
      data: { from, to, ...metadata }
    });
  }, []);

  const logUserAction = useCallback((action: string, metadata?: any): void => {
    errorStore.addBreadcrumb({
      message: `User action: ${action}`,
      category: 'user',
      level: 'info',
      data: metadata
    });
  }, []);

  const setTags = useCallback((tags: Record<string, string>): void => {
    errorStore.setContext({
      ...errorStore.context,
      tags: { ...errorStore.context.tags, ...tags }
    });
  }, []);

  return {
    logError,
    logNavigation,
    logUserAction,
    setTags
  };
}