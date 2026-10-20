# Unified Error Handling project guidance

**Last context pass:** 2026-10-20. **Next routine context pass:** 2026-11-19.

## Start here

This public `aoneahsan/unified-error-handling` repository publishes the `unified-error-handling` npm package. The separate public docs repository is `/home/ahsan/Documents/01-code/projects/unified-error-handling-docs` and deploys to `https://unified-error-handling-docs.aoneahsan.com` through GitHub Pages. Read this pair and the nearest scoped pair before editing. Current fleet state lives in the workspace maintenance tracker.

## Product contract

- Version `2.1.1` exposes `.` and `./react` as ESM, CJS, and TypeScript declarations.
- The core has no runtime dependencies. React and React DOM are optional peers for the React entry.
- Adapters load consumer-installed SDKs dynamically. Keep the single-active-adapter behavior and do not imply fan-out.
- Bundle limits are 10 kB for `dist/index.js` and 12 kB for `dist/react/index.js` under `size-limit`.
- Open implementation defects are recorded in `docs/REPORTED-ISSUES.md`; do not claim an affected adapter or export works until its entry is resolved.

## Repository map

- `src/` owns the library; its domain folders have focused guides.
- `scripts/` contains package utilities, `examples/` contains consumer examples, and `test-app/` is a private manual sandbox.
- `docs/` holds package maintenance records. Public user documentation belongs in the separate docs repository.
- `dist/` is generated and ignored. Never hand-edit it.

## Working rules

Use Yarn for local work. Never install, import, vendor, or copy an owner-created client package, including `@perkforce/tool-kit`. This repository is public: ignore every real environment file, token, key, credential, package archive, and local agent setting. Keep only placeholder examples. Keep README and docs claims traceable to source or current command output.

Use the current supported API when fixing build or package fallout. Preserve explicit ESM/CJS/type exports, dynamic adapter imports, source-map exclusions, and the zero-runtime-dependency core. Do not revive obsolete Rollup or removed test infrastructure merely because historical files mention them.

## Verification and release

Run `yarn install --immutable`, `yarn typecheck`, `yarn lint`, `yarn build`, `yarn size`, and `yarn pack --dry-run`. Inspect the tarball manifest and confirm each `exports` target exists. Publishing requires a deliberate semantic version and registry verification; record the resulting version and commit. Public docs use their own build, browser, Pages, and live URL gates.

Context optimization is complete for this pass. Do not repeat before 2026-11-19 unless the owner requests it, the tree changes materially, a hard cap is breached, or a stale instruction can cause wrong work.
