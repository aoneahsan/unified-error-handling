# CLAUDE.md — unified-error-handling

> Last Updated: 2026-06-08

## Task Speed Over Docs (IRON-SOLID — BEHAVIORAL)

Finish the real task fast + correctly FIRST; docs/trackers/sync are a footnote (≤~20% of effort) — never let recording outpace the fix. HARD STOP when doc work outpaces the change → ship, then ONE line if anything. No new summary/status/completion files unless asked; edit/delete over add; delete stale docs. Full rule: `~/.claude/CLAUDE.md`. (Est. 2026-06-19)

## Project Identity

| Property | Value |
|----------|-------|
| Package | `unified-error-handling` |
| Version | `2.1.1` |
| License | MIT |
| Type | Zero-dependency error handling library |
| Package Manager | `yarn` (ONLY — no npm/pnpm for local work) |
| Node.js | >= 24.13.0 |

## Package Manager Hierarchy: nvm → npm (global) → yarn (local) (IRON-SOLID)

Three tiers, each tool ONLY for its tier — for the best, most reproducible dev results:
- **`nvm`** → install/update Node.js (which bundles `npm`): `nvm install --lts`. Use nvm to get/update `npm` itself.
- **`npm`** → ALL global packages: `npm install -g yarn` (install yarn globally if missing) + `npm install -g <pkg>` (every other global CLI).
- **`yarn`** → ALL local project work: `yarn`, `yarn add <pkg>`, `yarn add -D <pkg>` inside the project.

❌ NEVER use `npm`/`pnpm` for LOCAL installs. NEVER use `pnpm` at all. ✅ Only `yarn.lock` in the project — delete `package-lock.json` and `pnpm-lock.yaml`.

## Current Verified State

- Reviewed on: `2026-06-05`
- Version: `2.1.1`
- Typecheck: `yarn typecheck` passed (TypeScript 6.0.3)
- Build: `yarn build` passed (ESM + CJS + types)
- Lint: `yarn lint` passed (ESLint 10.4.1 flat config — 0 errors, 8 `preserve-caught-error` warnings, cosmetic/pre-existing from the new ESLint 10 rule set)
- Tests: N/A — no automated test suite in this repo (Vitest infra removed under the global testing-removal policy; `package.json` has no `test` script and there are no `*.test.ts` files). Running tests as a gate is therefore not applicable.
- Bundle size: core `dist/index.js` = 6.98 KB (limit 10 KB ✓); React `dist/react/index.js` = 10.08 KB vs 8 KB budget — pre-existing overage from the grown React surface (extra hooks/HOCs), NOT a build failure (`yarn size` exits non-zero only because the React budget is exceeded). Revisit the budget or trim the React entry before next release.
- ncu (2026-06-05): bumped only `@types/node` ^25.9.1→^25.9.2 and `@types/react` ^19.2.16→^19.2.17 (type-only dev deps); gates re-verified green.

### Previously-held major bumps — NOW RESOLVED (2026-06-05)
The 2026-05-29 holds on `typescript` and `eslint` have been LIFTED: a subsequent committed migration unblocked both, and all gates are green on the new majors. **Do NOT pin these back** — that would regress working committed code.
- **`typescript` now `~6.0.3`** (was held at 5.9): the blocker was `moduleResolution: "node"` becoming a hard error in TS 6. `tsconfig.json` was migrated to `moduleResolution: "bundler"`, so TS 6 typechecks and emits dual ESM/CJS `.d.ts` cleanly.
- **`eslint` now `^10.4.1`** (was held at 9): the blocker was ESLint 10 unbundling `@eslint/js`/`globals`. Both are now explicit devDependencies (`@eslint/js` ^10.0.1, `globals` ^17.6.0), so the flat `eslint.config.js` resolves them and lint passes.
- All other devDependencies are at latest stable (esbuild 0.28, @typescript-eslint 8.60, @types/node 25.9.2, @types/react 19.2.17, lint-staged 17, prettier 3.8.3, size-limit 12.1, rimraf 6.1.3).

## Commands

```bash
yarn build          # ESM + CJS + types
yarn dev            # Watch mode
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

- Keep docs aligned with actual implemented adapter and React surface. Do not describe the project as "provider implementations not started".
- Use `yarn` as the documented workflow — never npm/pnpm for local work
- When refreshing package info, update `Readme.md`, this file, and the portfolio info file in the same pass
- Preserve the package's zero-dependency core positioning
- Bundle size limits: Core <10KB, React <8KB — check with `yarn size` before any release

## Portfolio Info File — Weekly Update Rule

- Canonical portfolio info file: `/home/ahsan/Documents/ahsan-notebook/static/assets/personal/projects-info-as-portfolio-item/packages/UNIFIED-ERROR-HANDLING_portfolio-info_<YYYY-MM-DD>.md`
- Update at least once per week (and on any material change). Keep the last-updated date in the filename.
- Keep a max-10-entry update history inside the file. On each refresh: prepend today's row, delete the previous dated file, write the new one.
- Tracker: `/home/ahsan/Documents/01-code/docs/tracking/portfolio-info-files-update-tracker.json`
- Last applied: 2026-06-05
- When the portfolio file changes, also update `Readme.md` and this `CLAUDE.md` in the same pass.

## Package Upgrades: Use `npm-check-updates`

For dependency upgrades use `npx -y npm-check-updates -u && yarn install` (latest STABLE), NOT `yarn upgrade --latest`. Full rule in global `~/.claude/CLAUDE.md`. For this PUBLISHED package, hold back only genuinely build-breaking majors and record them above. Last applied: 2026-06-05

## Package Update History

| Date | Updated By | Notes |
|------|-----------|-------|
| 2026-06-05 | Claude | Portfolio re-refresh (2026-05-29→2026-06-05). ncu bumped `@types/node`+`@types/react` patches. Confirmed prior TS 6 / ESLint 10 migration is green (tsconfig→`moduleResolution:bundler`; explicit `@eslint/js`/`globals`); lifted the stale holds in docs. typecheck/build/lint all pass; no test suite (testing infra removed). |
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
- Dependencies: no dependency audit performed in this pass
- Build: passes
- TypeScript: passes
- Features: current adapter and React surface reflected in docs
- CLAUDE.md/AGENTS.md: split into optimized nested structure

### Next Audit Due: 2026-04-06

<!-- project-links:start -->
## Links

- Live: https://www.npmjs.com/package/unified-error-handling
- NPM: https://www.npmjs.com/package/unified-error-handling

_URL source of truth: `01-code/projects/project-live-urls.json` (auto-generated — do not hand-edit between these markers)._
<!-- project-links:end -->
