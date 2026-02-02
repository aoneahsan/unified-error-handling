# AI Integration Guide - unified-error-handling

Quick reference for AI development agents (Claude Code, Cursor, Copilot, etc.) to integrate unified-error-handling into projects.

## Installation

```bash
yarn add unified-error-handling
# or
npm install unified-error-handling
```

## Core Concepts

unified-error-handling provides:
- **Zero Dependencies** - Core library has no dependencies
- **Dynamic Adapter Loading** - Load SDKs on demand
- **Multi-Platform Support** - Sentry, Firebase Crashlytics, Bugsnag, DataDog, etc.
- **Provider-less Architecture** - No Context needed

## Quick Start

### Basic Usage

```typescript
import { initialize, captureError, captureMessage, useAdapter } from 'unified-error-handling';

// Initialize once at app start
initialize({
  enableGlobalHandlers: true,  // Catch unhandled errors
  enableConsoleCapture: true,  // Capture console.error
});

// Enable console adapter (built-in)
await useAdapter('console');

// Capture errors
try {
  throw new Error('Something went wrong!');
} catch (error) {
  captureError(error);
}

// Capture messages
captureMessage('User completed checkout', 'info');
```

### With Sentry

```typescript
import { initialize, useAdapter } from 'unified-error-handling';

initialize({ enableGlobalHandlers: true });

await useAdapter('sentry', {
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: 'my-app@1.0.0',
});
```

### With Firebase Crashlytics

```typescript
import { initialize, useAdapter } from 'unified-error-handling';
import { initializeApp } from 'firebase/app';

const firebaseApp = initializeApp(firebaseConfig);

initialize({ enableGlobalHandlers: true });

await useAdapter('firebase', {
  app: firebaseApp,
});
```

### Multiple Adapters

```typescript
// Use multiple error tracking services simultaneously
await useAdapter('console');
await useAdapter('sentry', { dsn: '...' });
await useAdapter('firebase', { app: firebaseApp });

// All adapters receive errors
captureError(error); // Sent to console, Sentry, AND Firebase
```

## React Integration

```tsx
import { initialize, useAdapter, captureError } from 'unified-error-handling';
import { ErrorBoundary, useErrorHandler } from 'unified-error-handling/react';

// Initialize once
initialize({ enableGlobalHandlers: true });

function App() {
  useEffect(() => {
    useAdapter('sentry', { dsn: '...' });
  }, []);

  return (
    <ErrorBoundary fallback={<ErrorPage />}>
      <MyApp />
    </ErrorBoundary>
  );
}

// In components
function MyComponent() {
  const { captureError, setUser } = useErrorHandler();

  const handleClick = async () => {
    try {
      await riskyOperation();
    } catch (error) {
      captureError(error, { context: 'button_click' });
    }
  };

  return <button onClick={handleClick}>Do Something</button>;
}
```

## API Reference

### Core Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `initialize(config)` | Initialize error handling | `void` |
| `captureError(error, context?)` | Capture and report error | `void` |
| `captureMessage(message, level?)` | Capture a log message | `void` |
| `setUser(user)` | Set user context | `void` |
| `setContext(key, value)` | Set custom context | `void` |
| `addBreadcrumb(breadcrumb)` | Add breadcrumb trail | `void` |
| `clearBreadcrumbs()` | Clear all breadcrumbs | `void` |
| `useAdapter(name, config?)` | Enable an adapter | `Promise<void>` |
| `removeAdapter(name)` | Disable an adapter | `void` |
| `flush()` | Flush pending errors | `Promise<void>` |
| `reset()` | Reset all state | `void` |
| `subscribe(listener)` | Subscribe to errors | `() => void` |

### Configuration

```typescript
interface ErrorStoreConfig {
  enableGlobalHandlers?: boolean;    // Catch window.onerror
  enableConsoleCapture?: boolean;    // Capture console.error
  enableNetworkCapture?: boolean;    // Capture fetch errors
  maxBreadcrumbs?: number;           // Max breadcrumb count (default: 100)
  beforeSend?: (error) => error;     // Transform before send
  sampleRate?: number;               // Error sampling (0-1)
}
```

