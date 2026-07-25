# Reported Issues — unified-error-handling

Open defects only. Resolved entries move to `docs/RESOLVED-ISSUES.md` with the fixing version.

Greppable marker: `^### ISSUE-`

**Last Updated:** 2026-07-25

---

### ISSUE-002 — The `firebase` adapter can never load: `firebase/crashlytics` does not exist

- **Status:** OPEN
- **Severity:** High — the adapter is advertised and cannot work in a browser
- **Affected versions:** 2.0.0 through 2.1.1
- **File:** `src/adapters/firebase-adapter.ts:13`

**Symptom.** `await useAdapter('firebase', { firebaseConfig })` always rejects with
`Failed to load Firebase SDK. Please install: yarn add firebase` — and installing `firebase` does not help.

**Root cause.** `loadSDK()` calls `await this.dynamicImport('firebase/crashlytics')`. The Firebase JS SDK
exposes no such subpath; Crashlytics is a native-only Firebase product (Android/iOS, or
`@react-native-firebase/crashlytics`). Verified against `firebase@12.16.0`: its `exports` map contains
`./app` and `./analytics`, and no `./crashlytics`. The `dynamicImport` helper catches the resolution
failure and rethrows the generic "please install firebase" message, which hides the real cause.

**Reproduction.**

```bash
npm pack firebase && tar -xzf firebase-*.tgz
node -p "Object.keys(require('./package/package.json').exports).filter(k=>/crash/.test(k)).length"  # 0
```

**Suggested fix.** Owner decision between: (1) retarget at `@react-native-firebase/crashlytics` and
document the adapter as React-Native-only; (2) use Firebase Analytics `logEvent` for a web-capable error
signal and rename so it does not promise Crashlytics; (3) remove the adapter and document Firebase as
unsupported. Until then the limitation is stated in the README and the adapter is marked in its table.

**Reporter.** Package standardisation pass, 2026-07-25.

---

### ISSUE-003 — `src/react/index.tsx` was dead, broken, and invisible to typecheck

- **Status:** OPEN — file deleted in this pass; the underlying hazard is recorded here
- **Severity:** Medium — a build-tool resolution change would have shipped a broken entry point
- **Affected versions:** 2.0.0 through 2.1.1

**Symptom.** `src/react/index.tsx` imported `./provider`, a module that does not exist, and re-exported
hooks (`useUserContext`, `useErrorRetry`, `useProviderManager`, `useErrorMetrics`, `useErrorDebug`) that
were never implemented. It was a leftover from the pre-2.0 Context-based architecture.

**Why it went unnoticed.** TypeScript drops `index.tsx` from the program when `index.ts` sits beside it —
both resolve to the same module specifier and `.ts` wins. `tsc --noEmit --listFiles` lists only
`src/react/index.ts`. So `yarn typecheck` passed for months over a file that could not compile.

**Why it mattered.** esbuild's default resolution order prefers `.tsx` over `.ts`. The build survived only
because `build:esm` and `build:cjs` name `src/react/index.ts` explicitly. Any move to an extensionless
entry would have silently switched the React entry point to the broken file.

**Fix applied.** File deleted; `dist/` output verified byte-identical before and after, confirming it was
never part of the build.

**Follow-up.** Consider a lint rule or CI check forbidding sibling `index.ts` / `index.tsx` pairs.

**Reporter.** Package standardisation pass, 2026-07-25.

---

### ISSUE-004 — `engines.node` `>=24.13.0` is stricter than the code requires

- **Status:** OPEN — owner decision
- **Severity:** Low — a warning, not a failure, but it deters adoption
- **Affected versions:** 2.1.1

**Symptom.** Installing on Node 20 or 22 LTS emits `EBADENGINE`, and fails outright under
`engine-strict=true`. Node 24.13 entered LTS recently, so most consumers see the warning.

**Assessment.** Published output targets `es2020` (ESM) and `node16` (CJS), and the source uses no API
newer than Node 18. The floor tracks the maintainer's `.nvmrc` rather than a real runtime requirement, and
this is a browser-first library, so the Node floor mostly gates installation.

**Suggested fix.** Lower to the oldest version actually exercised — `>=20.12.0` matches the fleet default —
after confirming the build and the CJS entry load there. **Deliberately not changed in this pass:**
claiming support for a version nobody has tested on is the same defect in the other direction.

**Reporter.** Package standardisation pass, 2026-07-25.

---

### ISSUE-005 — `withErrorBoundary` is exported twice; the richer implementation is unreachable

