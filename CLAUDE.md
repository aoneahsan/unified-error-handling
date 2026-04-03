# CLAUDE.md — unified-error-handling

> Last Updated: 2026-04-03

## Project Identity

| Property | Value |
|----------|-------|
| Package | `unified-error-handling` |
| Version | `2.1.1` |
| License | MIT |
| Type | Zero-dependency error handling library |
| Package Manager | `yarn` (ONLY — no npm/pnpm for local work) |
| Node.js | >= 24.13.0 |

## Current Verified State

- Reviewed on: `2026-03-24`
- Build: `yarn build` passed
- Typecheck: `yarn typecheck` passed
- Tests: `yarn test` passed with 33 tests

## Commands

```bash
yarn build          # ESM + CJS + types
yarn dev            # Watch mode
yarn test           # Vitest once
yarn test:watch     # Watch mode
yarn test:coverage  # Coverage report
yarn lint           # ESLint
yarn format         # Prettier
yarn typecheck      # TypeScript check
yarn size           # Bundle size check
yarn analyze        # Bundle analysis
```

## Architecture Overview

| Directory | Purpose |
|-----------|---------|
| `src/adapters/` | Service adapters: console, custom, Sentry, Firebase, DataDog, Bugsnag, Rollbar, LogRocket, Raygun, AppCenter |
| `src/config/` | Defaults, validation, merging, support helpers |
| `src/store/` | Core error store state management |
| `src/react/` | ErrorBoundary, HOC, hooks, React exports |
| `src/utils/` | Console/network interception, error enrichment |
| `src/types/` | Config, provider, and error TypeScript types |
| `docs/` | API docs, guides, provider docs, project status |

Each subdirectory has its own `CLAUDE.md` + `AGENTS.md` with domain-specific rules. Only the root files are loaded by default — nested files load only when working in that directory.

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

## Working Rules

- Keep docs aligned with actual implemented adapter and React surface
- Use `yarn` as the documented workflow — never npm/pnpm for local work
- When refreshing package info, update `Readme.md`, this file, and the portfolio info file in the same pass
- Preserve the package's zero-dependency core positioning
- Bundle size limits: Core <10KB, React <8KB — check with `yarn size` before any release

## Root Portfolio File Maintenance Rule

- Maintain exactly one current root portfolio info file
- File naming: `UNIFIED-ERROR-HANDLING_portfolio-info_YYYY-MM-DD.md`
- Refresh only after at least 7 days unless a major release happens sooner
- Keep at most 10 update-history records inside the portfolio file
- When the portfolio file changes, update `Readme.md` and this `CLAUDE.md` in the same pass

## Package Update History

| Date | Updated By | Notes |
|------|-----------|-------|
| 2026-04-03 | Claude | Split CLAUDE.md/AGENTS.md into optimized nested structure |
| 2026-03-24 | Codex | Refreshed docs, verified package state, added portfolio maintenance rule |
| 2026-02-02 | Claude | Full update to latest versions, all checks passing |

## Comprehensive Audit Record

| Date | Audit Type | Status | Issues Found | Issues Resolved |
|------|-----------|--------|-------------|----------------|
| 2026-04-03 | CLAUDE.md/AGENTS.md Optimization | Passed | 0 | 0 |
| 2026-03-24 | Portfolio + Docs Refresh | Passed | 0 | 0 |
| 2026-02-02 | Package Update | Passed | 0 | 0 |
| 2026-01-23 | Full Audit | Passed | 0 | 0 |

### Last Audit Details

- Package Manager: yarn confirmed
- Build: passes
- TypeScript: passes
- Tests: passes
- Features: current adapter and React surface reflected in docs
- CLAUDE.md/AGENTS.md: split into optimized nested structure

### Next Audit Due: 2026-04-06
