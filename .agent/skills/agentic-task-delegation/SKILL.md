---
name: agentic-task-delegation
description: Coordinate dependency-aware work across specialist agents. Use this when planning parallel tasks, spawning subagents, handing off context, or resolving file ownership conflicts.
compatibility: Works with Agent Skills-compatible hosts. Host-native subagent execution is required for true parallel delegation; MCP tools persist task state and evidence.
---

# Agentic Task Delegation

## Task graph
Represent work as a directed acyclic graph. A task may start only when all dependency tasks are completed. Claim tasks before delegation.

## Delegation process
1. Read the task and project context.
2. Decompose by independently verifiable outcomes, not by arbitrary file count.
3. Identify dependencies and shared-file conflicts.
4. Assign one owner role per task and explicit write ownership.
5. Group independent tasks into parallel batches.
6. Send each subagent a bounded context packet.
7. Collect structured results and evidence.
8. Run integration and regression checks.

## Subagent output contract
Return JSON or a clearly structured message with `taskId`, `status`, `summary`, `changedFiles`, `decisions`, `testsRun`, `evidenceIds`, `risks`, and `nextDependencies`.

## Do not
- spawn an agent for work that takes less effort than coordination;
- duplicate tasks already claimed or completed;
- allow multiple writers to edit shared architecture or token files concurrently;
- ask an implementation agent to approve its own patch;
- treat a subagent's verbal claim as evidence.
