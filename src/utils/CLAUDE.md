# src/utils/ — CLAUDE.md

> Last Updated: 2026-04-03

## Utility Module Rules

### Module Structure
| File | Purpose |
|------|---------|
| `console-interceptor.ts` | Intercepts `console.error`, `console.warn`, `console.log` |
| `network-interceptor.ts` | Intercepts failed network requests (fetch/XHR) |
| `error-enricher.ts` | Enriches errors with breadcrumbs, device info, user data |
| `index.ts` | Barrel exports |

### Interceptor Patterns
- Interceptors monkey-patch global APIs (`console`, `fetch`, `XMLHttpRequest`)
- MUST store original references and restore them on cleanup
- MUST be idempotent — calling `intercept()` twice should not double-patch
- MUST handle errors in interceptor callbacks gracefully (never throw from interceptor)
- Pattern: `const original = console.error; console.error = (...args) => { /* report */ original.apply(console, args); }`

### Error Enrichment
- Enrichment adds metadata to `NormalizedError` objects before they reach adapters
- Device info: browser, OS, viewport size (when available)
- Breadcrumbs: navigation history, user actions, console messages
- User context: user ID, email, name (when set via `setUser()`)
- NEVER collect PII automatically — only explicit user-provided context

### Rules
- Utilities must be framework-agnostic — no React, no Node-specific APIs without guards
- Check `typeof window !== 'undefined'` before accessing browser APIs
- Check `typeof fetch !== 'undefined'` before intercepting fetch
- All interceptors must have a corresponding `restore()` or `cleanup()` method
- Keep enrichment pure — no side effects, no async operations in enricher

### Testing Utilities
- Test interceptors: verify original is called, verify error is reported, verify cleanup restores original
- Test enrichment: verify metadata is added correctly, verify no PII leaks
- Mock globals carefully — restore in `afterEach`
