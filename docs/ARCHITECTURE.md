# Architecture

## 1. System model

The harness is a host-neutral control and evidence layer for agentic software engineering. The MCP host owns the model loop and native subagent spawning. This repository owns the task graph, capability metadata, local browser adapter, persistent evidence, workspace safety, and quality checkpoints.

## 2. Clean Architecture

```text
Host-native Agent Runtime
          |
          v
MCP Interface (tools, prompt, read-only resources)
          |
          v
Application Use Cases
          |
          v
Domain Models + Ports
          ^
          |
Infrastructure Adapters
(JSON state, Playwright, local process, Skill registry, module registry)
```

Dependency rules:
- Domain does not import MCP SDK, Playwright, filesystem, process, or provider libraries.
- Application depends on domain models and ports.
- Infrastructure implements ports.
- MCP interface validates untrusted inputs and invokes application services.
- Skills are instruction packages and never become a second implementation of domain rules.

## 3. Agent hierarchy

- Principal Orchestrator: owns plan, DAG, budgets, delegation, synthesis and gate evaluation.
- Agent Leads: discovery, governance, architecture, design, implementation, assurance, release.
- Dynamic subagents: frontend, backend, 3D, motion, responsive QA, visual QA, functional QA, accessibility, performance and security.
- MCP: tools and evidence operations. It does not create LLM instances by itself.
- Skills: portable operating procedures selected by the orchestrator.

## 4. Task graph

Tasks are persisted with UUIDs, explicit dependencies, owner role, Skill IDs, module IDs, status, evidence IDs, and timestamps. `get_ready_tasks` returns tasks whose dependencies are all completed. `claim_task` prevents duplicate ownership in the single MCP process. Parallel workers should claim separate tasks and avoid shared write ownership.

The current JSON repository is intended for one local MCP process. Multi-process or team deployment requires a transactional database and distributed locking.

## 5. QA loop

For UI work:
1. Build and start local server.
2. Responsive-first inspection across every relevant route and supported viewport profile.
3. Repair and re-run failed profiles plus impacted regressions.
4. Layout and visual audit.
5. Functional interaction tests.
6. Typography/color and motion review.
7. Accessibility and performance checks.
8. Security/reliability and final regression.
9. Evidence-backed quality gate.

A later patch invalidates any affected evidence and reopens affected checkpoints.

## 6. Evidence model

Evidence records capture plan/task, kind, title, description, relative path or URI, metadata, creator and timestamp. Browser evidence includes the report path, run identifier, viewport results, screenshots, and failure details.

`PASS` requires at least one evidence record. `NOT_APPLICABLE` requires a rationale. A final release gate cannot pass while required checkpoints are pending, failed or blocked.

## 7. Development rules and project contracts

`docs/PRINCIPAL_DEVELOPMENT.md` is the engineering policy source. Project-specific contracts can be initialized from `docs/templates/project-contracts/`; only applicable templates should be copied and completed. The MCP server exposes the rulebook as the read-only resource `harness://development-principles`.

## 8. Extensibility

Add new providers through ports and infrastructure adapters. Do not place provider-specific API calls in domain or application services. Add a host adapter only when the target host has a concrete API for native subagent spawning. Add MCP tools only for operations that need model-accessible execution; static knowledge belongs in Skills or read-only Resources.
