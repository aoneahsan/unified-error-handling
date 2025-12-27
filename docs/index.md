# Unified Error Handling Documentation

Welcome to the Unified Error Handling library documentation. This library provides a unified API for multiple error handling platforms with React-first design and zero dependencies.

## Table of Contents

### Getting Started
- [Quick Start](./guides/quick-start.md)
- [Getting Started](./guides/getting-started.md)
- [Configuration](./guides/configuration.md)

### API Reference
- [Core API](./api/core-api.md)
- [React Hooks](./api/react-hooks.md)

### Provider/Adapter Guides
- [Firebase Crashlytics](./providers/firebase-crashlytics.md)

### Project Status
- [Project Status & Tracking](./project-status/PROJECT_STATUS.md)

## Key Features

- **Zero Dependencies**: Core library has no runtime dependencies
- **Dynamic Adapter Loading**: SDKs only loaded when explicitly used
- **Provider-less Architecture**: No React Context required
- **React-First Design**: Built-in React components and hooks
- **Type Safety**: Full TypeScript support with comprehensive types
- **Offline Support**: Automatic error queuing and retry
- **Universal**: Works in browsers, Node.js, React Native

## Quick Example

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

## React Example

```jsx
import { initialize, useAdapter } from 'unified-error-handling';
import { ErrorBoundary, useErrorHandler } from 'unified-error-handling/react';

// Initialize once
initialize({ enableGlobalHandlers: true });

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

// Use in any component (no provider needed!)
function MyComponent() {
  const handleError = useErrorHandler();

  const handleClick = () => {
    try {
      riskyOperation();
    } catch (error) {
      handleError(error);
    }
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

## Quick Links

- [GitHub Repository](https://github.com/aoneahsan/unified-error-handling)
- [NPM Package](https://www.npmjs.com/package/unified-error-handling)
- [Issue Tracker](https://github.com/aoneahsan/unified-error-handling/issues)
- [Changelog](https://github.com/aoneahsan/unified-error-handling/blob/main/CHANGELOG.md)

## Support

If you need help or have questions:

1. Check the documentation above
2. Search [existing issues](https://github.com/aoneahsan/unified-error-handling/issues)
3. Create a [new issue](https://github.com/aoneahsan/unified-error-handling/issues/new)
4. Contact the author at [aoneahsan@gmail.com](mailto:aoneahsan@gmail.com)
