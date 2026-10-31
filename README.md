# Principal Agentic Engineering Harness

A Clean Architecture MCP + Agent Skills starter for multi-agent software engineering, project governance, and evidence-backed localhost UI/UX repair.

## What is included

- MCP server using the official TypeScript SDK v2 (`@modelcontextprotocol/server`).
- 70-module capability catalog and 7 design reference categories.
- 21 canonical Agent Skills under `.agents/skills/` using the Agent Skills `SKILL.md` format.
- 19 specialist/lead role definitions, a 70-module capability catalog, and reference provenance.
- Principal Development principles and 12 copy-ready project contract templates.
- Dependency-aware task DAG with host-delegated parallel subagents.
- Persistent task state, evidence registry, and PASS/FAIL/BLOCKED quality checkpoints.
- Local development server supervisor for allowlisted `dev`, `start`, and `preview` package scripts.
- Playwright localhost browser inspection with 13 responsive viewport profiles, screenshots, DOM overflow metrics, browser errors, and interaction scenarios.
- Conditional Three.js QA task and required 3D rendering checkpoint for Three.js projects.
- Workspace path guard and localhost-only navigation policy.

## Important runtime boundary

The MCP server does not contain or impersonate an LLM. It exposes tools, task state, Skill metadata, browser inspection, and evidence operations to an MCP host. The host model (Claude Code, Cursor, VS Code, OpenCode, or a custom host) decides when to call tools and must use its native subagent feature to spawn actual parallel LLM workers. If the host has no subagent capability, tasks can still be executed sequentially through the same task graph.

This separation keeps model/provider choice outside domain logic and prevents fake claims that a server can spawn agents without a configured runtime.

## Requirements

- Node.js 22.12 or newer.
- npm, pnpm, yarn, or bun.
- A host that can connect to an MCP server over stdio.
- Playwright Chromium browser installed for localhost inspection.

## Setup

```bash
npm install
npx playwright install chromium
npm run build
npm test
npm run validate:catalog
```

Configure the variables from `.env.example` in your MCP host environment. The harness does not load `.env` files automatically. Set `HARNESS_WORKSPACE_ROOT` to the project being inspected. The default is the current working directory of the MCP process.

## Run the MCP server

```bash
npm start
```

The MCP server exposes tools, one orchestration prompt, and read-only resources (`harness://architecture`, `harness://development-principles`, `harness://modules`, `harness://references`, `harness://agent-roles`, `harness://runtime-config`). It uses stdio. Protocol messages use stdout; diagnostic logs use stderr. Do not add `console.log` to the server runtime.

## MCP host configuration

Build first, then use one of the example host configurations in `configs/hosts/`. The `cwd` must be the project you intend to inspect, while the command points to this harness installation. Set `HARNESS_WORKSPACE_ROOT` explicitly when the MCP process working directory differs from the target project.

For Claude Code, a local registration command is documented in `docs/HOST_INTEGRATION.md`.

## Agent Skills

Canonical Skills live under `.agents/skills/`. Hosts may use different discovery directories. Copy Skills to a host-specific folder when needed:

```bash
npm run skills:sync -- claude
npm run skills:sync -- cursor
npm run skills:sync -- antigravity
```

The sync script copies, it does not create symlinks or delete other Skill files.

## Localhost responsive workflow

1. The host creates an execution plan with `harness.create_execution_plan`.
2. The host delegates dependency-ready tasks to native subagents.
3. A local `dev` script is started with `localhost.start_dev_server` or by the developer.
4. The browser QA agent calls `localhost.inspect_responsive` with the localhost base URL and route list.
5. The tool saves a JSON report and screenshots under `.harness/evidence/`.
6. Findings are delegated to a repair agent with file ownership and reproduction evidence.
7. The browser QA agent reruns the failing cases and affected regression profiles.
8. The orchestrator records evidence and updates the responsive checkpoint only after PASS. Each checkpoint update regenerates `.harness/checklists/<planId>.md` so the completed dimension is documented automatically.
9. Continue through remaining quality dimensions and evaluate the final gate.

See `docs/LOCALHOST_QA.md` for detailed acceptance rules, `docs/PRINCIPAL_DEVELOPMENT.md` for engineering rules, and `docs/templates/project-contracts/` for project contract templates.

## MCP tools

- `harness.create_execution_plan`
- `harness.get_execution_plan`
- `harness.get_ready_tasks`
- `harness.claim_task`
- `harness.complete_task`
- `harness.record_evidence`
- `harness.update_quality_checkpoint`
- `harness.evaluate_quality_gate`
- `harness.increment_repair_iteration`
- `harness.invalidate_checkpoints`
- `harness.reopen_task`
- `harness.list_modules`
- `harness.list_skills`
- `localhost.discover_routes`
- `localhost.wait_for_ready`
- `localhost.start_dev_server`
- `localhost.get_server_status`
- `localhost.stop_dev_server`
- `localhost.inspect_responsive`
- `localhost.run_interaction_scenario`

## Troubleshooting TypeScript optional-property errors

The MCP adapter normalizes optional transport fields before passing them into application/domain contracts. Keep `exactOptionalPropertyTypes` enabled. If you see errors about `domains`, `maxRepairIterations`, `value`, or `timeoutMs` being `T | undefined`, make sure these files are present from the current patch:

- `src/interfaces/mcp/input-normalizers.ts`
- `src/interfaces/mcp/server.ts`
- `tests/mcp-input-normalizers.test.ts`

Do not fix this by disabling `exactOptionalPropertyTypes`; absent properties must be omitted at the adapter boundary.

## Known limitations in this first implementation

- Agent spawning is host-native, not performed by the MCP server itself.
- Responsive inspection is browser-emulated; it cannot prove behavior on every physical device.
- Layout, visual design, typography, motion, accessibility, and performance still require dedicated Skill-driven browser analysis. The current Playwright adapter provides baseline evidence and interaction tooling, not a universal visual-quality oracle.
- The browser adapter currently targets Chromium. Add Firefox/WebKit projects when the target support matrix requires them.
- The project must be installed and built before the MCP host can launch `dist/src/index.js`.
