# Implementation and Verification Status

## Implemented in this starter

- Clean Architecture domain, application, infrastructure and MCP interface layers.
- MCP stdio server exposing 20 tools, 6 read-only resources and 1 workflow prompt.
- 70-module capability catalog, 7 reference categories, and 36 source records with verification provenance.
- 21 portable Agent Skills using the `SKILL.md` format.
- Principal Development rulebook and 12 project contract templates for design, components, responsive, UI acceptance, typography, color, motion, 3D, accessibility, content and architecture.
- Agent role registry (19 roles) and host-native delegation contract, including conditional Three.js QA.
- Dependency-aware task DAG, task claiming, evidence records, repair budget, checkpoints and quality gate.
- Reopen cascade and conservative checkpoint invalidation when a task is reopened.
- Generated Markdown checklist containing tasks, quality checkpoints and evidence metadata.
- Local dev-server supervisor restricted to package scripts `dev`, `start` and `preview`.
- Localhost-only browser navigation, responsive viewport inspection, screenshots, DOM overflow/out-of-bounds metrics, browser errors and interaction scenarios; conditional Three.js rendering/shader/lifecycle checkpoint.
- Workspace path guard and explicit browser destructive-action opt-in.
- Example host configuration for VS Code and Cursor, plus Claude Code setup instructions.

## Not implemented as an automatic capability

- MCP does not create or run LLM subagents. The host must call its native agent delegation feature.
- No LLM provider is selected. Planning and subagent reasoning are host-owned.
- No automatic semantic screenshot vision model is bundled. The host's multimodal agent should inspect saved screenshots and return evidence.
- No axe-core integration is bundled yet. Accessibility review is guided by Skill instructions and browser evidence.
- Chromium is the only Playwright browser adapter currently implemented.
- The browser navigation guard is not a complete OS network sandbox. Browser subresources can still request external origins.
- JSON state storage is single-MCP-process only. Multi-process usage needs a transactional database and distributed claim locking.
- Agent approval, secrets isolation, production deployment and external side effects remain host/operator-controlled.

## Verification performed in this build environment

- Catalog validator: passed (70 modules, 36 sources, 7 categories, 21 Skills, 19 roles).
- TypeScript source and test compilation against temporary ambient declarations: passed. This validates project-owned source syntax and internal type flow but does not validate the real installed MCP SDK, Zod or Playwright package declarations.
- Node test suite compiled and executed from temporary output: passed (29 tests).
- Package installation and real dependency build: blocked because npm registry DNS failed with `EAI_AGAIN registry.npmjs.org`.
- Playwright Chromium launch and live localhost inspection: not run because the Playwright package and browser binary could not be installed in this environment.

## First-run checklist

1. Run `npm install` from the project root.
2. Run `npx playwright install chromium`.
3. Run `npm run check`.
4. Configure the MCP host to launch `dist/src/index.js`.
5. Set `HARNESS_WORKSPACE_ROOT` to the target application root.
6. Verify the server appears in the MCP host and run `harness.list_modules` and `harness.list_skills`.
7. Create a test plan, start the local dev server, then run responsive inspection against localhost.


## Follow-up patch: MCP optional input normalization

- Added `src/interfaces/mcp/input-normalizers.ts` to translate Zod/MCP transport values into strict application/domain inputs by omitting undefined optional properties.
- Updated `harness.create_execution_plan` to normalize `domains` and `maxRepairIterations` before calling `TaskService`.
- Updated `localhost.run_interaction_scenario` to normalize optional action `value` and `timeoutMs` before calling the browser port.
- Added four regression tests covering absent and provided optional values.
- Patch verification in the authoring environment: isolated TypeScript compilation with `strict` and `exactOptionalPropertyTypes` passed; 4 normalization tests passed; catalog validation passed. Full dependency-backed `npm run check` could not be rerun here because npm dependency installation timed out.
