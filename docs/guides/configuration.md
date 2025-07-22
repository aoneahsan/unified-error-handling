# Configuration Guide

This guide covers all configuration options available in the Unified Error Handling plugin.

## Configuration Structure

The plugin accepts a configuration object with the following structure:

```typescript
interface UnifiedErrorConfig {
  providers: ProviderConfig[];
  global?: GlobalConfig;
  features?: FeatureConfig;
  platforms?: PlatformConfig;
}
```

## Provider Configuration

### Provider Types

The plugin supports 8 different error tracking providers:

```typescript
type ProviderType = 
  | 'sentry'
  | 'firebase'
  | 'datadog'
  | 'bugsnag'
  | 'rollbar'
  | 'logrocket'
  | 'newrelic'
  | 'instabug';
```

### Basic Provider Setup

```typescript
const config = {
  providers: [
    {
      type: 'sentry',
      enabled: true,
      config: {
        dsn: 'YOUR_SENTRY_DSN',
        environment: 'production',
        release: '1.0.0'
      }
    }
  ]
};
```

### Provider-Specific Options

Each provider has its own configuration options. See the provider-specific documentation for details:

- [Sentry Configuration](../providers/sentry.md#configuration)
- [Firebase Configuration](../providers/firebase-crashlytics.md#configuration)
- [DataDog Configuration](../providers/datadog.md#configuration)
- [Bugsnag Configuration](../providers/bugsnag.md#configuration)
- [Rollbar Configuration](../providers/rollbar.md#configuration)
- [LogRocket Configuration](../providers/logrocket.md#configuration)
- [New Relic Configuration](../providers/new-relic.md#configuration)
- [Instabug Configuration](../providers/instabug.md#configuration)

## Global Configuration

Global settings apply to all providers:

```typescript
const config = {
  providers: [...],
  global: {
    // Enable in debug/development mode
    enabledInDebug: false,
    
    // Maximum breadcrumbs to store
    maxBreadcrumbs: 100,
    
    // Offline queue size
    offlineQueueSize: 50,
    
    // Retry configuration
    retryAttempts: 3,
    retryDelay: 1000, // milliseconds
    
    // Error filtering
    beforeSend: (event) => {
      // Return null to drop the event
      if (event.message?.includes('Script error')) {
        return null;
      }
      return event;
    },
    
    // Sampling rate (0-1)
    sampleRate: 1.0,
    
    // Session tracking
    sessionTracking: true,
    
    // Auto session tracking timeout
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    
    // Network capture
    captureNetwork: true,
    networkDetailMode: 'headers', // 'none', 'headers', 'full'
    
    // Console capture
    captureConsole: true,
    consoleLogLevel: 'error', // 'log', 'info', 'warn', 'error'
    
    // Global tags
    tags: {
      app_version: '1.0.0',
      environment: 'production'
    },
    
    // Global context
    context: {
      device: {
        model: 'iPhone 12',
        os: 'iOS 15.0'
      }
    }
  }
};
```

## Feature Configuration

Enable or disable specific features:

```typescript
const config = {
  providers: [...],
  features: {
    // Breadcrumb tracking
    breadcrumbs: {
      enabled: true,
      console: true,
      dom: true,
      fetch: true,
      history: true,
      sentry: false,
      xhr: true
    },
    
    // Performance monitoring
    performance: {
      enabled: true,
      tracingOrigins: ['localhost', 'myapp.com'],
      tracesSampleRate: 0.1
    },
    
    // Release health
    releaseHealth: {
      enabled: true,
      sessionTracking: true,
      autoSessionTracking: true
    },
    
    // User feedback
    userFeedback: {
      enabled: true,
      emailRequired: false,
      nameRequired: false,
      showBranding: false
    },
    
    // Attachments
    attachments: {
      enabled: true,
      screenshot: true,
      viewHierarchy: true,
      maxAttachmentSize: 20 * 1024 * 1024 // 20MB
    },
    
    // ANR detection (Application Not Responding)
    anr: {
      enabled: true,
      timeout: 5000 // 5 seconds
    }
  }
};
```

## Platform-Specific Configuration

Configure behavior per platform:

```typescript
const config = {
  providers: [...],
  platforms: {
    ios: {
      enabled: true,
      enableAutoSessionTracking: true,
      enableWatchdogTerminationTracking: true,
      enableAutoPerformanceTracking: true,
      enableNetworkTracking: true,
      enableFileIOTracking: true,
      enableUserInteractionTracing: true
    },
    android: {
      enabled: true,
      enableAnrDetection: true,
      enableAutoActivityLifecycleCallbacks: true,
      enableFragmentLifecycleCallbacks: true,
      profilingEnabled: true,
      collectAdditionalContext: true
    },
    web: {
      enabled: true,
      tunnel: undefined, // Proxy URL for avoiding ad-blockers
      transportOptions: {
        fetchParameters: {
          keepalive: true
        }
      },
      defaultIntegrations: true,
      tracingOptions: {
        trackComponents: true,
        timeout: 2000,
        hooks: true
      }
    }
  }
};
```

## Environment-Based Configuration

Configure different settings per environment:

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
const isStaging = process.env.REACT_APP_ENV === 'staging';

const config = {
  providers: [{
    type: 'sentry',
    config: {
      dsn: isDevelopment 
        ? undefined // Disable in development
        : process.env.REACT_APP_SENTRY_DSN,
      environment: isDevelopment 
        ? 'development' 
        : isStaging 
          ? 'staging' 
          : 'production',
      debug: isDevelopment,
      sampleRate: isDevelopment ? 1.0 : 0.9,
      tracesSampleRate: isDevelopment ? 1.0 : 0.1
    }
  }],
  global: {
    enabledInDebug: isDevelopment,
    maxBreadcrumbs: isDevelopment ? 200 : 100,
    captureConsole: !isDevelopment
  }
};
```

## Advanced Configuration Examples

### Multi-Provider with Different Sampling

```typescript
const config = {
  providers: [
    {
      type: 'sentry',
      config: {
        dsn: 'YOUR_SENTRY_DSN',
        sampleRate: 1.0 // Capture all errors
      }
    },
    {
      type: 'logrocket',
      config: {
        appId: 'YOUR_LOGROCKET_ID',
        shouldCaptureIP: false,
        network: {
          isEnabled: true,
          requestSanitizer: (request) => {
            // Remove auth headers
            delete request.headers['Authorization'];
            return request;
          }
        }
      }
    },
    {
      type: 'firebase',
      config: {
        crashlyticsCollectionEnabled: true,
        // Only send 10% of non-fatal errors to Firebase
        onError: (error) => Math.random() < 0.1
      }
    }
  ]
};
```

### Custom Error Filtering

```typescript
const config = {
  global: {
    beforeSend: (event) => {
      // Filter out specific errors
      const ignoredErrors = [
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'Network request failed'
      ];
      
      if (ignoredErrors.some(msg => event.message?.includes(msg))) {
        return null;
      }
      
      // Filter by error level
      if (event.level === 'debug' && !isDevelopment) {
        return null;
      }
      
      // Sanitize sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      
      if (event.user?.email) {
        event.user.email = '***@***.com';
      }
      
      return event;
    }
  }
};
```

### Performance Monitoring Setup

```typescript
const config = {
  providers: [{
    type: 'sentry',
    config: {
      dsn: 'YOUR_SENTRY_DSN',
      integrations: [
        new Sentry.BrowserTracing({
          tracingOrigins: ['localhost', 'myapp.com', /^\//],
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            React.useEffect,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes
          ),
        }),
      ],
      tracesSampleRate: 0.1,
    }
  }],
  features: {
    performance: {
      enabled: true,
      tracingOrigins: ['localhost', 'myapp.com'],
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1
    }
  }
};
```

## Configuration Validation

The plugin validates configuration on initialization:

```typescript
try {
  await UnifiedErrorHandler.initialize(config);
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Invalid configuration:', error.message);
    console.error('Validation errors:', error.validationErrors);
  }
}
```

## Runtime Configuration Updates

Some configuration can be updated at runtime:

```typescript
// Update user context
UnifiedErrorHandler.setUser({
  id: '123',
  email: 'user@example.com'
});

// Update tags
UnifiedErrorHandler.setTags({
  feature: 'checkout',
  experiment: 'new-ui'
});

// Update context
UnifiedErrorHandler.setContext('order', {
  id: 'order-123',
  total: 99.99
});

// Update sampling rate
UnifiedErrorHandler.setSampleRate(0.5);

// Enable/disable providers
UnifiedErrorHandler.setProviderEnabled('sentry', false);
```

## Next Steps

- [Provider-Specific Guides](../providers/index.md)
- [React Integration](./react-integration.md)
- [Performance Monitoring](./performance.md)
- [Error Filtering](./error-filtering.md)