# ADR 0003: Clean Architecture and provider boundaries

- Status: Accepted
- Decision: Domain and application logic remain independent from MCP SDK, Playwright, process runners, and model provider SDKs.

## Consequences
- Ports define required capabilities.
- Infrastructure adapters implement those ports.
- A new model provider must be added as an adapter and cannot leak provider types into domain models.