### User Context

```typescript
import { setUser } from 'unified-error-handling';

setUser({
  id: 'user-123',
  email: 'user@example.com',
  username: 'johndoe',
  // Custom properties allowed
  subscription: 'premium',
});
```

### Breadcrumbs

```typescript
import { addBreadcrumb } from 'unified-error-handling';

addBreadcrumb({
  type: 'navigation',
  category: 'route',
  message: 'User navigated to /dashboard',
  level: 'info',
  data: { from: '/home', to: '/dashboard' },
});

addBreadcrumb({
  type: 'user',
  category: 'click',
  message: 'User clicked submit button',
  level: 'info',
});
```

### Custom Adapters

```typescript
import { createAdapter, registerAdapter } from 'unified-error-handling';

// Simple custom adapter
createAdapter('my-backend', {
  onError: async (error, context) => {
    await fetch('/api/errors', {
      method: 'POST',
      body: JSON.stringify({ error, context }),
    });
  },
  onMessage: async (message, level) => {
    console.log(`[${level}] ${message}`);
  },
});

// Or create a full adapter class
import { CustomAdapter } from 'unified-error-handling';

class MyAdapter extends CustomAdapter {
  async captureError(error, context) {
    // Custom implementation
  }
}

registerAdapter('my-adapter', new MyAdapter());
```

## Built-in Adapters

| Adapter | Service | Config Required |
|---------|---------|-----------------|
| `console` | Console logging | None |
| `sentry` | Sentry | `{ dsn: string }` |
| `firebase` | Firebase Crashlytics | `{ app: FirebaseApp }` |
| `bugsnag` | Bugsnag | `{ apiKey: string }` |
| `datadog` | DataDog RUM | `{ clientToken: string, applicationId: string }` |
| `logrocket` | LogRocket | `{ appId: string }` |
| `rollbar` | Rollbar | `{ accessToken: string }` |

## React Hooks

```typescript
import { useErrorHandler, useErrorBoundary } from 'unified-error-handling/react';

// Main hook
const {
  captureError,
  captureMessage,
  setUser,
  setContext,
  addBreadcrumb,
} = useErrorHandler();

// Error boundary hook
const { error, resetError } = useErrorBoundary();
```

## Common Patterns

### Initialize in App Entry

```typescript
// src/main.tsx
import { initialize, useAdapter } from 'unified-error-handling';

initialize({
  enableGlobalHandlers: true,
  enableConsoleCapture: import.meta.env.PROD,
  maxBreadcrumbs: 50,
});

if (import.meta.env.VITE_SENTRY_DSN) {
  useAdapter('sentry', {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
  });
}
```

### Error Boundary Wrapper

```tsx
import { ErrorBoundary } from 'unified-error-handling/react';

function App() {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div>
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button onClick={resetError}>Try Again</button>
        </div>
      )}
    >
      <MyApp />
    </ErrorBoundary>
  );
}
```

### API Error Handler

```typescript
import { captureError, addBreadcrumb } from 'unified-error-handling';

async function apiRequest(url: string, options?: RequestInit) {
  addBreadcrumb({
    type: 'http',
    category: 'fetch',
    message: `${options?.method || 'GET'} ${url}`,
  });

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    captureError(error, { url, method: options?.method });
    throw error;
  }
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Errors not appearing | Check adapter is initialized with `useAdapter()` |
| Sentry not receiving | Verify DSN is correct, check network tab |
| Duplicate errors | Ensure `initialize()` is called only once |
| Missing context | Call `setUser()` after user authenticates |

## Links

- [Full Documentation](./Readme.md)
- [Changelog](./CHANGELOG.md)
- [GitHub](https://github.com/aoneahsan/unified-error-handling)
