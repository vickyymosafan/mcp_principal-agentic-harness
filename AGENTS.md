# Repository Agent Contract

## Goal
Build and maintain software with Clean Architecture, Clean Code, explicit evidence, and independent quality verification.

## Source of truth
- Read `docs/ARCHITECTURE.md` before architectural changes.
- Read `docs/PRINCIPAL_DEVELOPMENT.md` and `docs/ACCEPTANCE_CRITERIA.md` before substantial changes or declaring work complete.
- Read only relevant Skills from `.agents/skills/`; do not load every Skill for every task.
- `catalogs/modules.json` is the canonical 70-module capability catalog.
- `catalogs/references.json` records design reference provenance and verification status.
- `docs/templates/project-contracts/` contains project-level contract templates; copy and tailor only those that apply.

## Architecture boundaries
- `src/domain`: entities, value objects, domain errors, and ports only.
- `src/application`: use cases and orchestration. Depend on domain ports, not adapters.
- `src/infrastructure`: filesystem, browser, process, persistence, and registry adapters.
- `src/interfaces`: MCP and host-facing interfaces.
- Skills are operational instructions, not executable business logic.

## Development rules
- Keep the domain independent from frameworks and MCP SDKs.
- Validate all tool input at the interface boundary.
- Use explicit types and narrow interfaces.
- Avoid duplicate sources of truth, speculative abstractions, dead code, broad catch-and-ignore, and unrelated refactors.
- Make filesystem changes workspace-scoped.
- Never use shell interpolation with user-provided commands.
- Do not store secrets in the repository or evidence artifacts.

## Agent collaboration
- Principal Orchestrator owns the task graph.
- Delegate only dependency-ready tasks.
- Assign explicit file ownership to parallel agents.
- Use a single integration owner for shared files.
- Independent QA must not be the same agent that authored the patch.

## UI work
- Start or identify the local development server.
- Run responsive-first browser inspection across all relevant routes and supported viewport profiles.
- Repair defects at their root cause, then rerun the failed case and affected regressions.
- Continue through layout, interaction, visual, typography/color, motion, accessibility, performance, and final regression.
- Update evidence-backed checklists. No PASS without evidence.

## Safety
- Only localhost/loopback targets are permitted by the browser inspector.
- Destructive browser interactions are blocked by default.
- Do not deploy, modify production data, or trigger external side effects without explicit authorization.
