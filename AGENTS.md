# AGENTS.md — unified-error-handling

> Last Updated: 2026-04-03
> AI Agent Instructions for Unified Error Handling Package Development

## Project Identity

| Property | Value |
|----------|-------|
| Package | `unified-error-handling` |
| Version | `2.1.1` |
| License | MIT |
| Repository | Public |
| Package Manager | `yarn` |
| Node.js | >= 24.13.0 |

### Supported Services
Sentry, Firebase Crashlytics, Bugsnag, Rollbar, Datadog, LogRocket, Raygun, AppCenter

### Core Constraints
- Zero required dependencies
- Dynamic adapter loading via `import()`
- Bundle size: Core <10KB, React <8KB
- React error boundaries + hooks (peer dep, optional)

## Agent Responsibilities

| Agent | Role |
|-------|------|
| **Claude Code** | Primary implementation. Writes code, runs tests, publishes. |
| **Codex** | Reviews, provides specs. Does NOT implement unless explicitly requested. |

## Setup & Commands

```bash
yarn install         # Install dependencies
yarn build           # ESM + CJS + types build
yarn dev             # Watch mode
yarn test            # Vitest once
yarn test:watch      # Watch mode
yarn test:coverage   # Coverage report
yarn lint            # ESLint
yarn format          # Prettier
yarn typecheck       # TypeScript check
yarn size            # Bundle size check
yarn analyze         # Bundle analysis
```

## Module Exports

```typescript
// Core
import { ErrorHandler } from 'unified-error-handling';
// React (error boundaries, hooks)
import { ErrorBoundary, useErrorHandler } from 'unified-error-handling/react';
```

---

## CRITICAL RULES

### 1. CLAUDE.md + AGENTS.md Sync Rule (IRON-SOLID)

**Every important rule MUST exist in BOTH `CLAUDE.md` AND `AGENTS.md` at each level.**
- When adding/updating a rule in one file, ALWAYS update the other
- This applies to root AND all nested files
- Never add a rule to just one file — always both

### 2. CLAUDE.md + AGENTS.md Update Frequency (IRON-SOLID)

**ALL `CLAUDE.md` and `AGENTS.md` files MUST be reviewed and updated at least once every 3 days.**
- On every session start, check `Last Updated` dates across all project files
- If any file is >3 days stale, update it BEFORE proceeding with other work
- Every file must have a `Last Updated` date field

### 3. Claude Code Agents Usage (MANDATORY)

**For EVERY prompt and task, Claude Code MUST use agents to deliver the best possible experience.**
- **Explore agent**: Codebase search, file discovery, architecture understanding
- **Plan agent**: Implementation planning, architecture decisions
- **general-purpose agent**: Complex multi-step tasks, parallel processing
- Use agents proactively — don't wait for tasks to become complex
- Launch multiple agents in parallel when tasks are independent
- Use Explore agent before making changes to unfamiliar code

### 4. Nested CLAUDE.md + AGENTS.md Files (MANDATORY)

- Create reasonable nested `CLAUDE.md` and `AGENTS.md` files in all important folders
- Rules in nested files improve development results for that specific area
- Keep nested files focused and concise — they should NOT duplicate root rules
- Each nested pair must stay in sync with each other

---

## Project-Specific Rules

### NEVER
1. Add required production dependencies — zero-dependency core is non-negotiable
2. Exceed bundle size limits (10KB core, 8KB React)
3. Break existing adapter interfaces (BaseAdapter contract)
4. Use npm/pnpm for local project work — yarn only
5. Leave TODO/FIXME comments — implement or ask

### ALWAYS
1. Keep zero-dependency core positioning
2. Use dynamic `import()` for adapter SDK loading
3. Run `yarn size` before any release
4. Run full check before publishing: `yarn build && yarn test && yarn lint && yarn size`
5. Keep docs aligned with actual implemented surface
6. Update `Readme.md`, `CLAUDE.md`, and portfolio file together

## Publishing

```bash
yarn build           # Builds ESM + CJS + types
npm publish          # Publish to npm
```

Pre-publish checklist: build passes, tests pass, lint passes, size under limits.

## Architecture

Each `src/` subdirectory has its own `CLAUDE.md` + `AGENTS.md` with domain-specific rules:
- `src/adapters/` — Adapter development contract and patterns
- `src/config/` — Configuration validation and merging
- `src/store/` — Core error store state management
- `src/react/` — React components, hooks, boundaries
- `src/utils/` — Interceptors and enrichment utilities
- `src/types/` — TypeScript type definitions
- `docs/` — Documentation maintenance rules
