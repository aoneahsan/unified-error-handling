# React Hooks API Reference

## Error Handling Hooks

### useErrorHandler()

Primary hook for error handling in React components.

```typescript
const {
  logError,
  logMessage,
  addBreadcrumb,
  setUserContext,
  setTags,
  setExtras
} = useErrorHandler();
```

**Returns:**
- `logError(error, options?)`: Log an error
- `logMessage(message, level?)`: Log a message
- `addBreadcrumb(breadcrumb)`: Add a breadcrumb
- `setUserContext(user)`: Set user context
- `setTags(tags)`: Set tags
- `setExtras(extras)`: Set extra data

**Example:**
```tsx
function PaymentForm() {
  const { logError, addBreadcrumb } = useErrorHandler();

  const handlePayment = async () => {
    addBreadcrumb({
      message: 'Payment initiated',
      category: 'payment',
      level: 'info'
    });

    try {
      await processPayment();
    } catch (error) {
      logError(error, {
        level: 'error',
        context: { step: 'payment_processing' }
      });
    }
  };

  return <button onClick={handlePayment}>Pay Now</button>;
}
```

### useAsyncError()

Hook for handling errors in async operations.

```typescript
const throwError = useAsyncError();
```

**Returns:**
- `throwError(error)`: Function to throw errors that will be caught by Error Boundaries

**Example:**
```tsx
function DataLoader() {
  const throwError = useAsyncError();

  useEffect(() => {
    loadData().catch(throwError);
  }, []);

  return <div>Loading...</div>;
}
```

### useComponentError()

Hook for component-level error handling with automatic context.

```typescript
const { logComponentError, withErrorHandling } = useComponentError('ComponentName');
```

**Returns:**
- `logComponentError(error, context?)`: Log error with component context
- `withErrorHandling(fn)`: Wrap async functions with error handling

**Example:**
```tsx
function UserProfile() {
  const { withErrorHandling } = useComponentError('UserProfile');

  const loadProfile = withErrorHandling(async () => {
    const profile = await fetchUserProfile();
    setProfile(profile);
  });

  return <button onClick={loadProfile}>Load Profile</button>;
}
```

### useErrorContext()

Access the error context directly.

```typescript
const errorContext = useErrorContext();
```

**Returns:**
- Complete error context including all methods and state

**Example:**
```tsx
function ErrorStatus() {
  const { isInitialized, activeProviders } = useErrorContext();

  if (!isInitialized) {
    return <div>Error handling not initialized</div>;
  }

  return <div>Active providers: {activeProviders.join(', ')}</div>;
}
```

## User Context Hooks

### useUserContext()

Manage user context for error tracking.

```typescript
const { user, setUser, clearUser, updateUser } = useUserContext();
```

**Returns:**
- `user`: Current user context
- `setUser(user)`: Set complete user context
- `clearUser()`: Clear user context
- `updateUser(updates)`: Partially update user context

**Example:**
```tsx
function LoginForm() {
  const { setUser } = useUserContext();

  const handleLogin = async (credentials) => {
    const user = await login(credentials);
    setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      attributes: {
        subscription: user.subscription,
        role: user.role
      }
    });
  };

  return <form onSubmit={handleLogin}>...</form>;
}
```

## Performance Monitoring Hooks

### usePerformanceMonitor()

Monitor component performance.

```typescript
const { startTrace, endTrace, measurePerformance } = usePerformanceMonitor();
```

**Returns:**
- `startTrace(name, attributes?)`: Start a performance trace
- `endTrace(name, metrics?)`: End a performance trace
- `measurePerformance(fn, name)`: Measure function performance

**Example:**
```tsx
function ExpensiveComponent() {
  const { measurePerformance } = usePerformanceMonitor();

  const processData = measurePerformance(async () => {
    const result = await expensiveOperation();
    return result;
  }, 'expensive_operation');

  return <button onClick={processData}>Process</button>;
}
```

## Provider Management Hooks

### useProviderManager()

Manage error providers dynamically.

```typescript
const {
  providers,
  activeProviders,
  switchProvider,
  enableProvider,
  disableProvider
} = useProviderManager();
```

**Returns:**
- `providers`: All configured providers
- `activeProviders`: Currently active providers
- `switchProvider(name)`: Switch primary provider
- `enableProvider(name)`: Enable a provider
- `disableProvider(name)`: Disable a provider

**Example:**
```tsx
function ProviderSettings() {
  const { providers, activeProviders, toggleProvider } = useProviderManager();

  return (
    <div>
      {providers.map(provider => (
        <label key={provider}>
          <input
            type="checkbox"
            checked={activeProviders.includes(provider)}
            onChange={() => toggleProvider(provider)}
          />
          {provider}
        </label>
      ))}
    </div>
  );
}
```

## Utility Hooks

### useErrorRetry()

Add retry logic to error-prone operations.

```typescript
const { retry, retryCount, isRetrying, lastError } = useErrorRetry(options?);
```

**Parameters:**
- `options`: Retry configuration
  - `maxRetries`: Maximum retry attempts (default: 3)
  - `delay`: Delay between retries in ms (default: 1000)
  - `backoff`: Backoff multiplier (default: 2)

**Returns:**
- `retry(fn)`: Execute function with retry logic
- `retryCount`: Current retry count
- `isRetrying`: Whether currently retrying
- `lastError`: Last error encountered

**Example:**
```tsx
function RetryableOperation() {
  const { retry, retryCount, isRetrying } = useErrorRetry({
    maxRetries: 5,
    delay: 2000
  });

  const performOperation = () => retry(async () => {
    const result = await unreliableAPI();
    return result;
  });

  return (
    <div>
      <button onClick={performOperation} disabled={isRetrying}>
        {isRetrying ? `Retrying... (${retryCount})` : 'Perform Operation'}
      </button>
    </div>
  );
}
```

### useErrorMetrics()

Access error metrics and statistics.

```typescript
const { errorCount, errorRate, clearMetrics } = useErrorMetrics();
```

**Returns:**
- `errorCount`: Total error count
- `errorRate`: Errors per minute
- `clearMetrics()`: Reset metrics

### useErrorDebug()

Debug hook for development.

```typescript
const { logDebug, enableDebug, disableDebug } = useErrorDebug();
```

**Returns:**
- `logDebug(message, data?)`: Log debug information
- `enableDebug()`: Enable debug mode
- `disableDebug()`: Disable debug mode

## HOC Utilities

### withErrorHandler()

Higher-order component for error handling.

```typescript
const EnhancedComponent = withErrorHandler(Component, options?);
```

**Parameters:**
- `Component`: React component to enhance
- `options`: Error handling options

**Example:**
```tsx
const SafeComponent = withErrorHandler(MyComponent, {
  fallback: <ErrorFallback />,
  onError: (error) => console.error(error)
});
```

### withAsyncErrorHandler()

HOC for components with async operations.

```typescript
const EnhancedComponent = withAsyncErrorHandler(Component);
```

**Example:**
```tsx
const SafeAsyncComponent = withAsyncErrorHandler(MyAsyncComponent);
```