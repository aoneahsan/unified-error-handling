# AI Integration Guide — unified-error-handling

A precise reference for coding agents (Claude Code, Cursor, Copilot) integrating this package. Every
signature below is taken from the source of version 2.1.1. Prose docs live at
https://unified-error-handling-docs.aoneahsan.com

## The one thing to get right

**The store dispatches to a single active adapter.** `useAdapter(name, config)` makes that adapter the only
destination and replaces whichever was active before. Errors are **not** fanned out to several services.

```ts
await useAdapter('console');
await useAdapter('sentry', { dsn }); // console is no longer the destination
captureError(err);                   // goes to Sentry only
```

**With no active adapter, captured errors are discarded** — logged to the console only when the store was
initialised with `debug: true`. So a correct integration is always two calls:

```ts
initialize(config);
await useAdapter(name, adapterConfig);
```

To reach two services, write one custom adapter whose `send` forwards to both, or use `subscribe()`.

## Install

```bash
yarn add unified-error-handling
```

Then install only the vendor SDK for the adapter you activate. The library never bundles one.

## Core API — `unified-error-handling`

| Function | Signature |
|---|---|
| `initialize` | `(config?: ErrorStoreConfig) => void` |
| `captureError` | `(error: Error \| string, context?: Partial<ErrorContext>) => void` |
| `captureMessage` | `(message: string, level?: string) => void` |
| `setUser` | `(user: UserContext \| null) => void` |
| `setContext` | `(context: Partial<ErrorContext>) => void` |
| `addBreadcrumb` | `(crumb: Omit<Breadcrumb, 'timestamp'>) => void` |
| `clearBreadcrumbs` | `() => void` |
| `useAdapter` | `(name: string, config?: unknown) => Promise<void>` |
| `removeAdapter` | `(name: string) => void` |
| `registerAdapter` | `(name: string, adapter: ErrorAdapter) => void` |
| `createAdapter` | `(name: string, config: CustomAdapterConfig) => void` |
| `createCustomAdapter` | `(config: CustomAdapterConfig) => ErrorAdapter` |
| `subscribe` | `(listener: (error: NormalizedError) => void) => () => void` |
| `flush` | `() => Promise<void>` |
| `reset` | `() => void` |
| `errorStore` | the singleton instance |

`setContext` takes **one object**, not a key/value pair. `captureError`'s second argument is a
`Partial<ErrorContext>` — arbitrary keys belong under `extra`, not at the top level.

## Configuration

```ts
interface ErrorStoreConfig {
  maxBreadcrumbs?: number;          // default 100
  enableGlobalHandlers?: boolean;   // default true — browser only
  enableOfflineQueue?: boolean;     // default true
  enableConsoleCapture?: boolean;   // default true
  enableNetworkCapture?: boolean;   // default false
  beforeSend?: (error: NormalizedError) => NormalizedError | null; // null drops the error
  environment?: string;
  release?: string;
  debug?: boolean;                  // default false
}
```

There is no `sampleRate` option.

## Context types

```ts
interface ErrorContext {
  user?: UserContext;
  device?: DeviceContext;
  custom?: Record<string, any>;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

interface Breadcrumb {
  timestamp: number;                // added by the store — omit when calling addBreadcrumb
  message: string;
  category?: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}
```

A breadcrumb has **no** `type` field.

```ts
setUser({ id: 'user-123', email: 'user@example.com', plan: 'premium' });

addBreadcrumb({
  message: 'User navigated to /dashboard',
  category: 'navigation',
  level: 'info',
  data: { from: '/home', to: '/dashboard' },
});

captureError(new Error('Checkout failed'), {
  tags: { feature: 'checkout' },
  extra: { orderId: 'A-4471' },
});
```

## Adapters

| Name | SDK to install | Required config |
|---|---|---|
| `console` | none — built in | none |
| `sentry` | `@sentry/browser` | `dsn` |
| `datadog` | `@datadog/browser-rum` + `@datadog/browser-logs` | `applicationId`, `clientToken` |
| `bugsnag` | `@bugsnag/js` | `apiKey` |
| `rollbar` | `rollbar` | `accessToken` |
| `logrocket` | `logrocket` | `appId` |
| `raygun` | `raygun4js` | `apiKey` |
| `appcenter` | `appcenter-crashes` + `appcenter-analytics` | `appSecret` |
| `firebase` | `firebase` | `firebaseConfig` — **cannot load in a browser**, see Limitations |

Activation throws if the SDK is missing or required config is absent. The thrown error carries the original
import failure as its `cause`.

## Custom adapters

The contract is a `send` function. There is no `onError`/`onMessage` shape.

