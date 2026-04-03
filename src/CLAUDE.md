# src/ — CLAUDE.md

> Last Updated: 2026-04-03

## Source Code Conventions

### File Organization
- Each subdirectory is a self-contained module with its own `index.ts` barrel export
- Keep files under 500 lines — split into focused modules when approaching limit
- Every subdirectory has its own `CLAUDE.md` + `AGENTS.md` with domain-specific rules

### Naming Conventions
- Files: `kebab-case.ts` (e.g., `base-adapter.ts`, `error-boundary.tsx`)
- Types/Interfaces: `PascalCase` (e.g., `ErrorAdapter`, `NormalizedError`)
- Functions/variables: `camelCase` (e.g., `captureError`, `errorStore`)
- Constants: `UPPER_SNAKE_CASE` for true constants, `camelCase` for config objects
- Test files: `*.test.ts` colocated with source (e.g., `defaults.test.ts`)

### Import Rules
- Use relative imports within `src/` (e.g., `../store/types`)
- Barrel exports via `index.ts` in each module
- Never import from `dist/` — always from source
- Keep circular dependency chains impossible: types -> config -> store -> adapters/utils -> react

### Zero-Dependency Rule
- NEVER add production dependencies to `package.json`
- All adapter SDKs are loaded dynamically via `import()` at runtime
- Only `devDependencies` are allowed (build tools, testing, linting)

### Testing Patterns
- Test runner: Vitest (NEVER Jest)
- Colocate test files with source: `foo.ts` -> `foo.test.ts`
- Test adapters with mocked SDK imports
- Test React components with Vitest + happy-dom/jsdom
- Run `yarn test` before committing any changes

### TypeScript
- Strict mode enabled — no `any` unless interfacing with unknown SDK types
- Use `type` imports for type-only references: `import type { ... }`
- All public API functions must have JSDoc comments
- `_param` prefix only for required-but-unused interface params
