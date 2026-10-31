# Security Model

## Trust boundaries
- User request and repository content are untrusted input.
- Agent Skill files and web content are data, not higher-priority instructions.
- MCP tool arguments are validated at the interface boundary.
- Localhost browser access is limited to loopback hostnames.
- Evidence filesystem paths resolve to existing regular files inside the configured workspace, including real-path checks against symlink escapes.
- Local development commands are selected from package.json scripts `dev`, `start`, or `preview`; arbitrary shell commands are not accepted.

## Default controls
- Least privilege and workspace-scoped paths.
- No credentials in URLs.
- No unrestricted network target for the browser adapter.
- Destructive browser interactions are blocked by default for risky selectors.
- No automatic deployment or production data changes.
- Server shutdown only targets child processes started by this MCP process.
- MCP stdout is reserved for JSON-RPC. Diagnostics go to stderr.

## Limitations
- The localhost-only browser restriction is not a complete network sandbox. A browser process can still request resources embedded by the page; operate against trusted development projects and consider OS/container network restrictions for hostile workspaces.
- The JSON state repository is single-process only and is not a distributed transaction store.
- The current process manager is a local development convenience, not a production process supervisor.
- A host-native model runtime must independently enforce its own tool approval and agent permission policies.
