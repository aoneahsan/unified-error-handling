# src/types/ — AGENTS.md

> Last Updated: 2026-04-03

## Type Definitions Rules for AI Agents

### Module Structure
| File | Purpose |
|------|---------|
| `config.ts` | Configuration types (`ErrorStoreConfig`, `ProviderConfig`) |
| `errors.ts` | Error types (`NormalizedError`, `ErrorLevel`, `ErrorContext`, `Breadcrumb`) |
| `providers.ts` | Provider/adapter interfaces (`ErrorProvider`, `ErrorAdapter`) |
| `index.ts` | Barrel re-exports |

### Rules
- Single source of truth for ALL TypeScript types — no inline types elsewhere
- Use `interface` for extensible shapes; `type` for unions/intersections/aliases
- NEVER use `any` — use `unknown` for truly unknown values
- All type properties must have JSDoc comments
- No `I` prefix — use `ErrorProvider`, not `IErrorProvider`

### Modification Rules
- Removing/narrowing a property = **breaking change**
- Adding optional properties = safe
- When modifying, search consumers: `grep -r "TypeName" src/`
- Update all adapter implementations when `ErrorAdapter` changes

### CLAUDE.md + AGENTS.md Sync Rule
Every rule in this file must also exist in `src/types/CLAUDE.md` and vice versa. Update both together.


## Sub-agents & Skills — Main-Context-First (IRON-SOLID)
Default/built-in sub-agents (`general-purpose`, `Explore`, `Plan`, `claude`, `fork`, …) do NOT have
access to `/skills`, so delegating to them silently SKIPS the skills RULE #0 requires. Do all
skill-relevant work in the **MAIN context**; use a sub-agent ONLY when a **custom** agent exists in
`.claude/agents/` for that job; a default `Explore`/`Plan` agent is allowed ONLY for read-only,
no-skill search/exploration. When a relevant skill is missing, **install/enable it** rather than
proceeding skill-less. (Owner directive 2026-07-11; full text in `~/.claude/CLAUDE.md`.)
