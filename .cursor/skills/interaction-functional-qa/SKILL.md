---
name: interaction-functional-qa
description: Test functional UI behaviors in a local browser using explicit scenarios and safe interaction steps.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Interaction & Functional QA

1. Derive scenarios from requirements and component contracts.
2. Cover initial, loading, empty, populated, error, disabled, success, focus, hover, and active states where applicable.
3. Use `localhost.run_interaction_scenario` with explicit selectors and bounded actions.
4. Prefer role/label/test-id selectors over brittle positional CSS selectors.
5. Do not trigger payment, deletion, external submission, email, logout, or other destructive side effects unless `allowRiskyActions` is explicitly approved and the environment is isolated.
6. Verify navigation destination, expected state changes, keyboard interactions, and form validation.
7. Record screenshots, step outcomes, console errors, and any setup assumptions.
8. A visible control is not functional until its actual behavior is verified.
