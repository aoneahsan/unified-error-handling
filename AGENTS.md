# AGENTS.md - Unified Error Handling

> AI Agent Instructions for Unified Error Handling Package Development

## Project Overview

Lightweight, zero-dependency error handling library with dynamic adapter loading for multiple error tracking services.

| Property | Value |
|----------|-------|
| Package Name | `unified-error-handling` |
| Version | 2.1.1 |
| License | MIT |
| Repository | Public |

### Supported Services
Sentry, Firebase Crashlytics, Bugsnag, Rollbar, Datadog, LogRocket, Raygun, AppCenter

### Features
- Zero required dependencies
- Dynamic adapter loading
- React error boundaries
- Size-limited (<10KB core, <8KB React)

## Agent Responsibilities

| Agent | Role |
|-------|------|
| **Claude Code** | Primary implementation. Writes code, runs tests, publishes. |
| **Codex** | Reviews, provides specs. Does NOT implement unless explicitly requested. |

## Setup Instructions

### Prerequisites
- Node.js >= 24.13.0
- Yarn

### Installation
```bash
yarn install
```

## Build & Test Commands

| Command | Purpose |
|---------|---------|
| `yarn build` | ESM + CJS + types build |
| `yarn build:esm` | ESM only |
| `yarn build:cjs` | CommonJS only |
| `yarn build:types` | TypeScript declarations |
| `yarn dev` | Watch mode |
| `yarn lint` | ESLint |
| `yarn format` | Prettier |
| `yarn typecheck` | TypeScript check |
| `yarn test` | Run Vitest once |
| `yarn test:watch` | Watch mode |
| `yarn test:coverage` | Coverage report |
| `yarn size` | Check bundle size |
| `yarn analyze` | Analyze bundle |

## Code Style & Conventions

### Module Exports
```typescript
// Main
import { ErrorHandler } from 'unified-error-handling';

// React (error boundaries, hooks)
import { ErrorBoundary, useErrorHandler } from 'unified-error-handling/react';
```

### Bundle Size Limits
- Core: 10KB max
- React: 8KB max

## Project-Specific Rules

### DO NOTs
1. **NEVER** add required dependencies
2. **NEVER** exceed bundle size limits
3. **NEVER** break adapter interfaces

### DOs
1. **DO** keep zero-dependency core
2. **DO** use dynamic imports for adapters
3. **DO** run size checks before release

## Testing Requirements

Before publishing:
```bash
yarn build       # Must pass
yarn test        # Must pass
yarn lint        # Must pass
yarn size        # Must be under limits
```

## Publishing

```bash
yarn prepublishOnly  # Builds
npm publish
```
