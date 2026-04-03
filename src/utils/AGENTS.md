# src/utils/ — AGENTS.md

> Last Updated: 2026-04-03

## Utility Module Rules for AI Agents

### Module Structure
| File | Purpose |
|------|---------|
| `console-interceptor.ts` | Intercepts `console.error`, `console.warn`, `console.log` |
| `network-interceptor.ts` | Intercepts failed network requests (fetch/XHR) |
| `error-enricher.ts` | Enriches errors with breadcrumbs, device info, user data |
| `index.ts` | Barrel exports |

### Interceptor Patterns
- Monkey-patch global APIs, store originals, restore on cleanup
- Must be idempotent — no double-patching
- Handle errors gracefully — never throw from interceptor
- Every interceptor needs a `restore()`/`cleanup()` method

### Error Enrichment
- Adds metadata to `NormalizedError` before it reaches adapters
- Device info, breadcrumbs, user context (only explicit, never auto-PII)
- Keep enrichment pure — no side effects, no async

### Rules
- Framework-agnostic — no React, guard browser/Node APIs
- Check `typeof window/fetch !== 'undefined'` before accessing browser APIs
- All interceptors must have cleanup/restore methods

### Testing
- Test interceptors: original called, error reported, cleanup restores original
- Test enrichment: metadata correct, no PII leaks
- Mock globals carefully — restore in `afterEach`

### CLAUDE.md + AGENTS.md Sync Rule
Every rule in this file must also exist in `src/utils/CLAUDE.md` and vice versa. Update both together.
