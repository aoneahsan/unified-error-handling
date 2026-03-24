# CLAUDE.md

This file provides guidance for working in the `unified-error-handling` repository.

## Package Manager

This project uses `yarn` as the default workflow.

## Project Overview

`unified-error-handling` is a lightweight, zero-dependency error handling library with dynamic adapter loading for multiple error tracking services. It exposes a framework-agnostic core API plus React-specific error boundary and hook helpers.

## Current Verified State

- Reviewed on: `2026-03-24`
- Package version: `2.1.1`
- Build: `yarn build` passed
- Typecheck: `yarn typecheck` passed
- Tests: `yarn test` passed with 33 tests

## Commands

```bash
yarn build
yarn dev
yarn test
yarn test:watch
yarn test:coverage
yarn lint
yarn format
yarn typecheck
yarn size
yarn analyze
```

## Architecture

- `src/adapters/`: built-in adapters for console/custom plus Sentry, Firebase, DataDog, Bugsnag, Rollbar, LogRocket, Raygun, and AppCenter
- `src/config/`: defaults, validation, merging, and support helpers
- `src/store/`: core error store state
- `src/react/`: React error boundary, HOC, hooks, and related exports
- `src/utils/`: console interception, network interception, enrichment, and shared helpers
- `src/types/`: config, provider, and error typing

## Working Rules

- Keep docs aligned with the actual implemented adapter and React surface. Do not describe the project as “provider implementations not started”.
- Use `yarn` as the documented workflow.
- When refreshing package info, update `Readme.md`, this file, and the dated root portfolio info file in the same pass.
- Preserve the package’s zero-dependency core positioning.

## Root Portfolio File Maintenance Rule

- Maintain exactly one current root portfolio info file for this package.
- File naming format: `UNIFIED-ERROR-HANDLING_portfolio-info_YYYY-MM-DD.md`
- Refresh the portfolio file only after at least 7 days have passed unless a major release or material capability change happens sooner.
- Keep at most 10 update-history records inside the portfolio file.
- When the portfolio file changes, update `Readme.md` and this `CLAUDE.md` in the same pass.

## Package Update History

| Date | Updated By | Notes |
| --- | --- | --- |
| 2026-03-24 | Codex | Refreshed docs, verified package state, added portfolio maintenance rule |
| 2026-02-02 | Claude | Full update to latest versions, all checks passing |

## Comprehensive Audit Record

| Date | Audit Type | Status | Issues Found | Issues Resolved |
| --- | --- | --- | --- | --- |
| 2026-03-24 | Portfolio + Docs Refresh | Passed | 0 | 0 |
| 2026-02-02 | Package Update | Passed | 0 | 0 |
| 2026-01-23 | Full Audit | Passed | 0 | 0 |

### Last Audit Details

- Package Manager: yarn confirmed
- Dependencies: no dependency audit performed in this pass
- Build: passes
- TypeScript: passes
- Tests: passes
- Features: current adapter and React surface reflected in docs

### Next Audit Due: 2026-03-31