```ts
import { createAdapter, useAdapter } from 'unified-error-handling';

createAdapter('my-backend', {
  async send(error, context) {
    await fetch('/api/errors', {
      method: 'POST',
      body: JSON.stringify({ error, context }),
    });
  },
});

await useAdapter('my-backend'); // registering does not activate — this does
```

```ts
interface CustomAdapterConfig {
  send: (error: NormalizedError, context: ErrorContext) => Promise<void>;
  initialize?: () => Promise<void>;   // receives no arguments
  setContext?: (context: ErrorContext) => Promise<void>;
  addBreadcrumb?: (breadcrumb: Breadcrumb) => Promise<void>;
  flush?: () => Promise<void>;
  close?: () => Promise<void>;
}
```

Note that `initialize` takes no arguments, so the second argument to `useAdapter` is ignored by a custom
adapter. Close over the values you need instead.

## React — `unified-error-handling/react`

No provider component exists and none is needed; the store is a module singleton.

| Export | Signature |
|---|---|
| `ErrorBoundary` | component — props `fallback?`, `onError?`, `level?` |
| `withErrorBoundary` | `(Component, options?) => Component` |
| `useErrorHandler` | `() => (error: Error \| string, context?: Partial<ErrorContext>) => void` |
| `useErrorStore` | `() => { initialized, offline, activeAdapter, captureError, setUser, ... }` |
| `useAsyncError` | `() => (error: Error \| string) => void` |
| `useAsyncOperation` | `<T>(op: () => Promise<T>, deps?) => { data, loading, error, execute }` |
| `useErrorTracking` | `(componentName: string) => void` |
| `useComponentError` | `(componentName: string) => { logComponentError }` |
| `usePerformanceMonitor` | `() => { measurePerformance }` |
| `useExtendedErrorHandler` | `() => { logError, logNavigation, logUserAction, setTags }` |

**`useErrorHandler()` returns a function, not an object.** Destructuring it yields `undefined`. Use
`useErrorStore()` when you need `setUser`, `addBreadcrumb` and the rest.

There is no `useErrorBoundary` hook.

```tsx
import { initialize, useAdapter } from 'unified-error-handling';
import { ErrorBoundary, useErrorHandler, useErrorStore } from 'unified-error-handling/react';

initialize({ enableGlobalHandlers: true });
await useAdapter('sentry', { dsn: import.meta.env.VITE_SENTRY_DSN });

function App() {
  return (
    <ErrorBoundary>
      <Checkout />
    </ErrorBoundary>
  );
}

function Checkout() {
  const handleError = useErrorHandler();   // a function
  const { setUser } = useErrorStore();     // the actions object

  return <button onClick={() => handleError(new Error('Boom'))}>Pay</button>;
}
```

`ErrorBoundary`'s `fallback` prop is a **component type**, not an element:

```tsx
<ErrorBoundary fallback={({ error, resetError }) => (
  <div>
    <p>{error.message}</p>
    <button onClick={resetError}>Try again</button>
  </div>
)}>
  <App />
</ErrorBoundary>
```

## Recommended app-entry pattern

```ts
import { initialize, useAdapter } from 'unified-error-handling';

initialize({
  enableGlobalHandlers: true,
  enableConsoleCapture: import.meta.env.PROD,
  maxBreadcrumbs: 50,
});

if (import.meta.env.VITE_SENTRY_DSN) {
  await useAdapter('sentry', {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
  });
} else {
  await useAdapter('console');
}
```

Without the `else` branch, errors are silently discarded whenever the DSN is unset.

## Limitations to respect when generating code

- One active adapter at a time; `useAdapter` replaces rather than adds.
- No active adapter means captured errors are dropped.
- The `firebase` adapter imports `firebase/crashlytics`, which the Firebase JS SDK does not expose, so it
  cannot load in a browser. Do not recommend it for web projects.
- Global handlers attach to `window`; Node.js gets no `process` hooks.
- The offline queue is in-memory and does not survive a reload.
- `reset()` cannot detach already-installed global handlers.
- The React entry requires React 19+.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Nothing reaches the service | no active adapter | call `useAdapter()` after `initialize()` |
| `[ErrorStore] Not initialized` | captured before `initialize()` | initialise at the entry point |
| `Failed to load <sdk>` | vendor SDK not installed | install it; read `error.cause` for the real reason |
| `[ErrorStore] Already initialized` | `initialize()` called twice | call once — it is a singleton |
| Errors stopped after a second `useAdapter` | expected — the adapter was replaced | use a custom adapter to reach two sinks |

## Links

- Documentation — https://unified-error-handling-docs.aoneahsan.com
- Repository — https://github.com/aoneahsan/unified-error-handling
- Changelog — https://github.com/aoneahsan/unified-error-handling/blob/main/CHANGELOG.md
- Known issues — https://github.com/aoneahsan/unified-error-handling/blob/main/docs/REPORTED-ISSUES.md
