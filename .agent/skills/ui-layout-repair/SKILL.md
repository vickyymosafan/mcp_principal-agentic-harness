---
name: ui-layout-repair
description: Inspect and repair layout defects using screenshots, DOM measurements, design contracts, and minimal maintainable patches.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# UI Layout Repair

1. Start from a reproducible route, viewport, screenshot, and DOM measurement.
2. Classify the defect: container sizing, grid/flex constraints, overflow, typography, intrinsic media, sticky/fixed positioning, z-index, or content length.
3. Trace the issue to the owning component/token rather than adding arbitrary page-specific overrides.
4. Keep a single writer per file. Coordinate shared component changes through the implementation lead.
5. Apply the smallest coherent patch.
6. Re-run the failing case plus relevant route/viewport regressions.
7. Inspect both screenshot and DOM metrics.
8. Update the finding with root cause, changed files, evidence, and residual risk.
