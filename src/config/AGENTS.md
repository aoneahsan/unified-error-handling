# src/config/ — AGENTS.md

> Last Updated: 2026-04-03

## Configuration System Rules for AI Agents

### Module Structure
| File | Purpose |
|------|---------|
| `defaults.ts` | Default configuration values |
| `validator.ts` | Validates user config against schema |
| `merger.ts` | Deep merges user config with defaults |
| `support.ts` | Configuration support helpers |
| `index.ts` | Barrel exports |

### Config Validation Rules
- All user config must pass validation before merging with defaults
- Invalid config throws descriptive errors with the invalid field name
- Never silently ignore invalid config — fail fast
- Validate adapter names, error levels, callback types

### Merging Strategy
- User config overrides defaults (shallow top-level, deep nested)
- `undefined` in user config = keep default; `null` = clear default
- Arrays are replaced, not merged

### Adding New Config Options
1. Default in `defaults.ts` -> 2. Validation in `validator.ts` -> 3. Type in `src/types/config.ts` -> 4. Update `docs/guides/configuration.md`

### CLAUDE.md + AGENTS.md Sync Rule
Every rule in this file must also exist in `src/config/CLAUDE.md` and vice versa. Update both together.


## Sub-agents & Skills — Main-Context-First (IRON-SOLID)
Default/built-in sub-agents (`general-purpose`, `Explore`, `Plan`, `claude`, `fork`, …) do NOT have
access to `/skills`, so delegating to them silently SKIPS the skills RULE #0 requires. Do all
skill-relevant work in the **MAIN context**; use a sub-agent ONLY when a **custom** agent exists in
`.claude/agents/` for that job; a default `Explore`/`Plan` agent is allowed ONLY for read-only,
no-skill search/exploration. When a relevant skill is missing, **install/enable it** rather than
proceeding skill-less. (Owner directive 2026-07-11; full text in `~/.claude/CLAUDE.md`.)
