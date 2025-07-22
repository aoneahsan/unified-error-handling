# Core API Reference

## UnifiedErrorHandling

The main class for interacting with the error handling plugin.

### Methods

#### initialize(config: UnifiedErrorConfig): Promise<void>

Initialize the error handling plugin with configuration.

```typescript
await UnifiedErrorHandling.initialize({
  providers: [{
    type: 'firebase',
    config: {
      // Provider-specific configuration
    }
  }],
  enableInDevelopment: true,
  enableOfflineQueue: true,
  maxBreadcrumbs: 100,
  beforeSend: (error) => error,
  errorFilter: (error) => true,
  errorTransformer: (error) => error,
  enablePerformanceMonitoring: true,
  primaryProvider: 'firebase'
});
```

**Parameters:**
- `config` (UnifiedErrorConfig): Configuration object with the following properties:
  - `providers` (ProviderConfig[]): Array of provider configurations
  - `enableInDevelopment` (boolean): Enable in development mode (default: false)
  - `enableOfflineQueue` (boolean): Queue errors when offline (default: true)
  - `maxBreadcrumbs` (number): Maximum breadcrumbs to store (default: 50)
  - `beforeSend` (function): Transform errors before sending
  - `errorFilter` (function): Filter which errors to send
  - `errorTransformer` (function): Transform error data
  - `enablePerformanceMonitoring` (boolean): Enable performance tracking
  - `primaryProvider` (string): Primary provider to use

#### logError(error: Error | string, options?: ErrorOptions): Promise<void>

Log an error to all active providers.

```typescript
try {
  await riskyOperation();
} catch (error) {
  await UnifiedErrorHandling.logError(error, {
    level: 'error',
    tags: { module: 'payment' },
    context: { orderId: '12345' },
    fingerprint: ['payment-error'],
    handled: true
  });
}
```

**Parameters:**
- `error` (Error | string): The error to log
- `options` (ErrorOptions): Optional error configuration
  - `level` (ErrorLevel): 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  - `tags` (Record<string, string>): Tags to attach
  - `context` (Record<string, any>): Additional context
  - `fingerprint` (string[]): Error grouping fingerprint
  - `handled` (boolean): Whether error was handled

#### logMessage(message: string, level?: ErrorLevel): Promise<void>

Log a message to all active providers.

```typescript
await UnifiedErrorHandling.logMessage('User completed checkout', 'info');
```

**Parameters:**
- `message` (string): Message to log
- `level` (ErrorLevel): Message level (default: 'info')

#### setUserContext(user: UserContext | null): Promise<void>

Set or clear the current user context.

```typescript
// Set user context
await UnifiedErrorHandling.setUserContext({
  id: 'user123',
  email: 'user@example.com',
  username: 'johndoe',
  ipAddress: '192.168.1.1',
  attributes: {
    subscription: 'premium',
    role: 'admin',
    company: 'ACME Corp'
  }
});

// Clear user context
await UnifiedErrorHandling.setUserContext(null);
```

**Parameters:**
- `user` (UserContext | null): User information or null to clear

#### addBreadcrumb(breadcrumb: Breadcrumb): Promise<void>

Add a breadcrumb for error context.

```typescript
await UnifiedErrorHandling.addBreadcrumb({
  message: 'User navigated to checkout',
  category: 'navigation',
  level: 'info',
  timestamp: Date.now(),
  type: 'navigation',
  data: {
    from: '/cart',
    to: '/checkout',
    cartValue: 99.99
  }
});
```

**Parameters:**
- `breadcrumb` (Breadcrumb): Breadcrumb information
  - `message` (string): Breadcrumb message
  - `category` (string): Category for grouping
  - `level` (ErrorLevel): Breadcrumb level
  - `timestamp` (number): Timestamp (auto-set if not provided)
  - `type` (string): Breadcrumb type
  - `data` (object): Additional data

#### clearBreadcrumbs(): Promise<void>

Clear all breadcrumbs.

