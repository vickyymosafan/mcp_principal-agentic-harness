# Host Integration

## Build

```bash
npm install
npx playwright install chromium
npm run build
```

## VS Code / Copilot

Use `.vscode/mcp.json` after copying `configs/hosts/vscode.mcp.json` into the workspace. Update the absolute path to this harness installation if the workspace and harness are separate. Set `HARNESS_WORKSPACE_ROOT` to the target project directory.

## Cursor

Use `.cursor/mcp.json` with the same `node dist/src/index.js` command. Set `HARNESS_WORKSPACE_ROOT` explicitly.

## Claude Code

From the target project directory:

```bash
claude mcp add principal-harness -- node /absolute/path/to/principal-agentic-engineering-harness/dist/src/index.js
```

Configure environment variables in the host configuration or launch environment. Check `/mcp` to verify that the server is connected.

## OpenCode and other MCP hosts

Register a stdio server using:
- command: `node`
- args: `[/absolute/path/to/principal-agentic-engineering-harness/dist/src/index.js]`
- environment: `HARNESS_WORKSPACE_ROOT=/absolute/path/to/target/project`

Exact configuration file shape depends on the host version. Consult its current MCP configuration docs.

## Skills discovery

Canonical Skills are under `.agents/skills/`. If a host uses a different discovery folder, run:

```bash
npm run skills:sync -- claude
npm run skills:sync -- cursor
npm run skills:sync -- antigravity
```

Check the host documentation for its exact Skill discovery path before copying.

## True multi-agent execution

The MCP server persists tasks and gates; it does not spawn LLM sessions. The principal agent must use the host's native subagent feature to run tasks returned by `harness.get_ready_tasks`. If no native delegation API is available, perform tasks sequentially through the same contracts. Do not claim parallel subagents ran unless the host actually spawned them.
