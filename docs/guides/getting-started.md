# Getting Started

This guide will help you install and set up the Unified Error Handling library in your project.

## Prerequisites

- Node.js 18 or higher
- React 19 or higher (for React features - optional)

## Installation

Install the library using pnpm (recommended):

```bash
pnpm add unified-error-handling
```

Or using npm:

```bash
npm install unified-error-handling
```

Or using yarn:

```bash
yarn add unified-error-handling
```

## Basic Setup

### 1. Initialize the Library

In your app's entry point (e.g., `main.js`, `index.js`, or `App.tsx`):

```javascript
import { initialize } from 'unified-error-handling';

// Initialize with default settings
initialize();

// Or with custom configuration
initialize({
  maxBreadcrumbs: 100,
  enableGlobalHandlers: true,
  enableConsoleCapture: true,
  enableNetworkCapture: false,
  debug: false,
});
```

### 2. Choose an Adapter

Adapters send errors to your error tracking service. The library includes built-in adapters:

```javascript
import { useAdapter } from 'unified-error-handling';

// Console adapter (great for development)
await useAdapter('console');

// Sentry adapter (requires @sentry/browser)
await useAdapter('sentry', {
  dsn: 'YOUR_SENTRY_DSN',
  environment: 'production'
});

// Firebase adapter (requires firebase)
await useAdapter('firebase', {
  firebaseConfig: {
    // your firebase config
  }
});
```

### 3. Capture Your First Error

```javascript
import { captureError } from 'unified-error-handling';

try {
  // Your code that might throw an error
  riskyOperation();
} catch (error) {
  captureError(error, {
    tags: { module: 'user-auth' },
    extra: { userId: '12345' }
  });
}
```

## React Integration

### Using Hooks

```jsx
import { useErrorHandler } from 'unified-error-handling/react';

function MyComponent() {
  const handleError = useErrorHandler();

  const handleClick = async () => {
    try {
      await dangerousOperation();
    } catch (error) {
      handleError(error);
    }
  };

  return <button onClick={handleClick}>Do Something</button>;
}
```

### Using Error Boundary

```jsx
import { ErrorBoundary } from 'unified-error-handling/react';

function App() {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong!</div>}
      onError={(error, errorInfo) => {
        console.log('Error caught:', error);
      }}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

### No Provider Required!

Unlike other error handling libraries, this one uses a singleton pattern. No need to wrap your app in a provider - just call `initialize()` once and use the hooks anywhere.

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxBreadcrumbs` | number | 100 | Maximum breadcrumbs to keep |
| `enableGlobalHandlers` | boolean | true | Catch unhandled errors |
| `enableConsoleCapture` | boolean | true | Capture console.error calls |
| `enableNetworkCapture` | boolean | false | Capture failed network requests |
| `enableOfflineQueue` | boolean | true | Queue errors when offline |
| `debug` | boolean | false | Enable debug logging |
| `beforeSend` | function | null | Filter/modify errors before sending |

## Next Steps

- Learn about [Configuration](./configuration.md)
- Explore the [Core API](../api/core-api.md)
- Check out [React Hooks](../api/react-hooks.md)
- Set up [Firebase Crashlytics](../providers/firebase-crashlytics.md)

## Common Issues

### Adapter Not Loading

Make sure you've installed the required SDK:

```bash
# For Sentry
pnpm add @sentry/browser

# For Firebase
pnpm add firebase
```

### TypeScript Types Not Found

Import types from the main package:

```typescript
import type { ErrorContext, NormalizedError } from 'unified-error-handling';
```

### Errors Not Being Captured

1. Make sure `initialize()` was called
2. Check if an adapter is active with `useAdapter()`
3. Enable debug mode: `initialize({ debug: true })`
