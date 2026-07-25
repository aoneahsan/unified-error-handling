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
7. Add docs: `docs/providers/{service}.md`
8. Update root `README.md` supported services list

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

### CLAUDE.md + AGENTS.md Sync Rule
Every rule in this file must also exist in `src/adapters/CLAUDE.md` and vice versa. Update both together.


## Sub-agents & Skills — Main-Context-First (IRON-SOLID)
Default/built-in sub-agents (`general-purpose`, `Explore`, `Plan`, `claude`, `fork`, …) do NOT have
access to `/skills`, so delegating to them silently SKIPS the skills RULE #0 requires. Do all
skill-relevant work in the **MAIN context**; use a sub-agent ONLY when a **custom** agent exists in
`.claude/agents/` for that job; a default `Explore`/`Plan` agent is allowed ONLY for read-only,
no-skill search/exploration. When a relevant skill is missing, **install/enable it** rather than
proceeding skill-less. (Owner directive 2026-07-11; full text in `~/.claude/CLAUDE.md`.)
