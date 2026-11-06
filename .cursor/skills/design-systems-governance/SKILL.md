---
name: design-systems-governance
description: Extract, define, and enforce a single source of truth for design tokens, reusable components, variants, states, and themes.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Design Systems Governance

1. Inspect the existing repository and rendered interface before creating tokens.
2. Extract primitive tokens, semantic tokens, and component-level usage as separate layers.
3. Keep one canonical token source. Components consume semantic tokens rather than hardcoded color and spacing values.
4. Document component anatomy, variants, size, states, responsive behavior, accessibility behavior, and allowed composition.
5. Define light/dark modes independently; never assume a simple color inversion is correct.
6. Record theme ownership, token deprecation, migration, and impact.
7. Detect token drift and duplicated components.
8. Promote patterns to shared components only when repetition and semantics justify it.
9. Keep design-system changes reviewable and regression-tested.

Reference provenance: Extract DESIGN.md, Expo Design System, Theme Factory, Hue, UI UX Pro Max, Material UI Theming.
