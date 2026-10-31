---
name: local-development-runtime
description: Start, monitor, and stop a local development server safely so browser agents can inspect the built application.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Local Development Runtime

1. Confirm the configured workspace root and inspect `package.json`.
2. Start only an existing allowlisted `dev`, `start`, or `preview` script through `localhost.start_dev_server`.
3. Never construct arbitrary shell commands or run untrusted install/postinstall actions.
4. Read process status and bounded logs; determine the actual local URL from project output or user-provided configuration.
5. Confirm readiness before browser navigation.
6. Use only localhost/loopback URLs. Never follow a redirect to an external origin.
7. Do not expose secrets in logs or screenshots.
8. Stop only processes started by the harness.
9. If the browser runs in another container, validate the network path; `localhost` inside a browser container may refer to that container rather than the development host.
