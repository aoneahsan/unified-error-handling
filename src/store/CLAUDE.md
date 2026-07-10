# src/store/ — CLAUDE.md

> Last Updated: 2026-06-24

## Error Store Rules

### Module Structure
| File | Purpose |
|------|---------|
| `error-store.ts` | Core error store — singleton managing all error state and adapter orchestration |
| `types.ts` | Store-specific types (`ErrorStore`, `ErrorStoreState`, `ErrorStoreActions`) |

### Store Architecture
- **Singleton pattern** — `errorStore` is the single global instance
- Manages: adapter registry, error queue, user context, breadcrumbs, listeners
- All public API functions (`initialize`, `captureError`, `setUser`, etc.) delegate to the store
- Store dispatches each error to the SINGLE active adapter (`activeAdapter` — the last one passed to `useAdapter()`). Multiple adapters may be registered, but only one is active at a time; switching adapters re-points `activeAdapter`.

### Store Rules
- NEVER create multiple store instances — singleton is enforced
- All state mutations go through store methods — no direct state access
- `subscribe()` for external listeners (returns unsubscribe function)
- `reset()` clears all state and unregisters all adapters
- `flush()` sends pending errors to all adapters before shutdown
- Adapter registration is idempotent — registering same name replaces previous

### Error Flow
1. Error enters via `captureError()` or interceptor
2. Error is normalized to `NormalizedError` format
3. Error is enriched (breadcrumbs, context, device info)
4. `beforeSend` hook runs; error is queued if offline (and `enableOfflineQueue`)
5. Error is dispatched to the active adapter (`sendToAdapter`, wrapped in try/catch)
6. Listeners are notified

### Modification Rules
- Store is the most critical module — changes here affect everything
- Run `yarn typecheck` and `yarn build` after ANY store modification
- A failing adapter `captureError` must never throw out of the store (it is caught + logged)
- If multi-adapter fan-out is ever added, dispatch with `Promise.allSettled` so one adapter failure never blocks the others


## Sub-agents & Skills — Main-Context-First (IRON-SOLID)
Default/built-in sub-agents (`general-purpose`, `Explore`, `Plan`, `claude`, `fork`, …) do NOT have
access to `/skills`, so delegating to them silently SKIPS the skills RULE #0 requires. Do all
skill-relevant work in the **MAIN context**; use a sub-agent ONLY when a **custom** agent exists in
`.claude/agents/` for that job; a default `Explore`/`Plan` agent is allowed ONLY for read-only,
no-skill search/exploration. When a relevant skill is missing, **install/enable it** rather than
proceeding skill-less. (Owner directive 2026-07-11; full text in `~/.claude/CLAUDE.md`.)
