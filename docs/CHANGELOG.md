# Changelog

## Unreleased

### Fixed

- Normalize optional MCP/Zod input properties before passing them into strict application and domain contracts. This fixes TypeScript `TS2379` and `TS2322` errors under `exactOptionalPropertyTypes`.
- Add regression tests for omitted and explicitly provided optional plan and interaction-action properties.

### Engineering decision

- Keep `exactOptionalPropertyTypes: true`. The adapter omits absent properties instead of weakening domain contracts or disabling strict compiler checks.
