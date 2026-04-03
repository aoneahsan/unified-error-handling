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
