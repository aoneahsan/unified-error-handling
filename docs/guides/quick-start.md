# Quick Start Guide

Get up and running with Unified Error Handling in minutes.

## Installation

```bash
npm install unified-error-handling
# or
yarn add unified-error-handling
```

## Basic Setup

### 1. Initialize the Plugin

```typescript
import { UnifiedErrorHandling } from 'unified-error-handling';

// Initialize with a single provider
await UnifiedErrorHandling.initialize({
  providers: [{
    type: 'firebase',
    config: {
      // Configuration is optional - uses Firebase config from capacitor-firebase-kit
    }
  }]
});
```

### 2. React Integration

Wrap your app with the Error Provider:

```tsx
import { ReactErrorProvider } from 'unified-error-handling';

function App() {
  return (
    <ReactErrorProvider>
      <YourApp />
    </ReactErrorProvider>
  );
}
```

### 3. Use Error Handling Hooks

```tsx
import { useErrorHandler } from 'unified-error-handling';

function MyComponent() {
  const { logError, logMessage } = useErrorHandler();

  const handleClick = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      logError(error, {
        context: { component: 'MyComponent', action: 'handleClick' }
      });
    }
  };

  return <button onClick={handleClick}>Perform Action</button>;
}
```

## Examples

### Basic Error Logging

```typescript
import { UnifiedErrorHandling } from 'unified-error-handling';

// Log an error
try {
  await someOperation();
} catch (error) {
  await UnifiedErrorHandling.logError(error);
}

// Log a message
await UnifiedErrorHandling.logMessage('User completed onboarding', 'info');
```

### Using Error Boundaries

```tsx
import { ErrorBoundary } from 'unified-error-handling';

function App() {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong!</div>}
      onError={(error, errorInfo) => console.log('Error caught:', error)}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

### Setting User Context

```typescript
// Set user context for error tracking
await UnifiedErrorHandling.setUserContext({
  id: 'user123',
  email: 'user@example.com',
  username: 'johndoe',
  attributes: {
    subscription: 'premium',
    role: 'admin'
  }
});
```

### Adding Breadcrumbs

```typescript
// Add breadcrumbs for better error context
await UnifiedErrorHandling.addBreadcrumb({
  message: 'User clicked checkout',
  category: 'user-action',
  level: 'info',
  data: {
    cartTotal: 99.99,
    itemCount: 3
  }
});
```

## Multiple Providers

Use multiple providers simultaneously:

```typescript
await UnifiedErrorHandling.initialize({
  providers: [
    {
      type: 'firebase',
      config: {}
    },
    {
      type: 'sentry',
      config: {
        dsn: 'your-sentry-dsn',
        environment: 'production'
      }
    }
  ],
  // Optional: Set primary provider
  primaryProvider: 'sentry'
});
```

## Configuration Options

```typescript
await UnifiedErrorHandling.initialize({
  providers: [...],
  
  // Global configuration
  enableInDevelopment: true,
  enableOfflineQueue: true,
  maxBreadcrumbs: 100,
  
  // Error filtering
  beforeSend: (error) => {
    // Filter or modify errors before sending
    if (error.message?.includes('Network')) {
      return null; // Don't send network errors
    }
    return error;
  },
  
  // Performance monitoring
  enablePerformanceMonitoring: true,
  tracingOptions: {
    routingInstrumentation: true,
    trackComponents: true
  }
});
```

## Platform-Specific Setup

### iOS
```bash
cd ios && pod install
```

### Android
No additional setup required.

### Web
The plugin works out of the box on web platforms.

## Next Steps

- Read the [Configuration Guide](./configuration.md) for detailed options
- Learn about [React Integration](./react-integration.md)
- Explore [Provider-Specific Features](../providers/index.md)
- Check out [Examples](../examples/index.md)