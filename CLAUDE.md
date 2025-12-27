# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📦 Package Manager: pnpm (CRITICAL)

**This project uses pnpm exclusively for package management.**

### Package Manager Hierarchy
- **npm**: ONLY for installing pnpm globally (if not available): `npm install -g pnpm`
- **pnpm**: For EVERYTHING ELSE (dependencies, scripts, global packages)

### Commands
```bash
# Install dependencies
pnpm install

# Add packages
pnpm add <package>
pnpm add -D <package>        # Dev dependency

# Run scripts
pnpm dev                     # Development mode
pnpm build                   # Build the project
pnpm test                    # Run tests
pnpm lint                    # Lint code
pnpm format                  # Format code

# Update packages
pnpm update --latest         # Update to latest versions
```

### Lock Files
- ✅ Use `pnpm-lock.yaml`
- ❌ Delete `yarn.lock` and `package-lock.json` if found

## Project Overview

This is a lightweight, zero-dependency error handling library called "unified-error-handling" that provides a unified API for multiple error handling platforms (Firebase Crashlytics, Sentry, DataDog, Bugsnag, etc.) with React-first design and dynamic adapter loading.

## Development Setup

```bash
# Install dependencies
pnpm install

# Setup TypeScript configuration (already configured)
pnpm add -D typescript @types/node

# Add development tools (already configured)
pnpm add -D eslint prettier husky lint-staged vitest @vitest/ui
```

## Key Architecture Decisions

### Provider Pattern
- All error providers extend from `base.provider.ts`
- Each provider has its own directory under `src/providers/`
- Provider-specific types are kept in separate `.types.ts` files

### React Integration
- Error handling is exposed through React Context (`src/react/provider.tsx`)
- Custom hooks provide easy access to error handling functions
- Error Boundary component wraps React component trees

### Native Bridge
- Platform-specific code goes in `android/` and `ios/` directories
- Web implementation in `src/web.ts`
- Native bridge interface defined in `src/native/bridge.ts`

## Development Commands

```bash
# Development
pnpm dev              # Run in watch mode
pnpm build            # Build the plugin
pnpm test             # Run tests with Vitest
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier

# Testing
pnpm test:watch       # Watch mode for tests
pnpm test:coverage    # Run tests with coverage

# Type checking
pnpm typecheck        # Run TypeScript type checking

# Size analysis
pnpm size             # Check bundle size
pnpm analyze          # Analyze bundle size
```

## Implementation Guidelines

### Adding a New Provider
1. Create directory: `src/providers/{provider-name}/`
2. Implement provider extending `BaseProvider` class
3. Define provider-specific types in `{provider-name}.types.ts`
4. Add provider to the registry in `src/providers/index.ts`
5. Update TypeScript definitions in `src/definitions.ts`
6. Add tests in `src/providers/{provider-name}/__tests__/`

### React Component Development
- All React components should be functional with TypeScript
- Use the custom hooks from `src/react/hooks.ts`
- Error boundaries should use the provided `ErrorBoundary` component
- Follow React 18+ best practices with proper error handling

### Testing Strategy
- Unit tests for each provider implementation
- Integration tests for React components
- Mock native implementations for web testing
- Use Vitest for all JavaScript/TypeScript tests

## Important Patterns

### Error Normalization
All errors must be normalized through `src/utils/error-normalizer.ts` before being sent to providers. This ensures consistent error format across all platforms.

### Breadcrumb Management
Breadcrumbs are managed centrally through `src/utils/breadcrumb-manager.ts` with a configurable maximum count.

### Offline Queue
Errors that occur offline are queued in `src/utils/storage.ts` and retried when connection is restored.

## Current Development Status

The project is organized into 6 development phases:
- Phase 1: Core Infrastructure - Completed
- Phase 2: Provider Implementations - Not started
- Phase 3: React Integration - Not started
- Phase 4: Advanced Features - Not started
- Phase 5: Developer Experience - Not started
- Phase 6: Testing & Documentation - Not started

The next immediate tasks would be to:
1. Set up the basic Capacitor plugin structure
2. Implement the base provider abstract class
3. Start with Firebase Crashlytics integration using capacitor-firebase-kit
