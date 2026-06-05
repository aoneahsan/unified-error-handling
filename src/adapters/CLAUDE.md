# src/adapters/ — CLAUDE.md

> Last Updated: 2026-04-03

## Adapter Development Rules

### BaseAdapter Contract
All adapters extend `BaseAdapter` from `base-adapter.ts` and MUST implement:

| Method | Purpose | Required |
|--------|---------|----------|
| `name` | Unique adapter identifier (readonly property) | YES |
| `loadSDK()` | Dynamically import the service SDK | YES |
| `initializeSDK()` | Configure the SDK with user-provided config | YES |
| `captureError(error: NormalizedError)` | Send error to the service | YES |
| `captureMessage(message, level)` | Send a message (default impl in base) | Optional override |
| `setContext(context)` | Set error context | Optional override |
| `addBreadcrumb(breadcrumb)` | Add navigation breadcrumb | Optional override |
| `flush()` | Flush pending events | Optional override |
| `close()` | Clean up resources | Optional override |

### Adding a New Adapter

1. Create `src/adapters/{service}-adapter.ts`
2. Extend `BaseAdapter`
3. Implement all required abstract methods
4. Use `this.dynamicImport(packageName)` for SDK loading — NEVER static `import`
5. Export from `src/adapters/index.ts`
6. Re-export from `src/index.ts` for advanced usage
7. Add documentation: `docs/providers/{service}.md`
8. Update root `Readme.md` supported services list

### Dynamic Import Pattern (MANDATORY)
```typescript
async loadSDK(): Promise<void> {
  const sdk = await this.dynamicImport('@service/sdk');
  this.sdkInstance = sdk;
  this.sdkLoaded = true;
}
```
NEVER use static `import` for service SDKs — this preserves zero-dependency core.

### Current Adapters
| Adapter | File | Service SDK |
|---------|------|-------------|
| Console | `console-adapter.ts` | None (built-in) |
| Custom | `custom-adapter.ts` | None (user-provided callbacks) |
| Sentry | `sentry-adapter.ts` | `@sentry/browser` |
| Firebase | `firebase-adapter.ts` | `firebase/app` + `firebase/analytics` |
| Bugsnag | `bugsnag-adapter.ts` | `@bugsnag/js` |
| Rollbar | `rollbar-adapter.ts` | `rollbar` |
| Datadog | `datadog-adapter.ts` | `@datadog/browser-rum` |
| LogRocket | `logrocket-adapter.ts` | `logrocket` |
| Raygun | `raygun-adapter.ts` | `raygun4js` |
| AppCenter | `appcenter-adapter.ts` | `appcenter-crashes` |
