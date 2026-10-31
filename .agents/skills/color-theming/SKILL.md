---
name: color-theming
description: Create and verify semantic color systems, algorithmic palettes, light/dark themes, color contrast, and gamut behavior.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Color & Theming

1. Extract current brand colors and existing tokens before proposing a palette.
2. Separate primitive/reference colors, semantic tokens, and component usage.
3. Use semantic roles such as surface, text, border, primary, success, warning, danger, and focus.
4. Prefer OKLCH for perceptually-oriented ramps when supported by the product's browser and build targets; validate gamut and fallback output.
5. Design light and dark schemes independently and test every foreground/background pair.
6. Verify WCAG 2.2 contrast with the rendered colors: normal text 4.5:1, large text 3:1, and required non-text UI information 3:1.
7. Never communicate status using color alone.
8. Test gradients, overlays, opacity, charts, disabled states, focus rings, selection, and images.
9. Keep the project palette free of pink. Preferred families: charcoal, black, gray, white, navy, blue, sage, earthy green, brown, cream; lime/orange as justified accents.
10. Do not call a palette accessible until relevant pairs are measured and evidence is recorded.
