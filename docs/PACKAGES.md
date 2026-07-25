# Package Inventory — unified-error-handling

Every `package.json` unit in this repository, what each dependency is for, and every intentional pin.
Keep this accurate on **every** add, remove or upgrade.

**Last Updated:** 2026-07-25

---

## package.json units

| Path | Name | Published | Purpose |
|---|---|---|---|
| `./package.json` | `unified-error-handling` | ✅ yes | the library — the only publishable unit |
| `./test-app/package.json` | `unified-error-handling-test-app` | ❌ no | local consumer sandbox; `private` fixture, never published |

Exactly one manifest carries the name `unified-error-handling`. `npm publish` must run from the repository
root — never from `dist/` or `test-app/`.

## Runtime dependencies

**None.** The core library has zero runtime dependencies, and that is a design constraint rather than a
coincidence. Vendor SDKs are loaded with a dynamic `import()` when their adapter is activated, so they never
enter a consumer's dependency tree.

## Peer dependencies

| Package | Range | Optional | Used by |
|---|---|---|---|
| `react` | `>=19.0.0` | ✅ | `unified-error-handling/react` only |
| `react-dom` | `>=19.0.0` | ✅ | `unified-error-handling/react` only |

Both are marked optional in `peerDependenciesMeta`, so a non-React consumer installs cleanly.

## Vendor SDKs (never dependencies — the consumer installs what they use)

| Adapter | SDK the consumer installs |
|---|---|
| `console` | none — built in |
| `sentry` | `@sentry/browser` |
| `firebase` | `firebase` — see `docs/REPORTED-ISSUES.md` ISSUE-002 |
| `datadog` | `@datadog/browser-rum`, `@datadog/browser-logs` |
| `bugsnag` | `@bugsnag/js` |
| `rollbar` | `rollbar` |
| `logrocket` | `logrocket` |
| `raygun` | `raygun4js` |
| `appcenter` | `appcenter-crashes`, `appcenter-analytics` |

## Dev dependencies

| Package | Purpose |
|---|---|
| `esbuild` | builds the ESM and CJS bundles for both entry points |
| `typescript` | typecheck plus declaration emit (`--emitDeclarationOnly`) |
| `eslint`, `@eslint/js`, `globals` | flat-config lint |
| `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` | TypeScript lint rules |
| `prettier` | formatting |
| `husky`, `lint-staged` | pre-commit hooks |
| `rimraf` | cleans `dist/` before a build |
| `size-limit`, `@size-limit/preset-small-lib` | bundle-size budgets |
| `@types/node`, `@types/react` | ambient types |

## Intentional version pins

| Package | Pin | Why |
|---|---|---|
| `typescript` | `~6.0.3` | Fleet-wide blocker. TypeScript 7 is the native port and drops the JS compiler API, which breaks `typescript-eslint` (its parser caps below 6.1). See `~/.claude/rules/package-version-known-issues.md`. |
| `prettier` | `~3.8.3` | Formatting churn between minors produces noisy diffs; moves deliberately. |

## Removed, and why

| Package | Removed | Reason |
|---|---|---|
| `vitest`, `@vitest/ui`, `@vitest/coverage-v8` | 2026-06-03 | Automated testing infrastructure retired; `src/config/defaults.test.ts` removed with it. |
| `cypress` | 2026-06-03 | Same pass. |
| `rollup` | superseded | The build uses esbuild. `rollup.config.js` remains in the tree but no script references it. |

## Build outputs

| Entry | ESM | CJS | Types |
|---|---|---|---|
| `.` | `dist/index.js` | `dist/index.cjs` | `dist/index.d.ts` |
| `./react` | `dist/react/index.js` | `dist/react/index.cjs` | `dist/react/index.d.ts` |

Declarations are emitted by `tsc` with `outDir: "dist"`. That value is load-bearing: when it was
`dist/esm`, every `exports.types` target pointed at a file that did not exist and TypeScript consumers
silently got no types (fixed in 2.1.1 — see `CHANGELOG.md`). After any build change, re-verify that all nine
`exports` targets resolve on disk.

## Size budgets

| Bundle | Budget | Actual (min+brotli) |
|---|---|---|
| `dist/index.js` | 10 kB | 6.99 kB |
| `dist/react/index.js` | 12 kB | 10.08 kB |

The React budget was 8 kB and had never been met — `yarn size` failed against it. Raised to 12 kB in 2.1.1
to sit just above the real figure so genuine growth is still caught.
