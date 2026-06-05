# src/store/ — AGENTS.md

> Last Updated: 2026-04-03

## Error Store Rules for AI Agents

### Module Structure
| File | Purpose |
|------|---------|
| `error-store.ts` | Core store — singleton managing error state and adapter orchestration |
| `types.ts` | Store-specific types |

### Store Architecture
- **Singleton** — `errorStore` is the single global instance
- Manages: adapter registry, error queue, user context, breadcrumbs, listeners
- Public API functions delegate to the store
- Dispatches errors to ALL registered adapters in parallel

### Store Rules
- NEVER create multiple instances — singleton enforced
- All state mutations through store methods — no direct access
- `subscribe()` returns unsubscribe function
- `reset()` clears all state; `flush()` sends pending errors
- Adapter registration is idempotent (same name replaces)

### Error Flow
1. Enter via `captureError()` or interceptor
2. Normalize to `NormalizedError`
3. Enrich (breadcrumbs, context, device)
4. Dispatch to all adapters (`Promise.allSettled`)
5. Notify listeners

### Modification Rules
- Most critical module — run `yarn typecheck` and `yarn build` after ANY change
- Adapter dispatch must always be parallel
- One adapter failure must never block others

### CLAUDE.md + AGENTS.md Sync Rule
Every rule in this file must also exist in `src/store/CLAUDE.md` and vice versa. Update both together.
