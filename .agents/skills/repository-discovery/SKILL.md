---
name: repository-discovery
description: Map an unfamiliar codebase before making changes. Use for repository onboarding, source-of-truth discovery, architecture mapping, and change-impact analysis.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Repository Discovery

1. Identify package manager, runtime, framework, build scripts, test scripts, lint scripts, and workspace boundaries from actual files.
2. Locate entry points, route definitions, UI component roots, API boundaries, persistence layer, configuration, and generated files.
3. Read existing `AGENTS.md`, `README`, `DESIGN.md`, ADRs, component rules, and tests.
4. Identify generated/vendor/build directories and never edit them unless the project explicitly requires it.
5. Build a source-of-truth map with paths and reasons.
6. Record uncertainty and missing information. Do not infer facts from folder names alone.
7. Return impacted files, dependency edges, likely regression areas, existing conventions, and recommended test commands.

Use module capabilities 1, 4, 20, 39, 48, 49, 64, and 67.
