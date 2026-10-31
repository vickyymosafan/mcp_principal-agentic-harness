---
name: motion-animation
description: Plan, implement, audit, and optimize purposeful animation, interaction physics, gesture behavior, reduced motion, and frame performance.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Motion & Animation

1. Identify purpose before proposing animation: feedback, spatial continuity, state change, explanation, or product personality.
2. Define motion tokens for duration, easing, spring, stagger, and reduced-motion behavior.
3. Match motion to product identity and interaction frequency.
4. Support interruption, reversal, and state consistency for gesture-driven interactions.
5. Prefer transform and opacity where appropriate; profile actual rendering instead of assuming a property is cheap.
6. Respect `prefers-reduced-motion`; provide a meaningful non-motion path.
7. Prevent animation from blocking input, hiding content, or creating unexpected layout shifts.
8. Test entrance, exit, loading, error, empty, focus, hover, active, and disabled states.
9. Verify on low-end/mobile devices where relevant and capture frame/runtime evidence.
10. Remove animation that has no measurable UX or product purpose.
