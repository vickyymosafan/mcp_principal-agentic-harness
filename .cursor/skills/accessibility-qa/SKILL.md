---
name: accessibility-qa
description: Audit web accessibility including keyboard, semantic structure, focus, contrast, zoom, reduced motion, and assistive technology semantics.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Accessibility QA

1. Inspect semantic landmarks, heading order, form labels, names, roles, and accessible states.
2. Navigate with keyboard only. Verify visible focus, logical order, escape behavior, and no keyboard traps.
3. Verify WCAG 2.2 contrast using rendered foreground/background pairs.
4. Do not convey status by color alone.
5. Test zoom to 200% and narrow viewport reflow.
6. Test `prefers-reduced-motion` and ensure essential content remains available.
7. Inspect accessible names for icon-only controls and meaningful alternatives for images.
8. Use automated checks as a discovery aid, not as proof of full conformance.
9. Record tool/version, route, viewport, findings, evidence, and manual checks.
