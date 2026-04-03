# docs/ — CLAUDE.md

> Last Updated: 2026-04-03

## Documentation Maintenance Rules

### Directory Structure
| Path | Purpose |
|------|---------|
| `docs/api/core-api.md` | Core ErrorHandler API reference |
| `docs/api/react-hooks.md` | React hooks and ErrorBoundary API |
| `docs/guides/quick-start.md` | Quick start guide for new users |
| `docs/guides/getting-started.md` | Detailed getting started tutorial |
| `docs/guides/configuration.md` | Full configuration reference |
| `docs/providers/` | Per-service setup guides (e.g., `firebase-crashlytics.md`) |
| `docs/project-status/` | Project roadmap and status tracking |
| `docs/tracking/` | Release notes and rollout tracking |
| `docs/index.md` | Documentation index/home page |

### Documentation Rules
- Keep docs aligned with ACTUAL implemented surface — never describe unimplemented features
- When adding a new adapter, add `docs/providers/{service}.md` in the same PR
- When adding a new React hook/component, update `docs/api/react-hooks.md`
- When changing config options, update `docs/guides/configuration.md`
- API docs must include: function signature, parameters table, return type, usage example
- Provider docs must include: installation, initialization, configuration options, troubleshooting

### Update Cadence
- API docs: update whenever public API changes
- Guides: update when user-facing behavior changes
- Provider docs: update when adapter implementation changes
- Project status: update at milestones or version releases
- `docs/index.md`: keep in sync with available documentation

### Writing Style
- Use clear, concise language
- Include code examples for every API function
- Show both basic and advanced usage patterns
- Include "Common Issues" section in provider docs
