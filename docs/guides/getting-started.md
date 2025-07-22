# Getting Started

This guide will help you install and set up the Unified Error Handling plugin in your Capacitor project.

## Prerequisites

- Capacitor 5.0 or higher
- Node.js 18 or higher
- React 18 or higher (for React features)
- iOS 13+ / Android 5.0+ (API 21+)

## Installation

Install the plugin using yarn:

```bash
yarn add unified-error-handling
```

Or using npm:

```bash
npm install unified-error-handling
```

### Platform-Specific Setup

#### iOS Setup

1. Install the iOS platform:
```bash
npx cap add ios
```

2. Update your `Info.plist` with required permissions:
```xml
<key>NSUserTrackingUsageDescription</key>
<string>This app uses error tracking to improve user experience</string>
```

3. Sync the project:
```bash
npx cap sync ios
```

#### Android Setup

1. Install the Android platform:
```bash
npx cap add android
```

2. Add required permissions in `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

3. Sync the project:
```bash
npx cap sync android
```

## Basic Configuration

### 1. Initialize the Plugin

In your app's entry point (e.g., `App.tsx` or `index.js`):

```typescript
import { UnifiedErrorHandler } from 'unified-error-handling';

// Initialize with a single provider
await UnifiedErrorHandler.initialize({
  providers: [{
    type: 'sentry',
    config: {
      dsn: 'YOUR_SENTRY_DSN',
      environment: 'production'
    }
  }]
});
```

### 2. React Integration (Optional)

Wrap your app with the error handling provider:

```tsx
import { ErrorHandlerProvider } from 'unified-error-handling/react';

function App() {
  return (
    <ErrorHandlerProvider>
      <YourAppContent />
    </ErrorHandlerProvider>
  );
}
```

### 3. Capture Your First Error

```typescript
import { UnifiedErrorHandler } from 'unified-error-handling';

try {
  // Your code that might throw an error
  riskyOperation();
} catch (error) {
  await UnifiedErrorHandler.captureException(error, {
    level: 'error',
    tags: { module: 'user-auth' }
  });
}
```

## Configuration Options

### Provider Configuration

Each provider can be configured with specific options:

```typescript
const config = {
  providers: [
    {
      type: 'sentry',
      config: {
        dsn: 'YOUR_DSN',
        environment: 'production',
        sampleRate: 0.9,
        tracesSampleRate: 0.1
      }
    },
    {
      type: 'firebase',
      config: {
        crashlyticsCollectionEnabled: true,
        projectPrefix: 'myapp_'
      }
    }
  ],
  global: {
    enabledInDebug: false,
    maxBreadcrumbs: 100,
    beforeSend: (event) => {
      // Filter or modify events before sending
      return event;
    }
  }
};
```

### Global Options

- `enabledInDebug`: Enable error tracking in debug mode (default: `false`)
- `maxBreadcrumbs`: Maximum number of breadcrumbs to store (default: `100`)
- `beforeSend`: Function to filter or modify events before sending
- `offlineQueueSize`: Maximum number of errors to queue offline (default: `50`)
- `retryAttempts`: Number of retry attempts for failed submissions (default: `3`)

## Next Steps

- Learn about [React Integration](./react-integration.md)
- Explore [Provider-Specific Features](../providers/index.md)
- See [Code Examples](../examples/basic-usage.md)
- Configure [Advanced Features](./configuration.md)

## Common Issues

### Plugin Not Loading

If the plugin doesn't load, ensure you've run:
```bash
npx cap sync
```

### Provider Not Initialized

Make sure to await the initialization:
```typescript
await UnifiedErrorHandler.initialize(config);
```

### TypeScript Types Not Found

Import types from the main package:
```typescript
import type { ErrorEvent, ErrorLevel } from 'unified-error-handling';
```

For more troubleshooting, see our [Troubleshooting Guide](./troubleshooting.md).