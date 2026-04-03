# docs/ — AGENTS.md

> Last Updated: 2026-04-03

## Documentation Maintenance Rules for AI Agents

### Directory Structure
| Path | Purpose |
|------|---------|
| `docs/api/` | Core API and React hooks API reference |
| `docs/guides/` | Quick start, getting started, configuration |
| `docs/providers/` | Per-service setup guides |
| `docs/project-status/` | Roadmap and status tracking |
| `docs/tracking/` | Release notes and rollout tracking |
| `docs/index.md` | Documentation index |

### Rules
- Keep docs aligned with ACTUAL implemented surface — never describe unimplemented features
- New adapter = new `docs/providers/{service}.md` in the same PR
- New React feature = update `docs/api/react-hooks.md`
- Config change = update `docs/guides/configuration.md`
- API docs must include: signature, params table, return type, usage example
- Provider docs must include: installation, init, config options, troubleshooting

### Update Cadence
- API docs: when public API changes
- Guides: when user-facing behavior changes
- Provider docs: when adapter changes
- Project status: at milestones or releases

### CLAUDE.md + AGENTS.md Sync Rule
Every rule in this file must also exist in `docs/CLAUDE.md` and vice versa. Update both together.