```typescript
await UnifiedErrorHandling.clearBreadcrumbs();
```

#### captureException(error: Error): Promise<void>

Capture an exception (alias for logError).

```typescript
try {
  await dangerousOperation();
} catch (error) {
  await UnifiedErrorHandling.captureException(error);
}
```

#### recordError(error: Error): Promise<void>

Record a non-fatal error.

```typescript
await UnifiedErrorHandling.recordError(new Error('Non-fatal error'));
```

#### setTags(tags: Record<string, string>): Promise<void>

Set global tags for all errors.

```typescript
await UnifiedErrorHandling.setTags({
  environment: 'production',
  version: '1.2.3',
  feature: 'checkout'
});
```

#### setTag(key: string, value: string): Promise<void>

Set a single global tag.

```typescript
await UnifiedErrorHandling.setTag('module', 'payment');
```

#### removeTag(key: string): Promise<void>

Remove a global tag.

```typescript
await UnifiedErrorHandling.removeTag('module');
```

#### setExtras(extras: Record<string, any>): Promise<void>

Set extra context data.

```typescript
await UnifiedErrorHandling.setExtras({
  cartItems: 5,
  totalValue: 299.99,
  couponApplied: true
});
```

#### setExtra(key: string, value: any): Promise<void>

Set a single extra context value.

```typescript
await UnifiedErrorHandling.setExtra('lastAction', 'add_to_cart');
```

#### removeExtra(key: string): Promise<void>

Remove an extra context value.

```typescript
await UnifiedErrorHandling.removeExtra('lastAction');
```

#### getActiveProviders(): Promise<string[]>

Get list of active provider names.

```typescript
const providers = await UnifiedErrorHandling.getActiveProviders();
// ['firebase', 'sentry']
```

#### isProviderActive(providerName: string): Promise<boolean>

Check if a specific provider is active.

```typescript
const isActive = await UnifiedErrorHandling.isProviderActive('firebase');
```

#### switchProvider(providerName: string): Promise<void>

Switch the primary provider.

```typescript
await UnifiedErrorHandling.switchProvider('sentry');
```

#### enableProvider(providerName: string): Promise<void>

Enable a specific provider.

```typescript
await UnifiedErrorHandling.enableProvider('bugsnag');
```

#### disableProvider(providerName: string): Promise<void>

Disable a specific provider.

```typescript
await UnifiedErrorHandling.disableProvider('firebase');
```

## Types

### UnifiedErrorConfig

```typescript
interface UnifiedErrorConfig {
  providers: ProviderConfig[];
  enableInDevelopment?: boolean;
  enableOfflineQueue?: boolean;
  maxBreadcrumbs?: number;
  beforeSend?: (error: NormalizedError) => NormalizedError | null;
  errorFilter?: (error: NormalizedError) => boolean;
  errorTransformer?: (error: NormalizedError) => NormalizedError;
  enablePerformanceMonitoring?: boolean;
  primaryProvider?: string;
  sessionTracking?: boolean;
  releaseStage?: string;
  appVersion?: string;
  maximumCacheSize?: number;
  networkInformation?: boolean;
}
```

### ErrorLevel

```typescript
type ErrorLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';
```

### UserContext

```typescript
interface UserContext {
  id?: string;
  email?: string;
  username?: string;
  ipAddress?: string;
  attributes?: Record<string, any>;
}
```

### Breadcrumb

```typescript
interface Breadcrumb {
  message: string;
  category: string;
  level: ErrorLevel;
  timestamp?: number;
  type?: string;
  data?: Record<string, any>;
}
```

### NormalizedError

```typescript
interface NormalizedError {
  message: string;
  stack?: string;
  type?: string;
  level: ErrorLevel;
  timestamp: number;
  platform: string;
  handled: boolean;
  context?: ErrorContext;
  breadcrumbs?: Breadcrumb[];
  user?: UserContext;
  device?: DeviceContext;
  app?: AppContext;
  network?: NetworkContext;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  fingerprint?: string[];
}
```