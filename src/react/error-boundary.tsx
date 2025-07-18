import React, { Component, ReactNode, ErrorInfo } from 'react';
import { ErrorLevel } from '../types';
import { useErrorContext } from './provider';

/**
 * Error boundary props
 */
interface ErrorBoundaryProps {
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
interface ErrorBoundaryState {
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
    this.state = {\n      hasError: false,\n      error: null,\n      errorInfo: null,\n      errorId: null,\n    };\n  }\n\n  /**\n   * Catch errors in child components\n   */\n  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {\n    return {\n      hasError: true,\n      error,\n      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,\n    };\n  }\n\n  /**\n   * Handle component errors\n   */\n  componentDidCatch(error: Error, errorInfo: ErrorInfo) {\n    this.setState({ errorInfo });\n    this.handleError(error, errorInfo);\n  }\n\n  /**\n   * Reset error boundary on prop changes\n   */\n  componentDidUpdate(prevProps: ErrorBoundaryProps) {\n    const { resetOnPropsChange, resetKey } = this.props;\n    const { hasError } = this.state;\n\n    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {\n      this.resetError();\n    }\n\n    if (hasError && resetKey !== prevProps.resetKey) {\n      this.resetError();\n    }\n  }\n\n  /**\n   * Cleanup on unmount\n   */\n  componentWillUnmount() {\n    if (this.resetTimeoutId) {\n      clearTimeout(this.resetTimeoutId);\n    }\n  }\n\n  /**\n   * Handle error reporting\n   */\n  private handleError = async (error: Error, errorInfo: ErrorInfo) => {\n    const { onError, level = ErrorLevel.ERROR, context = {}, tags = {} } = this.props;\n\n    // Call custom error handler\n    if (onError) {\n      try {\n        onError(error, errorInfo);\n      } catch (handlerError) {\n        console.error('Error in error handler:', handlerError);\n      }\n    }\n\n    // Report to error tracking (will be handled by ErrorProvider)\n    try {\n      const errorContext = {\n        ...context,\n        componentStack: errorInfo.componentStack,\n        errorBoundary: true,\n        errorId: this.state.errorId,\n        retryCount: this.retryCount,\n        timestamp: new Date().toISOString(),\n      };\n\n      // Create a custom error event that can be caught by global handlers\n      const errorEvent = new CustomEvent('errorBoundaryError', {\n        detail: {\n          error,\n          errorInfo,\n          context: errorContext,\n          tags,\n          level,\n        },\n      });\n\n      window.dispatchEvent(errorEvent);\n    } catch (reportError) {\n      console.error('Failed to report error:', reportError);\n    }\n  };\n\n  /**\n   * Reset error state\n   */\n  private resetError = () => {\n    this.retryCount = 0;\n    this.setState({\n      hasError: false,\n      error: null,\n      errorInfo: null,\n      errorId: null,\n    });\n  };\n\n  /**\n   * Retry with exponential backoff\n   */\n  private retry = () => {\n    if (this.retryCount >= this.maxRetries) {\n      console.warn('Maximum retry attempts reached');\n      return;\n    }\n\n    this.retryCount++;\n    const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff\n\n    this.resetTimeoutId = window.setTimeout(() => {\n      this.resetError();\n    }, delay);\n  };\n\n  render() {\n    const { hasError, error, errorInfo, errorId } = this.state;\n    const { fallback: FallbackComponent, children, isolate } = this.props;\n\n    if (hasError && error && errorInfo) {\n      // Render fallback component\n      if (FallbackComponent) {\n        return (\n          <FallbackComponent\n            error={error}\n            errorInfo={errorInfo}\n            errorId={errorId}\n            resetError={this.resetError}\n            retry={this.retry}\n          />\n        );\n      }\n\n      // Render default fallback\n      return <DefaultErrorFallback\n        error={error}\n        errorInfo={errorInfo}\n        errorId={errorId}\n        resetError={this.resetError}\n        retry={this.retry}\n      />;\n    }\n\n    return children;\n  }\n}\n\n/**\n * Default error fallback component\n */\nexport const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({\n  error,\n  errorInfo,\n  errorId,\n  resetError,\n  retry,\n}) => {\n  const isDevelopment = process.env.NODE_ENV === 'development';\n\n  return (\n    <div style={{\n      padding: '24px',\n      border: '2px solid #ff6b6b',\n      borderRadius: '12px',\n      backgroundColor: '#fff5f5',\n      color: '#c92a2a',\n      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif',\n      maxWidth: '600px',\n      margin: '20px auto',\n      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',\n    }}>\n      <div style={{\n        display: 'flex',\n        alignItems: 'center',\n        marginBottom: '16px',\n      }}>\n        <div style={{\n          width: '24px',\n          height: '24px',\n          backgroundColor: '#ff6b6b',\n          borderRadius: '50%',\n          display: 'flex',\n          alignItems: 'center',\n          justifyContent: 'center',\n          marginRight: '12px',\n          fontSize: '14px',\n          fontWeight: 'bold',\n          color: 'white',\n        }}>\n          !\n        </div>\n        <h2 style={{\n          margin: 0,\n          fontSize: '20px',\n          fontWeight: '600',\n        }}>\n          Something went wrong\n        </h2>\n      </div>\n\n      <p style={{\n        margin: '0 0 16px 0',\n        fontSize: '14px',\n        lineHeight: '1.5',\n        color: '#868e96',\n      }}>\n        An unexpected error occurred. The error has been reported and we're working to fix it.\n      </p>\n\n      {errorId && (\n        <div style={{\n          padding: '8px 12px',\n          backgroundColor: '#f8f9fa',\n          border: '1px solid #e9ecef',\n          borderRadius: '6px',\n          fontSize: '12px',\n          fontFamily: 'monospace',\n          color: '#495057',\n          marginBottom: '16px',\n        }}>\n          Error ID: {errorId}\n        </div>\n      )}\n\n      {isDevelopment && (\n        <details style={{\n          marginBottom: '16px',\n          backgroundColor: '#f8f9fa',\n          border: '1px solid #e9ecef',\n          borderRadius: '6px',\n          padding: '12px',\n        }}>\n          <summary style={{\n            cursor: 'pointer',\n            fontWeight: '500',\n            marginBottom: '8px',\n            fontSize: '14px',\n          }}>\n            Error Details (Development)\n          </summary>\n          <div style={{\n            fontSize: '12px',\n            fontFamily: 'monospace',\n            color: '#495057',\n          }}>\n            <div style={{ marginBottom: '8px' }}>\n              <strong>Error:</strong> {error.message}\n            </div>\n            <div style={{ marginBottom: '8px' }}>\n              <strong>Stack:</strong>\n              <pre style={{\n                margin: '4px 0 0 0',\n                padding: '8px',\n                backgroundColor: '#ffffff',\n                border: '1px solid #dee2e6',\n                borderRadius: '4px',\n                overflow: 'auto',\n                maxHeight: '150px',\n                fontSize: '11px',\n              }}>\n                {error.stack}\n              </pre>\n            </div>\n            {errorInfo.componentStack && (\n              <div>\n                <strong>Component Stack:</strong>\n                <pre style={{\n                  margin: '4px 0 0 0',\n                  padding: '8px',\n                  backgroundColor: '#ffffff',\n                  border: '1px solid #dee2e6',\n                  borderRadius: '4px',\n                  overflow: 'auto',\n                  maxHeight: '150px',\n                  fontSize: '11px',\n                }}>\n                  {errorInfo.componentStack}\n                </pre>\n              </div>\n            )}\n          </div>\n        </details>\n      )}\n\n      <div style={{\n        display: 'flex',\n        gap: '8px',\n        flexWrap: 'wrap',\n      }}>\n        <button\n          onClick={resetError}\n          style={{\n            padding: '10px 16px',\n            backgroundColor: '#ff6b6b',\n            color: 'white',\n            border: 'none',\n            borderRadius: '6px',\n            cursor: 'pointer',\n            fontSize: '14px',\n            fontWeight: '500',\n            transition: 'background-color 0.2s',\n          }}\n          onMouseOver={(e) => {\n            e.currentTarget.style.backgroundColor = '#ff5252';\n          }}\n          onMouseOut={(e) => {\n            e.currentTarget.style.backgroundColor = '#ff6b6b';\n          }}\n        >\n          Try Again\n        </button>\n        <button\n          onClick={retry}\n          style={{\n            padding: '10px 16px',\n            backgroundColor: 'transparent',\n            color: '#ff6b6b',\n            border: '1px solid #ff6b6b',\n            borderRadius: '6px',\n            cursor: 'pointer',\n            fontSize: '14px',\n            fontWeight: '500',\n            transition: 'all 0.2s',\n          }}\n          onMouseOver={(e) => {\n            e.currentTarget.style.backgroundColor = '#ff6b6b';\n            e.currentTarget.style.color = 'white';\n          }}\n          onMouseOut={(e) => {\n            e.currentTarget.style.backgroundColor = 'transparent';\n            e.currentTarget.style.color = '#ff6b6b';\n          }}\n        >\n          Retry with Delay\n        </button>\n        <button\n          onClick={() => window.location.reload()}\n          style={{\n            padding: '10px 16px',\n            backgroundColor: 'transparent',\n            color: '#868e96',\n            border: '1px solid #dee2e6',\n            borderRadius: '6px',\n            cursor: 'pointer',\n            fontSize: '14px',\n            fontWeight: '500',\n            transition: 'all 0.2s',\n          }}\n          onMouseOver={(e) => {\n            e.currentTarget.style.backgroundColor = '#f8f9fa';\n          }}\n          onMouseOut={(e) => {\n            e.currentTarget.style.backgroundColor = 'transparent';\n          }}\n        >\n          Refresh Page\n        </button>\n      </div>\n    </div>\n  );\n};\n\n/**\n * Hook-based error boundary wrapper\n */\nexport const withErrorBoundary = <P extends object>(\n  Component: React.ComponentType<P>,\n  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>\n) => {\n  const WrappedComponent: React.FC<P> = (props) => {\n    return (\n      <ErrorBoundary {...errorBoundaryProps}>\n        <Component {...props} />\n      </ErrorBoundary>\n    );\n  };\n\n  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;\n  return WrappedComponent;\n};