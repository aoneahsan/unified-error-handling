# Contributing to unified-error-handling

Thanks for considering a contribution. This document covers how the repository is governed, how to set it
up, and what a change needs to satisfy before it can merge.

## Governance

`main` is protected. Every change — including the maintainer's — lands through a pull request that has:

- at least one approving review,
- a green CI check,
- no force-push and no branch deletion.

Only a repository admin can bypass those rules, and that exists for release mechanics, not for skipping
review.

### Becoming a contributor

**Anyone can contribute without any access at all**: fork the repository, push a branch to your fork, and
open a pull request. This is the normal path and it needs no permission.

If you expect to contribute regularly, you can request collaborator (write) access by opening a
[Contributor access request](https://github.com/aoneahsan/unified-error-handling/issues) issue or emailing
[aoneahsan@gmail.com](mailto:aoneahsan@gmail.com). Access is granted at the maintainer's discretion. Note
that **write access still cannot push to `main`** — review is always required.

## Setup

The project uses Yarn. Node must satisfy the `engines` field (see `.nvmrc`).

```bash
nvm use
yarn install
```

| Command | What it does |
|---|---|
| `yarn build` | Clean, then emit ESM, CJS and type declarations into `dist/` |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn lint` | ESLint over the repository |
| `yarn format` | Prettier write |
| `yarn size` | Check the bundles against their size budgets |

## Project layout

```
src/adapters/   one file per error-tracking service, plus the base class and the custom adapter
src/store/      the singleton error store — capture, context, breadcrumbs, dispatch
src/react/      hooks, the error boundary and the higher-order components
src/config/     defaults, validation and merging
src/utils/      error enrichment, console and network interceptors
examples/       runnable examples
dist/           build output (published; not committed)
```

The package has two entry points: `src/index.ts` (core) and `src/react/index.ts` (the React layer). Both are
declared in the `exports` map, and every target in that map must exist in `dist/` after a build.

## Adding an adapter

1. Create `src/adapters/<name>-adapter.ts` extending `BaseAdapter`.
2. Load the vendor SDK through `this.dynamicImport('<sdk-package>')` — never add it as a dependency.
3. Throw a clear error when required config is missing, and preserve the original failure with
   `{ cause }` when an SDK import fails.
4. Register it in the `loadAdapter` switch in `src/adapters/index.ts` and in `loadBuiltInAdapter` in
   `src/store/error-store.ts`.
5. Document it in the README adapter table and on the documentation site.

## Standards

- **TypeScript throughout.** No new `any` on a public signature.
- **No runtime dependencies.** The core must stay dependency-free; vendor SDKs load dynamically.
- **Conventional Commits** — `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.
- **No dead code.** Delete it rather than renaming or commenting it out.
- **Honest documentation.** If a feature has a limitation, say so in the README's Limitations section.

## Before you open a pull request

```bash
yarn typecheck && yarn lint && yarn build
```

All three must pass with no errors. If your change affects the published surface, also confirm that every
`exports` subpath resolves to a file that exists in `dist/`, and add a `CHANGELOG.md` entry under a new
version heading following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Reporting a bug

Open an issue at
[github.com/aoneahsan/unified-error-handling/issues](https://github.com/aoneahsan/unified-error-handling/issues)
with the package version, the adapter involved, a minimal reproduction, and what you expected instead.
Known open defects are listed in [`docs/REPORTED-ISSUES.md`](./docs/REPORTED-ISSUES.md) — please check there
first.

## Support

If this package saves you time, you can support its maintenance at
[aoneahsan.com/payment](https://aoneahsan.com/payment?project-id=unified-error-handling&project-identifier=unified-error-handling).

## License

By contributing, you agree that your contributions are licensed under the MIT License, the same as the
project.
