# src/adapters/ — AGENTS.md

> Last Updated: 2026-04-03

## Adapter Development Rules for AI Agents

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
7. Add test file: `{service}-adapter.test.ts`
8. Add docs: `docs/providers/{service}.md`
9. Update root `Readme.md` supported services list

### Dynamic Import Pattern (MANDATORY)
```typescript
async loadSDK(): Promise<void> {
  const sdk = await this.dynamicImport('@service/sdk');
  this.sdkInstance = sdk;
  this.sdkLoaded = true;
}
```
NEVER use static `import` for service SDKs — preserves zero-dependency core.

### Current Adapters
Console, Custom, Sentry, Firebase, Bugsnag, Rollbar, Datadog, LogRocket, Raygun, AppCenter

### Testing Adapters
- Mock the dynamically imported SDK in tests
- Test: initialization, error capture, message capture, context setting, flush, close
- Verify `sdkLoaded` flag is set after `loadSDK()`
- Test graceful failure when SDK is not installed

### CLAUDE.md + AGENTS.md Sync Rule
Every rule in this file must also exist in `src/adapters/CLAUDE.md` and vice versa. Update both together.
