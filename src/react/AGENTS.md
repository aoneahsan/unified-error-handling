# src/react/ — AGENTS.md

> Last Updated: 2026-04-03

## React Integration Rules for AI Agents

### Component Architecture
- `ErrorBoundary` — Class component (React requirement for error boundaries)
- `withErrorBoundary` — HOC wrapper for functional components
- `useErrorHandler` — Hook for imperative error reporting
- All React exports are in the `unified-error-handling/react` subpath

### ErrorBoundary Props Contract
| Prop | Type | Purpose |
|------|------|---------|
| `fallback` | `React.ComponentType<ErrorFallbackProps>` | Custom fallback UI |
| `onError` | `(error, errorInfo) => void` | Error callback |
| `level` | `ErrorLevel` | Severity level |
| `context` | `Record<string, any>` | Additional context |
| `tags` | `Record<string, string>` | Error tags |
| `isolate` | `boolean` | Prevent propagation to parent |
| `resetOnPropsChange` | `boolean` | Reset on prop changes |
| `resetKey` | `string \| number` | Manual reset trigger |

### Rules
- React is a **peer dependency** (optional) — NEVER import React in core `src/index.ts`
- All React code stays within `src/react/` — no React imports outside this directory
- Use `.tsx` extension only for files containing JSX, `.ts` for hooks/logic
- ErrorBoundary must integrate with `errorStore` from `../store/error-store`
- Bundle size limit: React module <8KB

### Adding New React Features
1. Create in `src/react/`
2. Export from `src/react/index.ts`
3. Ensure no impact on core bundle (separate entry point)
4. Update `docs/api/react-hooks.md`

### CLAUDE.md + AGENTS.md Sync Rule
Every rule in this file must also exist in `src/react/CLAUDE.md` and vice versa. Update both together.


## Sub-agents & Skills — Main-Context-First (IRON-SOLID)
Default/built-in sub-agents (`general-purpose`, `Explore`, `Plan`, `claude`, `fork`, …) do NOT have
access to `/skills`, so delegating to them silently SKIPS the skills RULE #0 requires. Do all
skill-relevant work in the **MAIN context**; use a sub-agent ONLY when a **custom** agent exists in
`.claude/agents/` for that job; a default `Explore`/`Plan` agent is allowed ONLY for read-only,
no-skill search/exploration. When a relevant skill is missing, **install/enable it** rather than
proceeding skill-less. (Owner directive 2026-07-11; full text in `~/.claude/CLAUDE.md`.)
