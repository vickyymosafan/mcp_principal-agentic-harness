---
name: typography-engineering
description: Design and audit web typography systems, including modular scales, responsive type, font loading, readability, and accessible hierarchy.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Typography Engineering

1. Inspect current typefaces, weights, licensing, glyph coverage, and existing tokens.
2. Define semantic text roles and a scale appropriate to content and brand. Modular ratios are starting points, not universal rules.
3. Validate font size, line-height, letter spacing, line length, hierarchy, and responsive behavior.
4. Prefer unitless line-height for scalable text roles; prevent headings and localized copy from overlapping.
5. Use robust system fallbacks and font-display strategies. Measure actual loading and layout shift.
6. Test long Indonesian words, mixed Indonesian/English, dates, currency, numbers, code, and diacritics.
7. Check 200% zoom, keyboard focus, semantic heading order, and text contrast.
8. Capture screenshots at narrow, medium, and wide viewports.

Do not treat recommended pixel sizes or font payload thresholds as universal acceptance rules.
