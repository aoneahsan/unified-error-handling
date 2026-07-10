# src/types/ — CLAUDE.md

> Last Updated: 2026-04-03

## Type Definitions Rules

### Module Structure
| File | Purpose |
|------|---------|
| `config.ts` | Configuration-related types (`ErrorStoreConfig`, `ProviderConfig`) |
| `errors.ts` | Error types (`NormalizedError`, `ErrorLevel`, `ErrorContext`, `Breadcrumb`) |
| `providers.ts` | Provider/adapter interfaces (`ErrorProvider`, `ErrorAdapter`) |
| `index.ts` | Barrel re-exports all types |

### Type Definition Rules
- This module is the **single source of truth** for all TypeScript types in the library
- All types used across modules MUST be defined here — no inline type definitions in other modules
- Use `interface` for object shapes that may be extended; `type` for unions, intersections, and aliases
- Export all public types from `index.ts` — consumers import types from `unified-error-handling`
- NEVER use `any` in type definitions — use `unknown` for truly unknown values
- All type properties must have JSDoc comments explaining their purpose

### Naming Conventions
- Interfaces: `PascalCase` with descriptive names (`ErrorProvider`, `NormalizedError`)
- Type aliases: `PascalCase` (`ErrorLevel`, `ErrorListener`)
- Generic parameters: Single uppercase letter (`T`, `E`) or descriptive (`TConfig`, `TError`)
- No `I` prefix for interfaces — just `ErrorProvider`, not `IErrorProvider`

### Modification Rules
- Changing a type is a **breaking change** if it removes or narrows a property
- Adding optional properties is safe (non-breaking)
- When modifying types, search all consumers: `grep -r "TypeName" src/`
- Update all adapter implementations when `ErrorAdapter` interface changes


## Sub-agents & Skills — Main-Context-First (IRON-SOLID)
Default/built-in sub-agents (`general-purpose`, `Explore`, `Plan`, `claude`, `fork`, …) do NOT have
access to `/skills`, so delegating to them silently SKIPS the skills RULE #0 requires. Do all
skill-relevant work in the **MAIN context**; use a sub-agent ONLY when a **custom** agent exists in
`.claude/agents/` for that job; a default `Explore`/`Plan` agent is allowed ONLY for read-only,
no-skill search/exploration. When a relevant skill is missing, **install/enable it** rather than
proceeding skill-less. (Owner directive 2026-07-11; full text in `~/.claude/CLAUDE.md`.)
