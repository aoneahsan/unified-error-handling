# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Capacitor plugin called "unified-error-handling" that provides a unified API for multiple error handling platforms (Firebase Crashlytics, Sentry, DataDog, Bugsnag, etc.) with React-first design and minimal configuration.

The project is currently in the planning phase with a detailed development plan outlined in Readme.md.

## Development Setup

Since this is a new project, initial setup will involve:

```bash
# Initialize the Capacitor plugin structure
npm init @capacitor/plugin unified-error-handling

# Install dependencies
yarn install

# Setup TypeScript configuration
yarn add -D typescript @types/node

# Add development tools
yarn add -D eslint prettier husky lint-staged vitest @vitest/ui
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
yarn dev          # Run in watch mode
yarn build        # Build the plugin
yarn test         # Run tests with Vitest
yarn lint         # Run ESLint
yarn format       # Format with Prettier

# Testing
yarn test:unit    # Unit tests only
yarn test:e2e     # End-to-end tests
yarn test:watch   # Watch mode for tests

# Release
yarn verify       # Verify iOS and Android builds
yarn release      # Create a new release
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

As per the Readme.md, the project is organized into 6 development phases:
- Phase 1: Core Infrastructure (Week 1) - Completed checkmarks indicate this is done
- Phase 2: Provider Implementations (Week 2-4) - Not started
- Phase 3: React Integration (Week 5) - Not started
- Phase 4: Advanced Features (Week 6) - Not started
- Phase 5: Developer Experience (Week 7) - Not started
- Phase 6: Testing & Documentation (Week 8) - Not started

The next immediate tasks would be to:
1. Set up the basic Capacitor plugin structure
2. Implement the base provider abstract class
3. Start with Firebase Crashlytics integration using capacitor-firebase-kit