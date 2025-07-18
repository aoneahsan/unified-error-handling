import React, { ComponentType, forwardRef, useCallback, useRef, useEffect } from 'react';
import { ErrorBoundary, ErrorFallbackProps } from './error-boundary';
import { useErrorHandler, useComponentError, usePerformanceMonitor } from './hooks';
import { ErrorLevel } from '../types';

/**
 * Options for withErrorBoundary HOC
 */
export interface WithErrorBoundaryOptions {
  /**
   * Fallback component to render when an error occurs
   */
  fallback?: ComponentType<ErrorFallbackProps>;

  /**
   * Custom error handler
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;

  /**
   * Error level to report
   */
  level?: ErrorLevel;

  /**
   * Additional context to include with the error
   */
  context?: Record<string, any>;

  /**
   * Tags to include with the error
   */
  tags?: Record<string, string>;

  /**
   * Whether to isolate errors (prevent propagation to parent boundaries)
   */
  isolate?: boolean;

  /**
   * Whether to reset on prop changes
   */
  resetOnPropsChange?: boolean;

  /**
   * Custom reset key - when this changes, the error boundary resets
   */
  resetKey?: string | number;
}

/**
 * HOC that wraps a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const WithErrorBoundaryComponent = forwardRef<any, P>((props, ref) => {
    const {
      fallback,
      onError,
      level,
      context,
      tags,
      isolate,
      resetOnPropsChange,
      resetKey,
    } = options;

    const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

    return (
      <ErrorBoundary
        fallback={fallback}
        onError={onError}
        level={level}
        context={{ ...context, wrappedComponent: componentName }}
        tags={tags}
        isolate={isolate}
        resetOnPropsChange={resetOnPropsChange}
        resetKey={resetKey}
      >
        <WrappedComponent {...props} ref={ref} />
      </ErrorBoundary>
    );
  });

  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorBoundaryComponent;
}

/**
 * Options for withErrorHandler HOC
 */
export interface WithErrorHandlerOptions {
  /**
   * Whether to automatically track component lifecycle
   */
  trackLifecycle?: boolean;

  /**
   * Whether to automatically track performance
   */
  trackPerformance?: boolean;

  /**
   * Custom context to include with all errors
   */
  context?: Record<string, any>;

  /**
   * Tags to include with all errors
   */
  tags?: Record<string, string>;

  /**
   * Whether to add navigation breadcrumbs automatically
   */
  trackNavigation?: boolean;

  /**
   * Whether to add user action breadcrumbs automatically
   */
  trackUserActions?: boolean;
}

/**
 * HOC that provides error handling capabilities to a component
 */
