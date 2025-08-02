import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { errorStore } from '../store/error-store';
import type { ErrorContext, NormalizedError } from '../store/types';

// Hook to use the error store
export function useErrorStore() {
  // Subscribe to store changes (for future state updates if needed)
  const state = useSyncExternalStore(
    (_callback) => {
      // For now, we don't have state changes to subscribe to
      // But this structure allows for future expansion
      return () => {};
    },
    () => ({
      initialized: errorStore.initialized,
      offline: errorStore.offline,
      activeAdapter: errorStore.activeAdapter,
    }),
    () => ({
      initialized: errorStore.initialized,
      offline: errorStore.offline,
      activeAdapter: errorStore.activeAdapter,
    })
  );

  return {
    ...state,
    captureError: errorStore.captureError.bind(errorStore),
    captureMessage: errorStore.captureMessage.bind(errorStore),
    setUser: errorStore.setUser.bind(errorStore),
    setContext: errorStore.setContext.bind(errorStore),
    addBreadcrumb: errorStore.addBreadcrumb.bind(errorStore),
    clearBreadcrumbs: errorStore.clearBreadcrumbs.bind(errorStore),
    useAdapter: errorStore.useAdapter.bind(errorStore),
    removeAdapter: errorStore.removeAdapter.bind(errorStore),
    flush: errorStore.flush.bind(errorStore),
    reset: errorStore.reset.bind(errorStore),
  };
}

// Hook to capture errors manually
export function useErrorHandler() {
  const { captureError } = useErrorStore();

  const handleError = useCallback((error: Error | string, context?: Partial<ErrorContext>) => {
    captureError(error, {
      ...context,
      extra: {
        ...context?.extra,
        source: 'react-hook',
      },
    });
  }, [captureError]);

  return handleError;
}

// Hook for handling async errors
export function useAsyncError() {
  const handleError = useErrorHandler();

  return useCallback((error: Error | string) => {
    handleError(error, { extra: { source: 'async-error' } });
  }, [handleError]);
}

// Hook to track component lifecycle
export function useErrorTracking(componentName: string) {
  const { addBreadcrumb } = useErrorStore();

  useEffect(() => {
    addBreadcrumb({
      message: `Component mounted: ${componentName}`,
      category: 'navigation',
      level: 'info',
    });

    return () => {
      addBreadcrumb({
        message: `Component unmounted: ${componentName}`,
        category: 'navigation',
        level: 'info',
      });
    };
  }, [componentName, addBreadcrumb]);
}

// Hook to capture errors from async operations
export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const handleError = useErrorHandler();

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      handleError(error, {
        extra: { source: 'async-operation' },
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, deps);

  return { data, loading, error, execute };
}

// Hook to listen for errors
export function useErrorListener(callback: (error: NormalizedError) => void) {
  useEffect(() => {
    return errorStore.subscribe(callback);
  }, [callback]);
}