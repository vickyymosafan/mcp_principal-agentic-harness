# Agent Runtime and Delegation Contract

## Runtime boundary

The MCP server persists and validates task state. It does not create LLM sessions. The MCP host is responsible for invoking its native subagent mechanism. A custom host adapter may be added later through an application port, but provider-specific orchestration must not enter domain services.

## Principal Orchestrator responsibilities

1. Read `AGENTS.md`, the relevant project contracts, and repository context.
2. Classify the request, affected domains, risk and required evidence.
3. Create one execution plan through `harness.create_execution_plan`.
4. Poll `harness.get_ready_tasks`; do not delegate tasks whose dependencies are incomplete.
5. Claim each task before delegation.
6. Build a task packet containing objective, scope, owner role, Skill IDs, module IDs, dependencies, allowed tools, acceptance criteria, prohibited actions, and evidence requirements.
7. Spawn independent ready tasks using the host's native subagent runtime. Apply bounded concurrency from `HARNESS_MAX_PARALLEL_TASKS`.
8. Require each worker to return changed paths, decisions, test results, evidence IDs, risk and unresolved work.
9. Integrate changes through an explicitly assigned integration owner. Do not allow concurrent agents to write the same files.
10. Complete the task only after its evidence exists. Record failures and blocked reasons honestly.
11. Run independent verification. The implementation worker must not be the sole verifier of its own patch.
12. Reopen downstream tasks and invalidate quality checkpoints when source changes invalidate prior work.
13. Evaluate the final gate and prepare a decision packet. Deployment and destructive side effects require explicit authorization.

## Parallel execution policy

Parallel work is allowed only if:

- all task dependencies are complete;
- file and resource ownership do not overlap;
- the task packet carries the same approved design and architecture contracts;
- each worker has a bounded tool and time budget;
- merge/integration has a designated owner;
- affected regression tests run after integration.

If any condition fails, serialize the work.

## Subagent fallback

When the host does not expose native subagent spawning, the Principal Orchestrator executes ready tasks sequentially. The task graph, Skill registry, evidence contract, quality checkpoints and repair budget remain the same. Do not simulate parallelism by claiming that multiple agents ran.

## Task packet schema

```json
{
  "planId": "uuid",
  "taskId": "uuid",
  "ownerRole": "frontend-developer",
  "objective": "Implement the assigned workstream",
  "scope": { "include": ["src/features/example"], "exclude": ["database/migrations"] },
  "dependencies": [],
  "skillIds": ["frontend-implementation"],
  "moduleIds": [2, 19, 21, 57],
  "allowedTools": ["repository.read", "repository.patch", "runtime.test"],
  "acceptanceCriteria": ["..."],
  "requiredEvidence": ["test-report", "build-log"],
  "prohibitedActions": ["deploy", "modify production data"]
}
```

The packet is an instruction contract, not a grant of permissions. The host and MCP server must enforce permissions separately.
