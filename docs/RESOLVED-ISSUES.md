# Resolved Issues — unified-error-handling

Issues removed from the open tracker after their fixes reached the maintained source.

**Last updated:** 2026-10-20

### ISSUE-003 — `src/react/index.tsx` was dead, broken, and invisible to typecheck

- **Status:** RESOLVED in maintained source
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

### ISSUE-008 — `AI-INTEGRATION-GUIDE.md` documented an API that does not exist

- **Status:** RESOLVED in maintained source
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
