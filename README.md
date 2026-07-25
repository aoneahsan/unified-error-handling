<div align="center">

<img src="https://raw.githubusercontent.com/aoneahsan/unified-error-handling/main/assets/logo.svg" alt="unified-error-handling logo" width="120" />

<h1>unified-error-handling</h1>

<p><strong>One error-capture API for your app, with the tracking SDK loaded only when you use it.</strong></p>

[![npm version](https://img.shields.io/npm/v/unified-error-handling.svg)](https://www.npmjs.com/package/unified-error-handling)
[![downloads](https://img.shields.io/npm/dm/unified-error-handling.svg)](https://www.npmjs.com/package/unified-error-handling)
[![license](https://img.shields.io/npm/l/unified-error-handling.svg)](https://github.com/aoneahsan/unified-error-handling/blob/main/LICENSE)
[![types](https://img.shields.io/npm/types/unified-error-handling.svg)](https://www.npmjs.com/package/unified-error-handling)
[![bundle size](https://img.shields.io/bundlephobia/minzip/unified-error-handling.svg)](https://bundlephobia.com/package/unified-error-handling)
[![node](https://img.shields.io/node/v/unified-error-handling.svg)](https://nodejs.org)

[Docs](https://unified-error-handling-docs.aoneahsan.com) · [npm](https://www.npmjs.com/package/unified-error-handling) · [GitHub](https://github.com/aoneahsan/unified-error-handling) · [Changelog](https://github.com/aoneahsan/unified-error-handling/blob/main/CHANGELOG.md) · [AI Guide](https://github.com/aoneahsan/unified-error-handling/blob/main/AI-INTEGRATION-GUIDE.md) · [Support](https://github.com/aoneahsan/unified-error-handling/issues)

</div>

> [!IMPORTANT]
> Errors only reach a service once you activate an adapter. `initialize()` on its own captures nothing —
> call `await useAdapter('<name>', config)` too, or every captured error is discarded. See
> [Quick Start](#quick-start).

`unified-error-handling` gives your application one small API — `captureError`, `setUser`,
`addBreadcrumb` — and forwards it to whichever error-tracking service you point it at. The vendor SDK is
loaded through a dynamic `import()` at the moment you activate its adapter, so a project that only uses
Sentry never pays for the other eight. The library itself has no runtime dependencies, and the React layer
needs no context provider, so hooks work in any component.

| | |
|---|---|
| **Version** | `2.1.1` |
| **License** | MIT |
| **Node** | `>=24.13.0` |
| **Platforms** | Browser · Node.js |
| **Install size** | ~7 kB min+brotli (core) · ~10 kB (React layer) |
| **Types** | Bundled `.d.ts` (ESM + CJS) |
| **Status** | Stable · actively maintained |

<a id="table-of-contents"></a>
## 🧭 Table of Contents&nbsp;[#](#table-of-contents)

- [💡 Why unified-error-handling](#why-unified-error-handling)
- [✨ Features](#features)
- [📱 Platform Support](#platform-support)
- [📋 Requirements](#requirements)
- [📦 Installation](#installation)
- [🚀 Quick Start](#quick-start)
- [🛠️ Usage](#usage)
- [⚙️ Configuration](#configuration)
- [🔧 API Reference](#api-reference)
- [🧩 Types](#types)
- [🧪 Examples](#examples)
- [🎛️ Advanced Features](#advanced-features)
- [🚑 Recovery & Troubleshooting](#recovery-troubleshooting)
- [🚧 Limitations](#limitations)
- [❓ FAQ](#faq)
- [📚 Documentation](#documentation)
- [🔄 Changelog](#changelog)
- [🤝 Contributing](#contributing)
- [💬 Support](#support)
- [📄 License](#license)
- [👤 Author](#author)
- [🔗 Links](#links)
- [🏷️ Keywords](#keywords)

<a id="why-unified-error-handling"></a>
## 💡 Why unified-error-handling&nbsp;[#](#why-unified-error-handling)

Error-tracking vendors each ship their own SDK, their own initialisation ritual, and their own idea of what
a "user" or a "breadcrumb" is. Wiring one in spreads vendor-specific calls through your codebase, and
swapping vendors later means touching every one of those call sites.

This library puts one thin layer in front of them. Your code calls `captureError`; the adapter translates.
Changing vendor is a one-line change at startup.

| | `unified-error-handling` | Importing a vendor SDK directly |
|---|---|---|
| Call sites | vendor-neutral | vendor-specific throughout |
| Switching vendor | one line at startup | edit every call site |
| Runtime dependencies | none | the vendor SDK, always |
| SDK cost when unused | none — loaded on activation | bundled whether used or not |
| Vendor-specific features | only what the adapter maps | everything the vendor offers |

**Not the right tool when** you need a vendor's advanced features — Sentry performance tracing, LogRocket
session search, Bugsnag release pipelines. This layer maps errors, messages, user context and breadcrumbs;
anything past that is easier reached by using the vendor SDK directly. It is also the wrong choice if you
want errors delivered to several services at once — see [Limitations](#limitations).

<a id="features"></a>
## ✨ Features&nbsp;[#](#features)

- **Nine adapters** — console, Sentry, Firebase, DataDog, Bugsnag, Rollbar, LogRocket, Raygun and AppCenter.
- **Dynamic SDK loading** — a vendor SDK is imported only when its adapter is activated.
- **Zero runtime dependencies** — nothing is added to your dependency tree.
- **No React provider** — hooks read a module singleton, so they work in any component at any depth.
- **Automatic capture** — unhandled errors, promise rejections, `console.error` and failed network requests.
- **Context and breadcrumbs** — user, tags, device and a capped breadcrumb trail travel with every error.
- **Offline queueing** — errors captured while the browser is offline are held and flushed on reconnect.
- **`beforeSend` hook** — rewrite an error or drop it by returning `null`.
- **Custom adapters** — send errors to your own endpoint with one `send` function.
- **Typed throughout** — bundled declarations for both ESM and CJS.

<a id="platform-support"></a>
## 📱 Platform Support&nbsp;[#](#platform-support)

| Platform | Supported | Notes |
|---|---|---|
| Browser | ✅ | Full support, including global handlers, offline queue and interceptors. |
| Node.js | ⚠️ | Manual `captureError` works. Global handlers are **not** installed — they attach to `window`, so `process` exceptions are not captured. |
| React Native | ⚠️ | Not verified by the maintainer. The core has no browser-only imports, but the offline queue and global handlers depend on `window`. |

<a id="requirements"></a>
## 📋 Requirements&nbsp;[#](#requirements)

| Requirement | Version | Why |
|---|---|---|
| Node | `>=24.13.0` | the version the package is built and tested on |
| `react` | `>=19.0.0` | optional peer — only for `unified-error-handling/react` |
| `react-dom` | `>=19.0.0` | optional peer — only for `unified-error-handling/react` |

Vendor SDKs are **not** dependencies. Install only the one your adapter needs — see [Usage](#usage) for the
per-adapter list.

<a id="installation"></a>
## 📦 Installation&nbsp;[#](#installation)

```bash
yarn add unified-error-handling
```

No build step, no native sync, no configuration file. Add the vendor SDK for whichever adapter you plan to
activate, for example:

```bash
yarn add @sentry/browser
```

<a id="quick-start"></a>
## 🚀 Quick Start&nbsp;[#](#quick-start)

Two calls at startup: initialise the store, then activate an adapter.

```ts
import { initialize, useAdapter, captureError } from 'unified-error-handling';

initialize({ enableGlobalHandlers: true });

await useAdapter('console');

captureError(new Error('Something went wrong'));
```

Swap `'console'` for a real service when you are ready — nothing else in your code changes:

```ts
await useAdapter('sentry', { dsn: process.env.SENTRY_DSN });
```

<a id="usage"></a>
## 🛠️ Usage&nbsp;[#](#usage)

### Choosing an adapter

Each adapter loads its SDK on activation. Install the SDK yourself; the library never bundles it.

| Adapter | SDK to install | Required config |
|---|---|---|
| `console` | none — built in | none |
| `sentry` | `@sentry/browser` | `dsn` |
| `datadog` | `@datadog/browser-rum` + `@datadog/browser-logs` | `applicationId`, `clientToken` |
| `bugsnag` | `@bugsnag/js` | `apiKey` |
| `rollbar` | `rollbar` | `accessToken` |
| `logrocket` | `logrocket` | `appId` |
| `raygun` | `raygun4js` | `apiKey` |
| `appcenter` | `appcenter-crashes` + `appcenter-analytics` | `appSecret` |
| `firebase` | `firebase` | `firebaseConfig` — ⚠️ see [Limitations](#limitations) |

Per-adapter options are documented at
[Adapters](https://unified-error-handling-docs.aoneahsan.com/guides/adapters).

### Adding context

```ts
import { setUser, addBreadcrumb, captureError } from 'unified-error-handling';

setUser({ id: '12345', email: 'user@example.com' });

addBreadcrumb({ message: 'Opened checkout', category: 'ui', level: 'info' });

captureError(new Error('Payment declined'), {
  tags: { feature: 'checkout' },
  extra: { orderId: 'A-4471' },
});
```

### React

Initialise once at your entry point, then use the hooks anywhere — no provider to mount.

```tsx
import { initialize, useAdapter } from 'unified-error-handling';
import { ErrorBoundary, useErrorHandler } from 'unified-error-handling/react';

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
  const handleError = useErrorHandler();

  return <button onClick={() => handleError(new Error('Boom'))}>Pay</button>;
}
```

`useErrorHandler()` returns a **function**. For the store's other actions use `useErrorStore()`, which
returns `{ captureError, setUser, addBreadcrumb, ... }`.

### A custom adapter

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

await useAdapter('my-backend');
```

<a id="configuration"></a>
## ⚙️ Configuration&nbsp;[#](#configuration)

Every field of `initialize(config)` is optional.

| Option | Type | Default | What it does |
|---|---|---|---|
| `maxBreadcrumbs` | `number` | `100` | Trail length; oldest are dropped first. |
| `enableGlobalHandlers` | `boolean` | `true` | Capture `window` errors and unhandled rejections. Browser only. |
| `enableOfflineQueue` | `boolean` | `true` | Hold errors while offline, flush on reconnect. |
| `enableConsoleCapture` | `boolean` | `true` | Capture `console.error` calls. |
| `enableNetworkCapture` | `boolean` | `false` | Capture failed `fetch` and `XHR` requests. |
| `beforeSend` | `(error) => NormalizedError \| null` | — | Rewrite an error, or return `null` to drop it. |
| `environment` | `string` | — | Passed through to adapters that accept it. |
| `release` | `string` | — | Passed through to adapters that accept it. |
| `debug` | `boolean` | `false` | Log to the console when an error is captured with no active adapter. |

Full reference:
[Configuration](https://unified-error-handling-docs.aoneahsan.com/getting-started/configuration).

<a id="api-reference"></a>
## 🔧 API Reference&nbsp;[#](#api-reference)

A signature index. Full documentation on the docs site.

### Core — `unified-error-handling`

| Export | Signature | Docs |
|---|---|---|
| `initialize` | `(config?: ErrorStoreConfig) => void` | [→](https://unified-error-handling-docs.aoneahsan.com/api/core) |
| `captureError` | `(error: Error \| string, context?: Partial<ErrorContext>) => void` | [→](https://unified-error-handling-docs.aoneahsan.com/api/core) |
| `captureMessage` | `(message: string, level?: string) => void` | [→](https://unified-error-handling-docs.aoneahsan.com/api/core) |
| `setUser` | `(user: UserContext \| null) => void` | [→](https://unified-error-handling-docs.aoneahsan.com/api/core) |
| `setContext` | `(context: Partial<ErrorContext>) => void` | [→](https://unified-error-handling-docs.aoneahsan.com/api/core) |
| `addBreadcrumb` | `(crumb: Omit<Breadcrumb, 'timestamp'>) => void` | [→](https://unified-error-handling-docs.aoneahsan.com/api/core) |
| `clearBreadcrumbs` | `() => void` | [→](https://unified-error-handling-docs.aoneahsan.com/api/core) |
| `useAdapter` | `(name: string, config?: unknown) => Promise<void>` | [→](https://unified-error-handling-docs.aoneahsan.com/guides/adapters) |
| `removeAdapter` | `(name: string) => void` | [→](https://unified-error-handling-docs.aoneahsan.com/guides/adapters) |
| `registerAdapter` | `(name: string, adapter: ErrorAdapter) => void` | [→](https://unified-error-handling-docs.aoneahsan.com/guides/custom-adapters) |
| `createAdapter` | `(name: string, config: CustomAdapterConfig) => void` | [→](https://unified-error-handling-docs.aoneahsan.com/guides/custom-adapters) |
| `createCustomAdapter` | `(config: CustomAdapterConfig) => ErrorAdapter` | [→](https://unified-error-handling-docs.aoneahsan.com/guides/custom-adapters) |
| `subscribe` | `(listener: ErrorListener) => () => void` | [→](https://unified-error-handling-docs.aoneahsan.com/api/core) |
| `flush` | `() => Promise<void>` | [→](https://unified-error-handling-docs.aoneahsan.com/api/core) |
| `reset` | `() => void` | [→](https://unified-error-handling-docs.aoneahsan.com/api/core) |
| `errorStore` | the singleton behind every function above | [→](https://unified-error-handling-docs.aoneahsan.com/api/core) |

Adapter classes `SentryAdapter`, `FirebaseAdapter` and `CustomAdapter` are also exported for advanced use.

### React — `unified-error-handling/react`

| Export | Signature | Docs |
|---|---|---|
| `ErrorBoundary` | `React.Component<ErrorBoundaryProps>` | [→](https://unified-error-handling-docs.aoneahsan.com/api/react) |
| `withErrorBoundary` | `(Component, options?) => Component` | [→](https://unified-error-handling-docs.aoneahsan.com/api/react) |
| `useErrorHandler` | `() => (error, context?) => void` | [→](https://unified-error-handling-docs.aoneahsan.com/api/react) |
| `useErrorStore` | `() => ErrorStoreActions & { initialized, offline, activeAdapter }` | [→](https://unified-error-handling-docs.aoneahsan.com/api/react) |
| `useAsyncError` | `() => (error) => void` | [→](https://unified-error-handling-docs.aoneahsan.com/api/react) |
| `useAsyncOperation` | `<T>(op: () => Promise<T>, deps?) => { data, loading, error, execute }` | [→](https://unified-error-handling-docs.aoneahsan.com/api/react) |
| `useErrorTracking` | `(componentName: string) => void` — logs mount/unmount breadcrumbs | [→](https://unified-error-handling-docs.aoneahsan.com/api/react) |
| `useComponentError` | `(componentName: string) => { logComponentError }` | [→](https://unified-error-handling-docs.aoneahsan.com/api/react) |
| `usePerformanceMonitor` | `() => { measurePerformance }` | [→](https://unified-error-handling-docs.aoneahsan.com/api/react) |
| `useExtendedErrorHandler` | `() => { logError, logNavigation, logUserAction, setTags }` | [→](https://unified-error-handling-docs.aoneahsan.com/api/react) |

Higher-order components — `withErrorHandler`, `withAsyncErrorHandler`, `withPageErrorHandling`,
`withApiErrorHandling`, `withFormErrorHandling`, `withCriticalErrorHandling` — are re-exported from the same
entry point.

<a id="types"></a>
## 🧩 Types&nbsp;[#](#types)

The types a consumer actually touches:

```ts
export interface ErrorStoreConfig {
  maxBreadcrumbs?: number;
  enableGlobalHandlers?: boolean;
  enableOfflineQueue?: boolean;
  enableConsoleCapture?: boolean;
  enableNetworkCapture?: boolean;
  beforeSend?: (error: NormalizedError) => NormalizedError | null;
  environment?: string;
  release?: string;
  debug?: boolean;
}

export interface ErrorContext {
  user?: UserContext;
  device?: DeviceContext;
  custom?: Record<string, any>;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

export interface Breadcrumb {
  timestamp: number;
  message: string;
  category?: string;
  level?: 'debug' | 'info' | 'warning' | 'error';
  data?: Record<string, any>;
}

export interface CustomAdapterConfig {
  send: (error: NormalizedError, context: ErrorContext) => Promise<void>;
  initialize?: () => Promise<void>;
  setContext?: (context: ErrorContext) => Promise<void>;
  addBreadcrumb?: (breadcrumb: Breadcrumb) => Promise<void>;
  flush?: () => Promise<void>;
  close?: () => Promise<void>;
}
```

`NormalizedError`, `UserContext`, `DeviceContext`, `ErrorAdapter`, `ErrorLevel` and `ErrorListener` are
exported alongside them. Full listing:
[Types](https://unified-error-handling-docs.aoneahsan.com/api/types).

<a id="examples"></a>
## 🧪 Examples&nbsp;[#](#examples)

| Goal | Example |
|---|---|
| Capture in plain JavaScript | [basic-usage.js](https://github.com/aoneahsan/unified-error-handling/blob/main/examples/basic-usage.js) |
| Wire up React | [react-usage.jsx](https://github.com/aoneahsan/unified-error-handling/blob/main/examples/react-usage.jsx) |
| Send to Sentry | [sentry-adapter.js](https://github.com/aoneahsan/unified-error-handling/blob/main/examples/sentry-adapter.js) |
| Send to Firebase | [firebase-adapter.js](https://github.com/aoneahsan/unified-error-handling/blob/main/examples/firebase-adapter.js) |
| Write your own adapter | [custom-adapter.js](https://github.com/aoneahsan/unified-error-handling/blob/main/examples/custom-adapter.js) |

<a id="advanced-features"></a>
## 🎛️ Advanced Features&nbsp;[#](#advanced-features)

- **Offline queue** — while `navigator.onLine` is false, errors are held in memory and flushed when the
  browser reconnects.
  [→](https://unified-error-handling-docs.aoneahsan.com/guides/offline-and-interceptors)
- **Interceptors** — `console.error` and failed `fetch`/`XHR` calls become captured errors.
  [→](https://unified-error-handling-docs.aoneahsan.com/guides/offline-and-interceptors)
- **Enrichment** — each error gains device, viewport, language and a grouping fingerprint before dispatch.
- **`subscribe(listener)`** — observe every captured error in-process, for a debug overlay or your own sink.
- **Custom adapters** — one `send` function is the whole contract.
  [→](https://unified-error-handling-docs.aoneahsan.com/guides/custom-adapters)

<a id="recovery-troubleshooting"></a>
## 🚑 Recovery & Troubleshooting&nbsp;[#](#recovery-troubleshooting)

| Symptom | Cause | Fix |
|---|---|---|
| Nothing reaches the service | No adapter is active — the error was discarded | `await useAdapter('<name>', config)` after `initialize()` |
| `[ErrorStore] Not initialized` warning | `captureError` ran before `initialize()` | Call `initialize()` at your entry point |
| `Failed to load <sdk>` on activation | The vendor SDK is not installed | `yarn add <sdk>` — see the table in [Usage](#usage) |
| `[ErrorStore] Already initialized` warning | `initialize()` called twice | Call it once; it is a module singleton |
| Errors stop after switching adapter | `useAdapter` replaces the active adapter | Expected — only one is active at a time |
| Nothing captured in Node | Global handlers bind to `window` | Call `captureError` yourself, or add your own `process` hooks |

<a id="limitations"></a>
## 🚧 Limitations&nbsp;[#](#limitations)

Stated as plainly as the features:

- **One adapter is active at a time.** `useAdapter()` makes that adapter the only destination; calling it
  again replaces the previous one. Errors are **not** fanned out to several services at once.
- **With no active adapter, captured errors are dropped.** They are logged to the console only when
  `debug: true`.
- **The `firebase` adapter cannot load in a browser.** It imports `firebase/crashlytics`, which the Firebase
  JS SDK does not provide — Crashlytics is a native-only product. Activation fails with a "Failed to load"
  error. Tracked as
  [ISSUE-002](https://github.com/aoneahsan/unified-error-handling/blob/main/docs/REPORTED-ISSUES.md).
- **Global handlers are browser-only.** Node.js gets no `uncaughtException` or `unhandledRejection` hook.
- **The offline queue is in-memory.** A page reload while offline loses whatever was queued.
- **`reset()` cannot remove global handlers.** They are registered as anonymous listeners, so a captured
  error can still reach the store after `reset()` within the same page session.
- **Only the `Sentry`, `Firebase` and `Custom` adapter classes are re-exported** from the package root. The
  other six are reachable through `useAdapter('<name>')`, which is the supported path.
- **The React entry needs React 19+.** There is no React 18 build.
- **`engines.node` is `>=24.13.0`.** Older Node versions produce an `EBADENGINE` warning on install.

<a id="faq"></a>
## ❓ FAQ&nbsp;[#](#faq)

**Can I send errors to two services at once?**
Not today. The store keeps a single active adapter. To mirror errors, write a custom adapter whose `send`
forwards to both destinations, or call `subscribe()` and dispatch yourself.

**Do I have to install all nine vendor SDKs?**
No. Install only the SDK for the adapter you activate. Nothing else is imported.

**Does it work without React?**
Yes. The core entry has no React import. The `unified-error-handling/react` subpath is opt-in, and both
React peers are marked optional.

**Why is there no provider component?**
The store is a module-level singleton, so hooks read it directly. That is why a hook works in any component
without wrapping your tree.

**How do I stop an error from being sent?**
Return `null` from `beforeSend` — the error is discarded before it reaches the adapter.

<a id="documentation"></a>
## 📚 Documentation&nbsp;[#](#documentation)

Which document answers which question:

| Document | Read it when |
|---|---|
| [Introduction](https://unified-error-handling-docs.aoneahsan.com/intro) | deciding whether this fits your project |
| [Installation](https://unified-error-handling-docs.aoneahsan.com/getting-started/installation) | adding it to an app |
| [Quick start](https://unified-error-handling-docs.aoneahsan.com/getting-started/quick-start) | first time using it |
| [Configuration](https://unified-error-handling-docs.aoneahsan.com/getting-started/configuration) | tuning what is captured |
| [Adapters](https://unified-error-handling-docs.aoneahsan.com/guides/adapters) | wiring a specific vendor |
| [Custom adapters](https://unified-error-handling-docs.aoneahsan.com/guides/custom-adapters) | sending errors to your own endpoint |
| [React guide](https://unified-error-handling-docs.aoneahsan.com/guides/react) | using the hooks and the boundary |
| [API reference](https://unified-error-handling-docs.aoneahsan.com/api/core) | you need an exact signature |
| [Provider overview](https://unified-error-handling-docs.aoneahsan.com/providers/overview) | comparing the supported services |
| [AI integration guide](https://github.com/aoneahsan/unified-error-handling/blob/main/AI-INTEGRATION-GUIDE.md) | a coding agent is implementing against it |

<a id="changelog"></a>
## 🔄 Changelog&nbsp;[#](#changelog)

Latest release: **`2.1.1`** — six new adapters (DataDog, Bugsnag, Rollbar, LogRocket, Raygun, AppCenter), a
fix that restores the bundled TypeScript declarations, and no source maps in the published tarball.

Full history: [CHANGELOG.md](https://github.com/aoneahsan/unified-error-handling/blob/main/CHANGELOG.md).

<a id="contributing"></a>
## 🤝 Contributing&nbsp;[#](#contributing)

Fork and open a pull request — see
[CONTRIBUTING.md](https://github.com/aoneahsan/unified-error-handling/blob/main/CONTRIBUTING.md) for setup,
standards, and how to request collaborator access. `main` is protected: every change lands through a
reviewed PR.

<a id="support"></a>
## 💬 Support&nbsp;[#](#support)

Questions and bugs: [open an issue](https://github.com/aoneahsan/unified-error-handling/issues).

If this package saves you time, you can support its maintenance at
[aoneahsan.com/payment](https://aoneahsan.com/payment?project-id=unified-error-handling&project-identifier=unified-error-handling).

<a id="license"></a>
## 📄 License&nbsp;[#](#license)

MIT © Ahsan Mahmood — see
[LICENSE](https://github.com/aoneahsan/unified-error-handling/blob/main/LICENSE).

<a id="author"></a>
## 👤 Author&nbsp;[#](#author)

**Ahsan Mahmood** — [aoneahsan.com](https://aoneahsan.com) · [GitHub](https://github.com/aoneahsan) ·
[LinkedIn](https://linkedin.com/in/aoneahsan) · [aoneahsan@gmail.com](mailto:aoneahsan@gmail.com)

<a id="links"></a>
## 🔗 Links&nbsp;[#](#links)

| | |
|---|---|
| Documentation | https://unified-error-handling-docs.aoneahsan.com |
| npm | https://www.npmjs.com/package/unified-error-handling |
| Repository | https://github.com/aoneahsan/unified-error-handling |
| Issues | https://github.com/aoneahsan/unified-error-handling/issues |
| Changelog | https://github.com/aoneahsan/unified-error-handling/blob/main/CHANGELOG.md |
| Support the project | https://aoneahsan.com/payment |

<a id="keywords"></a>
## 🏷️ Keywords&nbsp;[#](#keywords)

*error-handling · crash-reporting · error-tracking · sentry · bugsnag · rollbar · datadog · logrocket ·
raygun · zero-dependency · react · typescript*
