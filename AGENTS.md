# AGENTS.md — unified-error-handling

> Last Updated: 2026-06-08
> AI Agent Instructions for Unified Error Handling Package Development

## Task Speed Over Docs (IRON-SOLID — BEHAVIORAL)

Finish the real task fast + correctly FIRST; docs/trackers/sync are a footnote (≤~20% of effort) — never let recording outpace the fix. HARD STOP when doc work outpaces the change → ship, then ONE line if anything. No new summary/status/completion files unless asked; edit/delete over add; delete stale docs. Full rule: `~/.claude/CLAUDE.md`. (Est. 2026-06-19)

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
yarn lint            # ESLint
yarn format          # Prettier
yarn typecheck       # TypeScript check
yarn size            # Bundle size check
yarn analyze         # Bundle analysis
```

## Package Manager Hierarchy: nvm → npm (global) → yarn (local) (IRON-SOLID)

Three tiers, each tool ONLY for its tier — for the best, most reproducible dev results:
- **`nvm`** → install/update Node.js (which bundles `npm`): `nvm install --lts`. Use nvm to get/update `npm` itself.
- **`npm`** → ALL global packages: `npm install -g yarn` (install yarn globally if missing) + `npm install -g <pkg>` (every other global CLI).
- **`yarn`** → ALL local project work: `yarn`, `yarn add <pkg>`, `yarn add -D <pkg>` inside the project.

❌ NEVER use `npm`/`pnpm` for LOCAL installs. NEVER use `pnpm` at all. ✅ Only `yarn.lock` in the project — delete `package-lock.json` and `pnpm-lock.yaml`.

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
4. Run full check before publishing: `yarn build && yarn lint && yarn size`
5. Keep docs aligned with actual implemented surface
6. Update `Readme.md`, `CLAUDE.md`, and portfolio file together

## Publishing

```bash
yarn build           # Builds ESM + CJS + types
npm publish          # Publish to npm
```

Pre-publish checklist: build passes, lint passes, size under limits.

## Portfolio Info File — Weekly Update Rule

- Canonical portfolio info file: `/home/ahsan/Documents/ahsan-notebook/static/assets/personal/projects-info-as-portfolio-item/packages/UNIFIED-ERROR-HANDLING_portfolio-info_<YYYY-MM-DD>.md`
- Update at least once per week (and on any material change). Keep the last-updated date in the filename.
- Keep a max-10-entry update history inside the file. On each refresh: prepend today's row, delete the previous dated file, write the new one.
- Tracker: `/home/ahsan/Documents/01-code/docs/tracking/portfolio-info-files-update-tracker.json`
- Last applied: 2026-06-05

## Package Upgrades: Use `npm-check-updates`

For dependency upgrades use `npx -y npm-check-updates -u && yarn install` (latest STABLE), NOT `yarn upgrade --latest`. Full rule in global `~/.claude/CLAUDE.md`. Last applied: 2026-06-05

### Major dependency bumps — holds RESOLVED (2026-06-05)
The 2026-05-29 holds on `typescript` and `eslint` are LIFTED; all gates are green on the new majors. Do NOT pin them back (regresses working committed code).
- `typescript` now `~6.0.3` — `tsconfig.json` migrated to `moduleResolution: "bundler"`, so TS 6 typechecks and emits dual ESM/CJS `.d.ts` cleanly.
- `eslint` now `^10.4.1` — `@eslint/js` (^10.0.1) and `globals` (^17.6.0) are explicit devDependencies, so the flat `eslint.config.js` resolves them; lint passes (0 errors, 8 cosmetic warnings).
- ncu (2026-06-05) additionally bumped `@types/node`→25.9.2 and `@types/react`→19.2.17. No automated test suite remains (Vitest removed under the global testing-removal policy). Verified: typecheck/build/lint all green.

## Architecture

Each `src/` subdirectory has its own `CLAUDE.md` + `AGENTS.md` with domain-specific rules:
- `src/adapters/` — Adapter development contract and patterns
- `src/config/` — Configuration validation and merging
- `src/store/` — Core error store state management
- `src/react/` — React components, hooks, boundaries
- `src/utils/` — Interceptors and enrichment utilities
- `src/types/` — TypeScript type definitions
- `docs/` — Documentation maintenance rules

<!-- project-links:start -->
## Links

- Live: https://www.npmjs.com/package/unified-error-handling
- NPM: https://www.npmjs.com/package/unified-error-handling

_URL source of truth: `01-code/projects/project-live-urls.json` (auto-generated — do not hand-edit between these markers)._
<!-- project-links:end -->
