# Manual / User-Only Tasks — unified-error-handling

> The ONE place for everything only you (the human) can do. Fixed path: `docs/MANUAL-TASKS.md`.
> Global spec: `~/.claude/rules/manual-tasks.md`.   Last updated: 2026-06-24

## ⏳ Pending manual tasks

| # | Task | Why only you | Detailed runbook | Status |
|---|------|--------------|------------------|--------|
| 1 | Publish patch release to npm (optional `2.1.2`) | `npm publish` needs your npm auth + a version decision. The 2026-06-24 pass changed source (attached `{ cause }` to SDK-load failures in 8 adapters) but did NOT bump the version or publish. Bump `package.json` version + run `yarn build && npm publish` if you want the fix released. | Root `package.json` scripts; `~/.claude/rules/publishing-compliance.md` (NPM Publishing) | ☐ Not started |
| 2 | Create the docs GitHub repo's Pages/DNS + first deploy | Deploy + DNS are user-only. The docs site repo `unified-error-handling-docs` is built and pushed. To go live: (a) GitHub repo Settings → Pages → Source: GitHub Actions (workflow already committed), OR `yarn firebase:deploy` (config already committed); (b) point DNS `unified-error-handling-docs.aoneahsan.com` at the chosen host (only ONE host owns the DNS at a time). | `unified-error-handling-docs/README.md` + `firebase.json` + `.github/workflows/deploy.yml` | ☐ Not started |
| 3 | Decide the React subpath bundle-size budget | Product/identity decision: `dist/react/index.js` is ~10.1 KB vs the 8 KB `size-limit` budget (the grown hook/HOC surface). Either raise the budget in `package.json` to reflect reality, or trim the public React surface (a breaking change). Build/typecheck/lint all pass; only `yarn size` exits non-zero. | Root `package.json` `size-limit` + `CLAUDE.md` (Current Verified State) | ☐ Not started |

## ✅ Completed manual tasks

(none yet — move rows here with the date once done)
