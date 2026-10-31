---
name: frontend-implementation
description: Implement responsive frontend features using the repository's framework, design system, accessibility rules, and maintainable architecture.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Frontend Implementation

1. Discover the framework and existing design system; do not introduce another component library without a decision record.
2. Implement semantic HTML and accessible components using the project's conventions.
3. Follow route, domain, and feature boundaries. Keep state near its owner and avoid unnecessary global state.
4. Use existing semantic tokens. Avoid arbitrary hardcoded colors, spacing, radius, and typography.
5. Handle loading, empty, error, disabled, focus, hover, active, and success states.
6. Make layouts responsive without relying on a handful of fixed viewport widths.
7. Use stable keys, cleanup effects/listeners, and avoid avoidable re-renders.
8. Add tests for behavior and regression-sensitive states.
9. Start the development server and inspect actual localhost output with the browser QA Skill.
10. Report changed files, test commands, runtime evidence, and unresolved issues.
