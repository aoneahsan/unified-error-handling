# src/ — AGENTS.md

> Last Updated: 2026-04-03

## Source Code Conventions for AI Agents

### File Organization
- Each subdirectory is a self-contained module with its own `index.ts` barrel export
- Keep files under 500 lines — split into focused modules when approaching limit
- Every subdirectory has its own `CLAUDE.md` + `AGENTS.md` with domain-specific rules

### Naming Conventions
- Files: `kebab-case.ts` (e.g., `base-adapter.ts`, `error-boundary.tsx`)
- Types/Interfaces: `PascalCase` (e.g., `ErrorAdapter`, `NormalizedError`)
- Functions/variables: `camelCase` (e.g., `captureError`, `errorStore`)
- Constants: `UPPER_SNAKE_CASE` for true constants, `camelCase` for config objects

### Import Rules
- Use relative imports within `src/` (e.g., `../store/types`)
- Barrel exports via `index.ts` in each module
- Never import from `dist/` — always from source
- Dependency order (no circular imports): types -> config -> store -> adapters/utils -> react

### Zero-Dependency Rule
- NEVER add production dependencies to `package.json`
- All adapter SDKs are loaded dynamically via `import()` at runtime
- Only `devDependencies` are allowed (build tools, testing, linting)

### TypeScript
- Strict mode enabled — no `any` unless interfacing with unknown SDK types
- Use `type` imports for type-only references: `import type { ... }`
- All public API functions must have JSDoc comments
- `_param` prefix only for required-but-unused interface params

### CLAUDE.md + AGENTS.md Sync Rule
Every rule in this file must also exist in `src/CLAUDE.md` and vice versa. Update both together.


## Sub-agents & Skills — Main-Context-First (IRON-SOLID)
Default/built-in sub-agents (`general-purpose`, `Explore`, `Plan`, `claude`, `fork`, …) do NOT have
access to `/skills`, so delegating to them silently SKIPS the skills RULE #0 requires. Do all
skill-relevant work in the **MAIN context**; use a sub-agent ONLY when a **custom** agent exists in
`.claude/agents/` for that job; a default `Explore`/`Plan` agent is allowed ONLY for read-only,
no-skill search/exploration. When a relevant skill is missing, **install/enable it** rather than
proceeding skill-less. (Owner directive 2026-07-11; full text in `~/.claude/CLAUDE.md`.)
