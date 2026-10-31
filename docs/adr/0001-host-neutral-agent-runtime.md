# ADR 0001: Host-neutral agent runtime

- Status: Accepted
- Decision: MCP provides task state, tools and evidence; the MCP host owns the model loop and native subagent spawning.

## Context
MCP is a protocol for connecting model hosts to tools/resources/prompts. It does not itself provide a universal model runtime or portable API for spawning subagents.

## Consequences
- The core remains provider-neutral.
- True parallel subagents require a host with native delegation support.
- Host adapters can be added behind explicit interfaces without putting provider SDKs in domain logic.
- Sequential fallback remains available.
