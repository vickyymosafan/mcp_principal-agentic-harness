---
name: clean-architecture-development
description: Implement and refactor software using dependency inversion, cohesive modules, bounded responsibilities, and maintainable change boundaries.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Clean Architecture Development

## Dependency direction
- Domain contains business rules and types. It must not import frameworks, MCP SDKs, Playwright, filesystem adapters, or provider SDKs.
- Application contains use cases and orchestrates domain ports.
- Infrastructure implements ports using filesystem, browser, process, database, or external SDK adapters.
- Interfaces expose MCP tools, CLI handlers, HTTP routes, and host adapters.

## Clean code rules
- Prefer explicit types, small functions, meaningful names, and cohesive modules.
- Keep side effects at infrastructure boundaries.
- Validate external input at interfaces.
- Avoid hidden global state and ambient mutable singletons.
- Avoid redundant wrappers, speculative abstractions, premature generalization, and duplicate sources of truth.
- Do not change unrelated code to satisfy personal style preferences.
- Preserve backward compatibility unless the task explicitly authorizes a breaking change.
- Add tests at domain and application boundaries; add integration tests for adapters.

## Change protocol
Inspect -> plan -> implement smallest coherent patch -> typecheck -> test -> inspect diff -> update evidence and docs.
