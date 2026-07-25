# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.1] - 2026-07-25

Six new adapters, and a fix that restores the package's TypeScript declarations.

### Fixed
- **Bundled type declarations now resolve.** `package.json` advertised `dist/index.d.ts` and
  `dist/react/index.d.ts`, but `tsconfig.json` emitted them under `dist/esm/`. Both `exports` subpaths
  therefore pointed at files that were not in the tarball, so every TypeScript consumer of 2.1.0 and
  earlier got no types at all. `outDir` is now `dist`, and all nine `exports` targets are verified present
  on disk before publish.
- **The original failure is preserved when an SDK fails to load.** All eight vendor adapters now attach
  `{ cause }` to the wrapped `Failed to load <SDK>` error, so the underlying dynamic-import failure survives
  in the error chain instead of being swallowed.
- Install hints in adapter load errors now say `yarn add`, matching the project's package manager.

### Added
- **Six adapters**: `datadog`, `bugsnag`, `rollbar`, `logrocket`, `raygun` and `appcenter`. Each loads its
  vendor SDK dynamically on activation, exactly like the existing `sentry` and `firebase` adapters.
- `SUPPORT_CONFIG` in `src/config/support.ts`.

### Changed
- **No source maps in the published tarball.** 2.1.0 shipped `.js.map` and `.d.ts.map` files; the build no
  longer emits them.
- `CHANGELOG.md` is now included in the published package — earlier releases omitted it from `files`, so an
  installed copy carried no version history.
- `README.md` rewritten to the current documentation standard, and renamed from `Readme.md` so the `files`
  allowlist matches on case-sensitive filesystems.
- `package.json` gains `homepage` (the documentation site) and `funding`.
- Dependencies upgraded to latest stable; TypeScript held at `~6.0.3` and ESLint at 10.x.

### Removed
- The Cypress test harness and the remaining automated-testing scaffolding.

### Known limitations
- Only one adapter is active at a time; `useAdapter()` replaces the previous one rather than adding a
  second destination.
- The `firebase` adapter imports `firebase/crashlytics`, which the Firebase JS SDK does not expose, so it
  cannot load in a browser. See `docs/REPORTED-ISSUES.md`.

## [2.1.0] - 2025-12-27

_Reconstructed from git history — this release was published without a changelog entry._

### Changed
- Development dependencies upgraded to latest stable, including size-limit 12, ESLint 9.39 and esbuild 0.27.
- Build scripts switched to the project's package manager of the day.

No source files changed in this release; the public API is identical to 2.0.1.

## [2.0.1] - 2025-09-06

_Reconstructed from git history — this release was published without a changelog entry._

### Changed
- Version bump only. No source or dependency changes from 2.0.0.

## [2.0.0] - 2025-08-02

### 🚀 Major Breaking Changes

This is a complete rewrite of the unified-error-handling library with a focus on zero dependencies, provider-less architecture, and universal JavaScript support.

### Added
- **Provider-less Architecture**: No React Context required - works in any component
- **Zero Dependencies**: Core library has absolutely no runtime dependencies
- **Dynamic Adapter Loading**: Adapters load their SDKs only when used
- **Tree-shakeable Exports**: Only bundle what you use
- **Universal Support**: Works in browsers, Node.js, React Native
- **Singleton Store Pattern**: Global error handling without providers
- **Custom Adapter Support**: Easy API to create your own adapters
- **Offline Queue**: Automatic retry for errors captured while offline
- **Enhanced Error Enrichment**: Automatic device, browser, and context information
- **Console & Network Interceptors**: Capture console.error and failed network requests
- **TypeScript Support**: Full type safety with comprehensive type definitions

### Changed
- **Complete Architecture Overhaul**: Moved from Capacitor plugin to universal library
- **Adapter System**: Providers are now called "adapters" with dynamic loading
- **React Integration**: Optional React hooks that work without Context
- **API Surface**: Simplified API with direct function exports
- **Build System**: Switched to esbuild for faster, cleaner builds
- **Bundle Size**: Significantly reduced core bundle size (~10KB)

### Removed
- **Capacitor Dependency**: No longer requires Capacitor
- **Native Code**: Removed Android/iOS native implementations
- **Provider Dependencies**: No built-in provider SDKs
- **React Context Requirement**: Works without wrapping app in provider

### Migration Guide

#### From 1.x (Capacitor Plugin)
```javascript
// Before
import { UnifiedErrorHandling } from 'capacitor-unified-error-handling';
await UnifiedErrorHandling.initialize({ provider: 'sentry' });
await UnifiedErrorHandling.captureError({ error });

// After
import { initialize, useAdapter, captureError } from 'unified-error-handling';
initialize();
await useAdapter('sentry', { dsn: 'your-dsn' });
captureError(error);
```

#### React Context Migration
```javascript
// Before
<ErrorProvider config={config}>
  <App />
</ErrorProvider>

// After - No provider needed!
// Just initialize in your app entry
initialize({ enableGlobalHandlers: true });
```

## [1.0.0] - Previous Version

- Initial release as Capacitor plugin
- Support for Firebase Crashlytics, Sentry, DataDog, Bugsnag
- React Context-based error handling
- Native Android and iOS implementations