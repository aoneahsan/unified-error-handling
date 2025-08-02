# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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