/**
 * React integration for Unified Error Handling
 * 
 * This module provides React-specific components and hooks for error handling
 */

import React from 'react';

// Provider and Context
export { ErrorProvider, useErrorContext, DefaultErrorFallback } from './provider';
export type { ErrorContextValue, ErrorProviderProps } from './provider';

// Error Boundary
export { ErrorBoundary, withErrorBoundary } from './error-boundary';
export type { ErrorBoundaryProps, ErrorBoundaryState, ErrorFallbackProps } from './error-boundary';

// Hooks
export {
  useErrorHandler,
  useAsyncError,
  useComponentError,
  useUserContext,
  usePerformanceMonitor,
  useErrorRetry,
  useProviderManager,
  useErrorMetrics,
  useErrorDebug,
} from './hooks';

// Higher-Order Components
export {
  withErrorBoundary,
  withErrorHandler,
  withAsyncErrorHandler,
  withErrorHandling,
  withCompleteErrorHandling,
  createErrorHandlingHOC,
  withPageErrorHandling,
  withApiErrorHandling,
  withFormErrorHandling,
  withCriticalErrorHandling,
} from './hoc';

export type {
  WithErrorBoundaryOptions,
  WithErrorHandlerOptions,
  WithAsyncErrorHandlerOptions,
} from './hoc';

/**
 * Utility functions for React error handling
 */

/**
 * Create a custom error boundary component
 */
export function createErrorBoundary(
  fallback?: React.ComponentType<ErrorFallbackProps>,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) {
  return function CustomErrorBoundary({ children }: { children: React.ReactNode }) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        {children}
      </ErrorBoundary>
    );
  };
}

/**
 * Create a custom error provider with preset configuration
 */
export function createErrorProvider(
  defaultConfig: Partial<ErrorProviderProps>
) {
  return function CustomErrorProvider(props: Partial<ErrorProviderProps> & { children: React.ReactNode }) {
    const mergedConfig = { ...defaultConfig, ...props };
    return <ErrorProvider {...mergedConfig} />;
  };
}

/**
 * Export types for easier consumption
 */