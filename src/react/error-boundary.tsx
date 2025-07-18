import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorLevel } from '../types';

/**
 * Error boundary props
 */
export interface ErrorBoundaryProps {
  /**
   * Fallback component to render when an error occurs
   */
  fallback?: React.ComponentType<ErrorFallbackProps>;

  /**
   * Custom error handler
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

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

  /**
   * Children to render
   */
  children: ReactNode;
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * Error fallback props
 */
export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  errorId: string | null;
  resetError: () => void;
  retry: () => void;
}

/**
 * Error boundary component
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  /**
   * Catch errors in child components
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  /**
   * Handle component errors
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.handleError(error, errorInfo);
  }

  /**
   * Reset error boundary on prop changes
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKey } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError();
    }

    if (hasError && resetKey !== prevProps.resetKey) {
      this.resetError();
    }
  }

  /**
   * Cleanup on unmount
   */
  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  /**
   * Handle error reporting
   */
  private handleError = async (error: Error, errorInfo: ErrorInfo) => {
    const { onError, level = ErrorLevel.ERROR, context = {}, tags = {} } = this.props;

    // Call custom error handler
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    }

    // Report to error tracking (will be handled by ErrorProvider)
    try {
      const errorContext = {
        ...context,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        errorId: this.state.errorId,
        retryCount: this.retryCount,
        timestamp: new Date().toISOString(),
      };

      // Create a custom error event that can be caught by global handlers
      const errorEvent = new CustomEvent('errorBoundaryError', {
        detail: {
          error,
          errorInfo,
          context: errorContext,
          tags,
          level,
        },
      });

      window.dispatchEvent(errorEvent);
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  /**
   * Reset error state
   */
  private resetError = () => {
    this.retryCount = 0;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  /**
   * Retry with exponential backoff
   */
  private retry = () => {
    if (this.retryCount >= this.maxRetries) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    this.retryCount++;
    const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff

    this.resetTimeoutId = window.setTimeout(() => {
      this.resetError();
    }, delay);
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { fallback: FallbackComponent, children, isolate: _isolate } = this.props;

    if (hasError && error && errorInfo) {
      // Render fallback component
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            errorInfo={errorInfo}
            errorId={errorId}
            resetError={this.resetError}
            retry={this.retry}
          />
        );
      }

      // Render default fallback
      return <DefaultErrorFallback
        error={error}
        errorInfo={errorInfo}
        errorId={errorId}
        resetError={this.resetError}
        retry={this.retry}
      />;
    }

    return children;
  }
}

/**
 * Default error fallback component
 */
export const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  errorId,
  resetError,
  retry,
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div style={{
      padding: '24px',
      border: '2px solid #ff6b6b',
      borderRadius: '12px',
      backgroundColor: '#fff5f5',
      color: '#c92a2a',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '600px',
      margin: '20px auto',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          backgroundColor: '#ff6b6b',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: 'white',
        }}>
          !
        </div>
        <h2 style={{
          margin: 0,
          fontSize: '20px',
          fontWeight: '600',
        }}>
          Something went wrong
        </h2>
      </div>

      <p style={{
        margin: '0 0 16px 0',
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#868e96',
      }}>
        An unexpected error occurred. The error has been reported and we're working to fix it.
      </p>

      {errorId && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '6px',
          fontSize: '12px',
          fontFamily: 'monospace',
          color: '#495057',
          marginBottom: '16px',
        }}>
          Error ID: {errorId}
        </div>
      )}

      {isDevelopment && (
        <details style={{
          marginBottom: '16px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '6px',
          padding: '12px',
        }}>
          <summary style={{
            cursor: 'pointer',
            fontWeight: '500',
            marginBottom: '8px',
            fontSize: '14px',
          }}>
            Error Details (Development)
          </summary>
          <div style={{
            fontSize: '12px',
            fontFamily: 'monospace',
            color: '#495057',
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Error:</strong> {error.message}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Stack:</strong>
              <pre style={{
                margin: '4px 0 0 0',
                padding: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '150px',
                fontSize: '11px',
              }}>
                {error.stack}
              </pre>
            </div>
            {errorInfo.componentStack && (
              <div>
                <strong>Component Stack:</strong>
                <pre style={{
                  margin: '4px 0 0 0',
                  padding: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '150px',
                  fontSize: '11px',
                }}>
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
        </details>
      )}

      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={resetError}
          style={{
            padding: '10px 16px',
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#ff5252';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ff6b6b';
          }}
        >
          Try Again
        </button>
        <button
          onClick={retry}
          style={{
            padding: '10px 16px',
            backgroundColor: 'transparent',
            color: '#ff6b6b',
            border: '1px solid #ff6b6b',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#ff6b6b';
            e.currentTarget.style.color = 'white';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#ff6b6b';
          }}
        >
          Retry with Delay
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 16px',
            backgroundColor: 'transparent',
            color: '#868e96',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
};

/**
 * Hook-based error boundary wrapper
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};