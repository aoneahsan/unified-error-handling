// Import the service
import { ErrorHandlerService } from './services/error-handler';

// Export as UnifiedErrorHandling for backward compatibility
export const UnifiedErrorHandling = ErrorHandlerService;

export * from './definitions';
export * from './types';

// Export React components and hooks - use explicit exports to avoid conflicts
export {
  ErrorProvider as ReactErrorProvider,
  useErrorContext,
  DefaultErrorFallback,
  ErrorBoundary,
  withErrorBoundary,
  createErrorBoundary,
  createErrorProvider,
  useErrorHandler,
  useAsyncError,
  useComponentError,
  useUserContext,
  usePerformanceMonitor,
  useErrorRetry,
  useProviderManager,
  useErrorMetrics,
  useErrorDebug,
  withErrorHandler,
  withAsyncErrorHandler,
  withErrorHandling,
  withCompleteErrorHandling,
  createErrorHandlingHOC,
  withPageErrorHandling,
  withApiErrorHandling,
  withFormErrorHandling,
  withCriticalErrorHandling,
} from './react';

export type {
  ErrorContextValue,
  ErrorProviderProps,
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorFallbackProps,
  WithErrorBoundaryOptions,
  WithErrorHandlerOptions,
  WithAsyncErrorHandlerOptions,
} from './react';

// Export provider classes for advanced usage
export * from './providers';

// Export utility classes
export * from './utils';

// Export native components
export * from './native';

// Export services
export * from './services';
