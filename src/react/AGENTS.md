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

### Testing React Components
- Use Vitest with happy-dom or jsdom environment
- Test: error catching, fallback rendering, reset behavior, hooks, HOC wrapping

### Adding New React Features
1. Create in `src/react/`
2. Export from `src/react/index.ts`
3. Ensure no impact on core bundle (separate entry point)
4. Add tests and update `docs/api/react-hooks.md`

### CLAUDE.md + AGENTS.md Sync Rule
Every rule in this file must also exist in `src/react/CLAUDE.md` and vice versa. Update both together.