export function withErrorHandler<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithErrorHandlerOptions = {}
) {
  const WithErrorHandlerComponent = forwardRef<any, P>((props, ref) => {
    const {
      trackLifecycle = true,
      trackPerformance = false,
      context = {},
      tags = {},
      trackNavigation = false,
      trackUserActions = false,
    } = options;

    const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const { logError, logNavigation, logUserAction, setTags } = useErrorHandler();
    const { logComponentError } = useComponentError(componentName);
    const { measurePerformance } = usePerformanceMonitor();

    // Set component-specific tags
    useEffect(() => {
      if (Object.keys(tags).length > 0) {
        setTags({
          ...tags,
          component: componentName,
        });
      }
    }, [componentName, tags, setTags]);

    // Enhanced error logging with component context
    const handleError = useCallback((error: Error, phase: string = 'unknown') => {
      return logComponentError(error, phase, {
        ...context,
        props: Object.keys(props),
        timestamp: new Date().toISOString(),
      });
    }, [logComponentError, context, props]);

    // Enhanced navigation logging
    const handleNavigation = useCallback((from: string, to: string, metadata?: any) => {
      if (trackNavigation) {
        return logNavigation(from, to, {
          ...metadata,
          component: componentName,
        });
      }
    }, [logNavigation, trackNavigation, componentName]);

    // Enhanced user action logging
    const handleUserAction = useCallback((action: string, metadata?: any) => {
      if (trackUserActions) {
        return logUserAction(action, {
          ...metadata,
          component: componentName,
        });
      }
    }, [logUserAction, trackUserActions, componentName]);

    // Performance measurement wrapper
    const measureComponentPerformance = useCallback((name: string, fn: () => any) => {
      if (trackPerformance) {
        return measurePerformance(`${componentName}:${name}`, fn);
      }
      return fn();
    }, [measurePerformance, trackPerformance, componentName]);

    // Inject error handling props
    const enhancedProps = {
      ...props,
      onError: handleError,
      onNavigation: handleNavigation,
      onUserAction: handleUserAction,
      measurePerformance: measureComponentPerformance,
    } as P & {
      onError: (error: Error, phase?: string) => Promise<void>;
      onNavigation: (from: string, to: string, metadata?: any) => Promise<void>;
      onUserAction: (action: string, metadata?: any) => Promise<void>;
      measurePerformance: (name: string, fn: () => any) => any;
    };

    return <WrappedComponent {...enhancedProps} ref={ref} />;
  });

  WithErrorHandlerComponent.displayName = `withErrorHandler(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithErrorHandlerComponent;
}

/**
 * Options for withAsyncErrorHandler HOC
 */
export interface WithAsyncErrorHandlerOptions {
  /**
   * Whether to show loading state during async operations
   */
  showLoading?: boolean;

  /**
   * Whether to automatically retry failed operations
   */
  autoRetry?: boolean;

  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;

  /**
   * Custom context to include with async errors
   */
  context?: Record<string, any>;

  /**
   * Custom error handler for async operations
   */
  onAsyncError?: (error: Error, operation: string) => void;
}

/**
 * HOC that provides async error handling capabilities
 */
export function withAsyncErrorHandler<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAsyncErrorHandlerOptions = {}
) {
  const WithAsyncErrorHandlerComponent = forwardRef<any, P>((props, ref) => {
    const {
      showLoading = false,
      autoRetry = false,
      maxRetries = 3,
      context = {},
      onAsyncError,
    } = options;

    const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    const { logError } = useErrorHandler();
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<Error | null>(null);
    const retryCount = useRef(0);

    // Async error handler with retry logic
    const handleAsyncError = useCallback(async (
      asyncFn: () => Promise<any>,
      operationName: string = 'unknown'
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await asyncFn();
        retryCount.current = 0; // Reset on success
        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);

        // Log the error
        await logError(error, {
          ...context,
          component: componentName,
          operation: operationName,
          retryCount: retryCount.current,
          async: true,
        });

        // Call custom error handler
        if (onAsyncError) {
          onAsyncError(error, operationName);
        }

        // Auto retry logic
        if (autoRetry && retryCount.current < maxRetries) {
          retryCount.current++;
          const delay = Math.pow(2, retryCount.current) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          return handleAsyncError(asyncFn, operationName);
        }

        throw error;
      } finally {
        setIsLoading(false);
      }
    }, [logError, context, componentName, onAsyncError, autoRetry, maxRetries]);

    // Reset error state
    const resetError = useCallback(() => {
      setError(null);
      retryCount.current = 0;
    }, []);

    // Retry current operation
    const retry = useCallback(() => {
      if (error && retryCount.current < maxRetries) {
        setError(null);
        // Note: This would require storing the last failed operation
        // For now, just reset the error state
        resetError();
      }
    }, [error, maxRetries, resetError]);

    // Inject async error handling props
    const enhancedProps = {
      ...props,
      handleAsyncError,
      resetError,
      retry,
      isLoading: showLoading ? isLoading : undefined,
      error,
    } as P & {
      handleAsyncError: (asyncFn: () => Promise<any>, operationName?: string) => Promise<any>;
      resetError: () => void;
      retry: () => void;
      isLoading?: boolean;
      error: Error | null;
    };

    return <WrappedComponent {...enhancedProps} ref={ref} />;
  });

  WithAsyncErrorHandlerComponent.displayName = `withAsyncErrorHandler(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithAsyncErrorHandlerComponent;
}

/**
 * HOC that combines error boundary and error handler functionality
 */
export function withErrorHandling<P extends object>(
  WrappedComponent: ComponentType<P>,
  boundaryOptions: WithErrorBoundaryOptions = {},
  handlerOptions: WithErrorHandlerOptions = {}
) {
  // First apply error handler, then error boundary
  const ComponentWithHandler = withErrorHandler(WrappedComponent, handlerOptions);
  const ComponentWithBoundary = withErrorBoundary(ComponentWithHandler, boundaryOptions);

  ComponentWithBoundary.displayName = `withErrorHandling(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ComponentWithBoundary;
}

/**
 * HOC that provides comprehensive error handling (boundary + handler + async)
 */
export function withCompleteErrorHandling<P extends object>(
  WrappedComponent: ComponentType<P>,
  boundaryOptions: WithErrorBoundaryOptions = {},
  handlerOptions: WithErrorHandlerOptions = {},
  asyncOptions: WithAsyncErrorHandlerOptions = {}
) {
  // Apply all HOCs in sequence
  const ComponentWithAsyncHandler = withAsyncErrorHandler(WrappedComponent, asyncOptions);
  const ComponentWithHandler = withErrorHandler(ComponentWithAsyncHandler, handlerOptions);
  const ComponentWithBoundary = withErrorBoundary(ComponentWithHandler, boundaryOptions);

  ComponentWithBoundary.displayName = `withCompleteErrorHandling(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ComponentWithBoundary;
}

/**
 * Utility function to create a configured error handling HOC
 */
export function createErrorHandlingHOC(
  defaultBoundaryOptions: WithErrorBoundaryOptions = {},
  defaultHandlerOptions: WithErrorHandlerOptions = {},
  defaultAsyncOptions: WithAsyncErrorHandlerOptions = {}
) {
  return function errorHandlingHOC<P extends object>(
    WrappedComponent: ComponentType<P>,
    boundaryOptions: WithErrorBoundaryOptions = {},
    handlerOptions: WithErrorHandlerOptions = {},
    asyncOptions: WithAsyncErrorHandlerOptions = {}
  ) {
    return withCompleteErrorHandling(
      WrappedComponent,
      { ...defaultBoundaryOptions, ...boundaryOptions },
      { ...defaultHandlerOptions, ...handlerOptions },
      { ...defaultAsyncOptions, ...asyncOptions }
    );
  };
}

/**
 * Pre-configured HOCs for common use cases
 */

// HOC for page components
export const withPageErrorHandling = createErrorHandlingHOC(
  { isolate: true, resetOnPropsChange: true },
  { trackLifecycle: true, trackNavigation: true, trackUserActions: true },
  { autoRetry: false, showLoading: true }
);

// HOC for API components
export const withApiErrorHandling = createErrorHandlingHOC(
  { level: ErrorLevel.ERROR },
  { trackLifecycle: false, trackPerformance: true },
  { autoRetry: true, maxRetries: 3, showLoading: true }
);

// HOC for form components
export const withFormErrorHandling = createErrorHandlingHOC(
  { resetOnPropsChange: true },
  { trackUserActions: true },
  { autoRetry: false, showLoading: false }
);

// HOC for critical components
export const withCriticalErrorHandling = createErrorHandlingHOC(
  { level: ErrorLevel.CRITICAL, isolate: true },
  { trackLifecycle: true, trackPerformance: true },
  { autoRetry: true, maxRetries: 5 }
);