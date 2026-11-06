---
name: motion-animation
description: Plan, implement, audit, and optimize purposeful animation, interaction physics, gesture behavior, reduced motion, and 60 FPS frame performance.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Motion & Animation Engineering (Production Standards)

## Core Philosophy: Purposeful Physics & Micro-Polish
Motion must serve product usability, provide tactile feedback, and enhance visual delight. Avoid gratuitous, slow, or distracting animations that delay user interaction.

---

## 1. Modern Motion Tokens & Physics
Use snappy, modern spring-like easing curves instead of generic linear or standard CSS `ease`:
```css
:root {
  /* Premium snappy easing (Apple / Linear standard) */
  --ease-snappy: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-smooth: 400ms;
}
```

---

## 2. Interactive Micro-Interactions
1. **Button Hover & Press Feedback:**
   ```css
   .interactive-btn {
     transition: transform var(--duration-fast) var(--ease-snappy),
                 box-shadow var(--duration-fast) var(--ease-snappy);
   }
   .interactive-btn:hover {
     transform: translateY(-1px);
   }
   .interactive-btn:active {
     transform: translateY(1px) scale(0.98);
   }
   ```
2. **Pulsating Beacon Status Loops:**
   ```css
   @keyframes beaconPulse {
     0%, 100% { opacity: 1; transform: scale(1); }
     50% { opacity: 0.4; transform: scale(0.8); }
   }
   ```

---

## 3. Performance & 60 FPS Frame Budget
- Stick strictly to GPU-accelerated properties: `transform` and `opacity`.
- Never animate `width`, `height`, `top`, `left`, `margin`, or `padding` in loops, as they trigger expensive layout reflows and frame drops.
- Always throttle continuous canvas animation loops (such as waveforms or 3D scenes) when the tab is hidden or element is off-screen.

---

## 4. Accessibility & Reduced Motion
Always provide an accessible fallback for users with vestibular or motion sensitivity:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
