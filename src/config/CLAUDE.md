# src/config/ — CLAUDE.md

> Last Updated: 2026-04-03

## Configuration System Rules

### Module Structure
| File | Purpose |
|------|---------|
| `defaults.ts` | Default configuration values for all options |
| `validator.ts` | Validates user-provided config against schema |
| `merger.ts` | Deep merges user config with defaults |
| `support.ts` | Configuration support helpers |
| `index.ts` | Barrel exports |

### Config Validation Rules
- All user config must pass validation before merging with defaults
- Invalid config should throw descriptive errors with the invalid field name
- Never silently ignore invalid config — fail fast with clear messages
- Validate adapter names, error levels, and callback types

### Merging Strategy
- User config overrides defaults (shallow merge at top level, deep merge for nested objects)
- `undefined` values in user config are ignored (default preserved)
- `null` values explicitly clear the default
- Arrays are replaced, not merged

### Adding New Config Options
1. Add default value in `defaults.ts`
2. Add validation rule in `validator.ts`
3. Update merger if special merge logic needed
4. Add TypeScript type in `src/types/config.ts`
5. Update `docs/guides/configuration.md`


## Sub-agents & Skills — Main-Context-First (IRON-SOLID)
Default/built-in sub-agents (`general-purpose`, `Explore`, `Plan`, `claude`, `fork`, …) do NOT have
access to `/skills`, so delegating to them silently SKIPS the skills RULE #0 requires. Do all
skill-relevant work in the **MAIN context**; use a sub-agent ONLY when a **custom** agent exists in
`.claude/agents/` for that job; a default `Explore`/`Plan` agent is allowed ONLY for read-only,
no-skill search/exploration. When a relevant skill is missing, **install/enable it** rather than
proceeding skill-less. (Owner directive 2026-07-11; full text in `~/.claude/CLAUDE.md`.)
