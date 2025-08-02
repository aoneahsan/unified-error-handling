# Unified Error Handling

[![npm version](https://img.shields.io/npm/v/unified-error-handling.svg)](https://www.npmjs.com/package/unified-error-handling)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/unified-error-handling)](https://bundlephobia.com/package/unified-error-handling)

A lightweight, zero-dependency error handling library with dynamic adapter loading for multiple error tracking services. Works everywhere - browsers, Node.js, React, and more.

## Features

- 🚀 **Zero Dependencies** - Core library has no dependencies
- 🔌 **Dynamic Adapter Loading** - Only load SDKs when you use them
- 🎯 **Provider-less Architecture** - No React Context required, works in any component
- 📦 **Tree-shakeable** - Only bundle what you use
- 🔧 **Framework Agnostic** - Works with React, Vue, Angular, or vanilla JS
- 🌐 **Universal** - Works in browsers, Node.js, React Native
- 🎨 **Customizable** - Create your own adapters easily
- 📊 **Rich Context** - Automatic breadcrumbs, user context, and device info
- 🔄 **Offline Support** - Queue errors when offline, send when back online
- 🛡️ **Type Safe** - Full TypeScript support

## Installation

```bash
npm install unified-error-handling
# or
yarn add unified-error-handling
# or
pnpm add unified-error-handling
```

## Quick Start

### Basic Usage (Vanilla JavaScript)

```javascript
import { initialize, captureError, useAdapter } from 'unified-error-handling';

// Initialize the error store
initialize({
  enableGlobalHandlers: true,
  enableConsoleCapture: true
});

// Use the built-in console adapter
await useAdapter('console');

// Capture errors
try {
  throw new Error('Something went wrong!');
} catch (error) {
  captureError(error);
}
```

### React Usage

```jsx
import { initialize, useAdapter } from 'unified-error-handling';
import { ErrorBoundary, useErrorHandler } from 'unified-error-handling/react';

// Initialize once in your app
initialize({ enableGlobalHandlers: true });

// In your App component
function App() {
  useEffect(() => {
    useAdapter('sentry', { dsn: 'your-sentry-dsn' });
  }, []);

  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}

// In any component (no provider needed!)
function MyComponent() {
  const handleError = useErrorHandler();

  const handleClick = () => {
    try {
      // risky operation
    } catch (error) {
      handleError(error);
    }
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

## Supported Adapters

### Built-in Adapters

- **console** - Logs errors to console (great for development)
- **sentry** - Sentry error tracking (requires `@sentry/browser`)
- **firebase** - Firebase Crashlytics (requires `firebase`)

### Using Adapters

Adapters are loaded dynamically when you use them. The required SDKs are not bundled with this library.

```javascript
// Sentry adapter
await useAdapter('sentry', {
  dsn: 'your-sentry-dsn',
  environment: 'production'
});

// Firebase adapter
await useAdapter('firebase', {
  firebaseConfig: {
    // your firebase config
  }
});

// Multiple adapters (last one wins)
await useAdapter('console'); // for development
await useAdapter('sentry', config); // switches to Sentry
```

## Creating Custom Adapters

```javascript
import { createAdapter } from 'unified-error-handling';

createAdapter('my-service', {
  async initialize(config) {
    // Setup your service
  },
  
  async send(error, context) {
    // Send error to your service
    await fetch('https://my-api.com/errors', {
      method: 'POST',
      body: JSON.stringify({ error, context })
    });
  }
});

// Use your custom adapter
await useAdapter('my-service', { apiKey: 'secret' });
```

## API Reference

### Core Functions

#### `initialize(config)`
Initialize the error store with configuration.

```javascript
initialize({
  maxBreadcrumbs: 100,        // Maximum breadcrumbs to keep
  enableGlobalHandlers: true,  // Catch unhandled errors
  enableConsoleCapture: true,  // Capture console.error
  enableNetworkCapture: true,  // Capture failed network requests
  beforeSend: (error) => {     // Filter or modify errors
    if (error.message.includes('ignore')) {
      return null; // Don't send
    }
    return error;
  }
});
```

#### `captureError(error, context?)`
Capture an error with optional context.

```javascript
captureError(new Error('Oops!'), {
  tags: { feature: 'checkout' },
  extra: { orderId: '12345' }
});
```

#### `captureMessage(message, level?)`
Capture a message.

```javascript
captureMessage('User completed onboarding', 'info');
```

#### `setUser(user)`
Set user context.

```javascript
setUser({
  id: '12345',
  email: 'user@example.com',
  plan: 'premium'
});
```

#### `addBreadcrumb(breadcrumb)`
Add a breadcrumb.

```javascript
addBreadcrumb({
  message: 'User clicked button',
  category: 'ui',
  level: 'info',
  data: { buttonId: 'submit' }
});
```

### React Hooks

#### `useErrorHandler()`
Returns a function to capture errors.

```javascript
const handleError = useErrorHandler();
handleError(error);
```

#### `useErrorStore()`
Access the full error store.

```javascript
const { setUser, addBreadcrumb } = useErrorStore();
```

#### `useAsyncOperation()`
Handle async operations with automatic error capture.

```javascript
const { data, loading, error, execute } = useAsyncOperation(
  async () => fetch('/api/data'),
  [dependency]
);
```

## Advanced Features

### Offline Support
Errors are automatically queued when offline and sent when connection is restored.

### Error Enrichment
Errors are automatically enriched with:
- Device information
- Browser/environment details
- Stack trace parsing
- Fingerprinting for grouping
- Timestamp and context

### Console & Network Capture
When enabled, automatically captures:
- `console.error` calls
- Failed network requests (fetch & XHR)
- Unhandled promise rejections
- Global errors

## TypeScript Support

Full TypeScript support with type definitions included.

```typescript
import { ErrorContext, NormalizedError } from 'unified-error-handling';

const context: ErrorContext = {
  user: { id: '123' },
  tags: { version: '1.0.0' }
};
```

## Bundle Size

- Core: ~10KB minified
- React integration: ~5KB minified
- Zero dependencies in production

## Migration Guide

### From Capacitor Plugin

```javascript
// Before (Capacitor plugin)
import { UnifiedErrorHandling } from 'capacitor-unified-error-handling';
await UnifiedErrorHandling.initialize({ provider: 'sentry' });

// After (New library)
import { initialize, useAdapter } from 'unified-error-handling';
initialize();
await useAdapter('sentry', config);
```

### From React Context

```javascript
// Before (Context-based)
<ErrorProvider>
  <App />
</ErrorProvider>

// After (No provider needed!)
// Just initialize once
initialize();

// Use anywhere
const handleError = useErrorHandler();
```

## License

MIT © Ahsan Mahmood

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## Support

- 📧 Email: aoneahsan@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/aoneahsan/unified-error-handling/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/aoneahsan/unified-error-handling/discussions)