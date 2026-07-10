# src/store/ — AGENTS.md

> Last Updated: 2026-06-24

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
- Dispatches each error to the SINGLE active adapter (`activeAdapter` — the last one passed to `useAdapter()`). Adapters can be registered without being active; only one is active at a time.

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
4. Apply `beforeSend` hook; queue if offline (and `enableOfflineQueue`)
5. Dispatch to the active adapter (`sendToAdapter` — try/catch isolates adapter failures)
6. Notify listeners

### Modification Rules
- Most critical module — run `yarn typecheck` and `yarn build` after ANY change
- A failing adapter `captureError` must never throw out of the store (it is caught + logged)
- If multi-adapter fan-out is ever introduced, use `Promise.allSettled` so one adapter failure never blocks the others

### CLAUDE.md + AGENTS.md Sync Rule
Every rule in this file must also exist in `src/store/CLAUDE.md` and vice versa. Update both together.


## Sub-agents & Skills — Main-Context-First (IRON-SOLID)
Default/built-in sub-agents (`general-purpose`, `Explore`, `Plan`, `claude`, `fork`, …) do NOT have
access to `/skills`, so delegating to them silently SKIPS the skills RULE #0 requires. Do all
skill-relevant work in the **MAIN context**; use a sub-agent ONLY when a **custom** agent exists in
`.claude/agents/` for that job; a default `Explore`/`Plan` agent is allowed ONLY for read-only,
no-skill search/exploration. When a relevant skill is missing, **install/enable it** rather than
proceeding skill-less. (Owner directive 2026-07-11; full text in `~/.claude/CLAUDE.md`.)
