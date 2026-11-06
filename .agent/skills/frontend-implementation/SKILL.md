---
name: frontend-implementation
description: Implement responsive, high-craft frontend features using Clean Architecture, modern Bento layouts, micro-interactions, accessibility rules, and maintainable state boundaries.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Frontend Implementation (High-Craft Production Standards)

## Core Philosophy: High Aesthetic Polish + Clean Architecture
Clean Architecture and anti-slop rules are the architectural foundation, **NEVER an excuse for dry, lifeless, boring B2B gray boxes**. Production web interfaces must match the sensory polish of leading digital products (Linear, Stripe, Apple Pro, Vercel) while maintaining strict semantic accessibility, zero overflow, and modular maintainability.

---

## 1. Asymmetrical Bento Grid Architecture
Avoid repetitive identical card grids. Structure high-impact interfaces using 12-column asymmetric Bento grids:
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1.25rem;
}

/* Feature hierarchy spans */
.col-featured { grid-column: span 7; }
.col-compact  { grid-column: span 5; }
.col-full     { grid-column: span 12; }

@media (max-width: 900px) {
  .col-featured, .col-compact { grid-column: span 12; }
}
```

---

## 2. Micro-Interactions & Ambient Lighting
Bring static cards to life through subtle, physics-driven interactions:
1. **Cursor-Tracking Glow:** Add dynamic radial gradient highlights that track mouse movement on card hover:
   ```css
   .bento-card:hover {
     border-color: rgba(52, 211, 153, 0.35);
     transform: translateY(-2px);
     box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
   }
   ```
2. **Spring-Like Micro-Transforms:** Use snappy cubic-bezier curves for buttons and interactive controls:
   ```css
   transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
   ```
3. **Pulsating Live Beacons:** Use soft keyframe scale/opacity loops on status indicators to communicate active runtime state.

---

## 3. Real-Time Canvas & Data Visualizations
Instead of static filler text or fake stock charts, embed live, lightweight canvas visualizers:
- **Telemetry Oscilloscopes:** Animate smooth sine-wave canvas waveforms (e.g., p99 latency streams) capped at 60 FPS.
- **Interactive Node Maps:** Provide clickable cluster or service mesh cards that update active diagnostics without full page reloads.
- **Tabbed Clean Syntax Terminals:** Offer multi-language code tabs (TypeScript, Go, Rust) with distinct syntax highlighting and copy buttons.

---

## 4. Accessible Dark-Mode Glassmorphism
When using translucent panels and backdrop blur:
- Maintain **WCAG AAA contrast ($\ge 12:1$)** for body text and headers against the blended surface.
- Never place low-contrast gray text on semi-transparent white cards.
- Always provide high-visibility keyboard focus rings:
  ```css
  :focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 3px;
  }
  ```
- Guarantee minimum touch target dimensions of $44 \times 44\text{px}$ on all interactive buttons and links.

---

## 5. Architectural Boundaries & State Colocation
- Keep business logic in `src/domain/` or `src/application/` use-case ports.
- UI components in `src/interfaces/` or `src/frontend/` must only adapt domain entities, never reinvent validation rules inside `onClick` handlers.
- Co-locate component-scoped state near its DOM consumer. Avoid global state stores for transient UI states (e.g., open dropdowns, tab indices).

---

## Verification Evidence
1. **0px Horizontal Overflow:** Verify via `localhost.inspect_responsive` across all 13 standard viewport profiles (320px–1920px).
2. **Zero Console Errors:** Zero unhandled promise rejections or deprecated API warnings in browser inspector logs.
3. **Evidence Artifacts:** Record full-page screenshots and responsive JSON summaries under `.harness/evidence/`.