- **Status:** OPEN
- **Severity:** Low — confusing, no runtime break
- **Affected versions:** 2.0.0 through 2.1.1
- **Files:** `src/react/index.ts:4-5`, `src/react/hoc.tsx:54`, `src/react/with-error-boundary.tsx:7`

**Symptom.** Two different `withErrorBoundary` implementations exist. `src/react/index.ts` does:

```ts
export { withErrorBoundary } from './with-error-boundary';
export * from './hoc';
```

An explicit named export takes precedence over a star export, so consumers always get the simpler
`with-error-boundary.tsx` version. The `hoc.tsx` version, which accepts `WithErrorBoundaryOptions`, is
permanently shadowed and cannot be imported.

**Suggested fix.** Keep one implementation. If the options-aware version is intended, delete
`with-error-boundary.tsx` and let the star export supply it; otherwise remove the duplicate from `hoc.tsx`.
Either way this changes the public surface, so it belongs in a minor release.

**Reporter.** Package standardisation pass, 2026-07-25.

---

### ISSUE-006 — `useErrorListener` and six adapter classes are missing from their entry points

- **Status:** OPEN
- **Severity:** Low
- **Affected versions:** 2.1.1
- **Files:** `src/react/index.ts`, `src/index.ts:43-45`

**Symptom.** Two barrel-file gaps:

1. `useErrorListener` is implemented and exported from `src/react/hooks.ts:122` but omitted from
   `src/react/index.ts`, so `import { useErrorListener } from 'unified-error-handling/react'` fails.
2. `src/index.ts` re-exports only `SentryAdapter`, `FirebaseAdapter` and `CustomAdapter`. The six adapters
   added in 2.1.1 — `DataDogAdapter`, `BugsnagAdapter`, `RollbarAdapter`, `LogRocketAdapter`,
   `RaygunAdapter`, `AppCenterAdapter` — are exported from `src/adapters/index.ts` but not from the package
   root, so a consumer cannot subclass or instantiate them directly.

Both are reachable through supported paths (`subscribe()` and `useAdapter('<name>')`), so nothing is
broken — the surface is just inconsistent.

**Suggested fix.** Add the missing re-exports; purely additive, so a patch release is fine.

**Reporter.** Package standardisation pass, 2026-07-25.

---

### ISSUE-007 — `StorageAdapter` is a public type with no implementation

- **Status:** OPEN
- **Severity:** Low — misleading API surface
- **Affected versions:** 2.0.0 through 2.1.1
- **Files:** `src/store/types.ts:100`, `src/index.ts:32`

**Symptom.** `StorageAdapter` is exported from the package root, implying the offline queue can be backed
by persistent storage. Nothing in `src/` references the type beyond its declaration and its re-export. The
queue is a plain in-memory array (`errorStore.errorQueue`), so a page reload while offline discards
everything queued.

**Suggested fix.** Either implement persistence against this interface, or drop the type from the public
export. The README documents the in-memory behaviour as a limitation in the meantime.

**Reporter.** Package standardisation pass, 2026-07-25.

---

### ISSUE-008 — `AI-INTEGRATION-GUIDE.md` documented an API that does not exist

- **Status:** FIXED in this pass — retained until the release ships
- **Severity:** High — the file ships in the tarball and is written for coding agents
- **Affected versions:** 2.0.0 through 2.1.0

**Symptom.** The guide, included in `files` and therefore installed with the package, contained
instructions that do not match the implementation. The most damaging claimed fan-out:

```js
await useAdapter('console');
await useAdapter('sentry', { dsn: '...' });
captureError(error); // "Sent to console, Sentry, AND Firebase"
```

The store keeps a **single** active adapter — `useAdapter()` reassigns `activeAdapter` and
`sendToAdapter()` dispatches to that one only. An agent following this guide would build a multi-provider
setup that silently discards everything except the last adapter activated.

Also wrong: `useErrorHandler()` destructured as an object (it returns a function); `setContext(key, value)`
(it takes one object); a `sampleRate` config option that does not exist; `type` on breadcrumbs (no such
field); `useErrorBoundary` (never implemented); `createAdapter({ onError, onMessage })` (the contract is
`{ send }`); an adapter table missing `raygun` and `appcenter`; and a relative link to `./Readme.md`.

**Fix applied.** Rewritten against the source; the single-active-adapter behaviour is now stated
explicitly in the guide, the README and the changelog.

**Reporter.** Package standardisation pass, 2026-07-25.
