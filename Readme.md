# Unified Error Handling

📚 **[Documentation](./docs/index.md)** | 🚀 **[Quick Start](./docs/guides/quick-start.md)** | 🔧 **[API Reference](./docs/api/core-api.md)** | 🎯 **[Examples](./docs/examples/index.md)**

[![npm version](https://img.shields.io/npm/v/unified-error-handling.svg)](https://www.npmjs.com/package/unified-error-handling)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A comprehensive Capacitor plugin providing a unified API for multiple error handling platforms with React-first design, minimal configuration, and seamless provider switching.

## ✨ Features

- 🔌 **Unified API** - Single interface for 8+ error tracking services
- ⚛️ **React-First Design** - Built-in hooks, error boundaries, and HOCs
- 🎯 **Zero Configuration** - Works out of the box with sensible defaults
- 🔄 **Provider Flexibility** - Switch between providers without code changes
- 📱 **Cross-Platform** - Full support for iOS, Android, and Web
- 🔒 **Type Safety** - Complete TypeScript support with comprehensive types
- 🌐 **Offline Support** - Automatic error queuing and retry
- 📊 **Performance Monitoring** - Built-in performance tracking
- 🎨 **Customizable** - Extensive configuration options for all providers
- 🔧 **Developer Friendly** - Excellent DX with helpful error messages

## 🏢 Supported Error Handling Providers

| Provider | Web | iOS | Android | Performance | Session Replay |
|----------|:---:|:---:|:-------:|:-----------:|:--------------:|
| Firebase Crashlytics | ❌ | ✅ | ✅ | ✅ | ❌ |
| Sentry | ✅ | ✅ | ✅ | ✅ | ✅ |
| DataDog | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bugsnag | ✅ | ✅ | ✅ | ✅ | ❌ |
| Rollbar | ✅ | ✅ | ✅ | ❌ | ❌ |
| LogRocket | ✅ | ✅ | ✅ | ✅ | ✅ |
| Raygun | ✅ | ✅ | ✅ | ✅ | ❌ |
| AppCenter | ❌ | ✅ | ✅ | ❌ | ❌ |

## 📦 Installation

```bash
# Using npm
npm install unified-error-handling

# Using yarn
yarn add unified-error-handling

# Using pnpm
pnpm add unified-error-handling
```

### Platform Setup

For iOS, add to your `Info.plist`:
```xml
<key>NSUserTrackingUsageDescription</key>
<string>This app uses error tracking to improve app stability</string>
```

For Android, the plugin automatically handles permissions.

## 🚀 Quick Start

### 1. Initialize the Plugin

```typescript
import { ErrorHandler } from 'unified-error-handling';

// Initialize with your preferred provider
await ErrorHandler.initialize({
  provider: 'sentry',
  apiKey: 'your-api-key',
  environment: 'production',
  debug: false
});
```

### 2. React Integration

```tsx
import { ErrorProvider, ErrorBoundary } from 'unified-error-handling/react';

// Wrap your app with ErrorProvider
function App() {
  return (
    <ErrorProvider config={{
      provider: 'sentry',
      apiKey: 'your-api-key'
    }}>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <YourApp />
      </ErrorBoundary>
    </ErrorProvider>
  );
}
```

### 3. Use Error Handling Hooks

```tsx
import { useErrorHandler } from 'unified-error-handling/react';

function MyComponent() {
  const { logError, addBreadcrumb } = useErrorHandler();

  const handleClick = async () => {
    try {
      addBreadcrumb({
        message: 'User clicked button',
        category: 'ui'
      });
      
      await riskyOperation();
    } catch (error) {
      logError(error, {
        context: { component: 'MyComponent' }
      });
    }
  };

  return <button onClick={handleClick}>Click Me</button>;
}
```

### 4. Manual Error Logging

```typescript
import { ErrorHandler } from 'unified-error-handling';

// Log an error
ErrorHandler.logError(new Error('Something went wrong'), {
  level: 'error',
  tags: { feature: 'checkout' },
  context: { userId: '123' }
});

// Log a message
ErrorHandler.logMessage('Payment processed', 'info');

// Add breadcrumbs
ErrorHandler.addBreadcrumb({
  message: 'User navigated to checkout',
  category: 'navigation',
  level: 'info'
});
```

## Architecture Design

### Core Structure

```
unified-error-handling/
├── src/
│   ├── index.ts                    # Main entry point
│   ├── definitions.ts              # TypeScript definitions
│   ├── web.ts                      # Web implementation
│   ├── plugin.ts                   # Core plugin logic
│   ├── providers/
│   │   ├── base.provider.ts        # Abstract base provider
│   │   ├── firebase/
│   │   │   ├── firebase.provider.ts
│   │   │   └── firebase.types.ts
│   │   ├── sentry/
│   │   │   ├── sentry.provider.ts
│   │   │   └── sentry.types.ts
│   │   ├── datadog/
│   │   │   ├── datadog.provider.ts
│   │   │   └── datadog.types.ts
│   │   ├── bugsnag/
│   │   ├── rollbar/
│   │   ├── logrocket/
│   │   ├── raygun/
│   │   └── appcenter/
│   ├── react/
│   │   ├── provider.tsx            # React Context Provider
│   │   ├── hoc.tsx                # Higher-Order Components
│   │   ├── hooks.ts               # React Hooks
│   │   ├── error-boundary.tsx     # Error Boundary Component
│   │   └── index.ts
│   ├── utils/
│   │   ├── error-normalizer.ts    # Error normalization
│   │   ├── breadcrumb-manager.ts  # Breadcrumb tracking
│   │   ├── context-manager.ts     # Context management
│   │   ├── network-monitor.ts     # Network state tracking
│   │   └── storage.ts             # Offline storage
│   ├── native/
│   │   ├── bridge.ts              # Native bridge interface
│   │   └── platform-detector.ts   # Platform detection
│   └── types/
│       ├── errors.ts              # Error type definitions
│       ├── config.ts              # Configuration types
│       └── providers.ts           # Provider interfaces
├── android/
│   └── src/main/java/.../         # Android implementation
├── ios/
│   └── Plugin/                    # iOS implementation
├── scripts/
│   ├── setup.ts                   # NPX setup script
│   ├── doctor.ts                  # Diagnostic tool
│   └── migrate.ts                 # Migration helper
├── examples/
│   ├── basic/                     # Basic usage example
│   ├── advanced/                  # Advanced features
│   └── multi-provider/            # Multi-provider setup
└── package.json
```

## Development Phases

### Phase 1: Core Infrastructure (Week 1)
- [x] Project setup with TypeScript, ESLint, Prettier
- [x] Define core interfaces and types
- [x] Implement base provider abstract class
- [x] Create error normalization system
- [x] Setup build pipeline for multi-platform
- [x] Implement platform detection utilities

### Phase 2: Provider Implementations (Week 2-4)
- [ ] Firebase Crashlytics integration (using capacitor-firebase-kit)
- [ ] Sentry provider implementation
- [ ] DataDog RUM provider
- [ ] Bugsnag provider
- [ ] Rollbar provider
- [ ] LogRocket provider
- [ ] Raygun provider
- [ ] AppCenter provider

### Phase 3: React Integration (Week 5)
- [ ] Error Boundary component with provider integration
- [ ] React Context Provider for global error handling
- [ ] HOC for component-level error handling
- [ ] Custom hooks (useErrorHandler, useErrorContext, useBreadcrumb)
- [ ] TypeScript declarations for all React components

### Phase 4: Advanced Features (Week 6)
- [ ] Breadcrumb management system
- [ ] Context enrichment (user, device, app info)
- [ ] Network state monitoring
- [ ] Offline error queue with retry logic
- [ ] Custom error filtering and transformation
- [ ] Performance monitoring integration

### Phase 5: Developer Experience (Week 7)
- [ ] NPX setup script with interactive configuration
- [ ] Automatic provider detection
- [ ] Migration utilities from direct SDK usage
- [ ] Doctor command for troubleshooting
- [ ] VSCode snippets and IntelliSense

### Phase 6: Testing & Documentation (Week 8)
- [ ] Unit tests for all providers
- [ ] Integration tests
- [ ] E2E tests with example apps
- [ ] API documentation
- [ ] Setup guides for each provider
- [ ] Migration guides
- [ ] Best practices documentation

## Key Features

### 1. Unified Error API
```typescript
// Same API regardless of provider
ErrorHandler.logError(error, {
  level: 'error',
  context: { userId: '123', action: 'checkout' },
  tags: { feature: 'payment' }
});
```

### 2. Zero-Config Setup
```bash
npx unified-error-handling init --provider sentry
```

### 3. React Integration
```tsx
// Provider wrapper
<ErrorProvider config={config}>
  <App />
</ErrorProvider>

// HOC
export default withErrorHandler(MyComponent);

// Hooks
const { logError, addBreadcrumb } = useErrorHandler();
```

### 4. Smart Error Boundary
```tsx
<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error, errorInfo) => console.log(error)}
  level="warning"
>
  <RiskyComponent />
</ErrorBoundary>
```

### 5. Provider Switching
```typescript
// Switch providers without code changes
await ErrorHandler.switchProvider('sentry', sentryConfig);
```

### 6. Advanced Context Management
```typescript
// Automatic context enrichment
ErrorHandler.setUserContext({ id: '123', email: 'user@example.com' });
ErrorHandler.setTags({ version: '2.0.0', environment: 'production' });
ErrorHandler.addBreadcrumb({
  message: 'User clicked checkout',
  category: 'ui',
  level: 'info'
});
```

## Technical Specifications

### Core Interfaces

```typescript
interface ErrorProvider {
  name: string;
  initialize(config: ProviderConfig): Promise<void>;
  logError(error: NormalizedError): Promise<void>;
  logMessage(message: string, level: ErrorLevel): Promise<void>;
  setUser(user: UserContext): Promise<void>;
  setContext(key: string, context: any): Promise<void>;
  addBreadcrumb(breadcrumb: Breadcrumb): Promise<void>;
  flush(): Promise<void>;
  destroy(): Promise<void>;
}

interface UnifiedErrorConfig {
  provider: ErrorProviderType;
  apiKey?: string;
  debug?: boolean;
  environment?: string;
  beforeSend?: (error: NormalizedError) => NormalizedError | null;
  ignoreErrors?: (string | RegExp)[];
  sampleRate?: number;
  maxBreadcrumbs?: number;
  networkTracking?: boolean;
  consoleTracking?: boolean;
  autoSessionTracking?: boolean;
}
```

### React Components

```typescript
// Error Provider Props
interface ErrorProviderProps {
  config: UnifiedErrorConfig;
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

// Hook Returns
interface UseErrorHandler {
  logError: (error: Error | string, context?: ErrorContext) => void;
  logMessage: (message: string, level?: ErrorLevel) => void;
  addBreadcrumb: (breadcrumb: Breadcrumb) => void;
  setUser: (user: UserContext) => void;
  setContext: (key: string, value: any) => void;
  clearUser: () => void;
}
```

## Implementation Strategy

### 1. Provider Abstraction
- Single interface for all providers
- Provider-specific adapters
- Lazy loading of provider SDKs
- Graceful fallbacks

### 2. Error Normalization
- Consistent error format across providers
- Stack trace parsing
- Source map support
- Error grouping logic

### 3. Performance Optimization
- Minimal bundle size impact
- Tree-shaking support
- Lazy provider initialization
- Batched error reporting

### 4. Security Considerations
- API key encryption
- PII scrubbing
- Secure transmission
- GDPR compliance helpers

## Quality Assurance

### Testing Strategy
- Unit tests: 90%+ coverage
- Integration tests per provider
- React component testing
- Cross-platform E2E tests
- Performance benchmarks

### Code Quality
- TypeScript strict mode
- ESLint with custom rules
- Prettier formatting
- Husky pre-commit hooks
- Automated dependency updates

### Documentation Standards
- TSDoc for all public APIs
- Interactive examples
- Video tutorials
- Provider comparison matrix
- Troubleshooting guides

## NPX Setup Script Features

```bash
npx unified-error-handling init
```

- Interactive provider selection
- Automatic dependency installation
- Platform-specific setup (iOS/Android)
- Environment detection
- Config file generation
- Git hooks setup
- VS Code settings

## Migration Support

### From Direct SDK Usage
- Automated code migration tools
- Side-by-side comparison
- Gradual migration path
- Backward compatibility mode

### Provider Switching
- Configuration migration
- Data export/import
- Feature parity mapping
- Testing utilities

## Success Metrics

- **Setup Time**: < 5 minutes from install to first error
- **Bundle Size**: < 25KB per provider (gzipped)
- **Performance**: < 1ms error logging overhead
- **Type Safety**: 100% TypeScript coverage
- **Documentation**: 100% API coverage
- **Provider Support**: 8 major platforms

## Release Timeline

- **Week 1-2**: Core infrastructure
- **Week 3-4**: Provider implementations
- **Week 5**: React integration
- **Week 6**: Advanced features
- **Week 7**: Developer experience
- **Week 8**: Testing & documentation
- **Week 9**: Beta release
- **Week 10**: Production release

## Post-Launch Roadmap

1. **v1.1**: Performance monitoring integration
2. **v1.2**: Custom provider support
3. **v1.3**: Advanced debugging tools
4. **v1.4**: AI-powered error insights
5. **v2.0**: Real-time error analytics dashboard