---
name: performance-qa
description: Measure browser runtime, loading, rendering, network, memory and 3D/GPU performance with repeatable evidence.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Performance QA

1. Define target devices, network conditions, route scope, and user-critical journeys.
2. Separate build-time, network, main-thread, rendering, image/font, and GPU bottlenecks.
3. Capture baseline before optimizing.
4. Inspect console, failed requests, resource loading, long tasks, layout shifts, and frame behavior.
5. Prefer profiling evidence over blanket rules. Do not assume transform/opacity guarantees performance or that `will-change` is free.
6. For 3D, inspect draw calls, geometry, textures, shader complexity, render targets, frame time, and disposal.
7. Re-run identical conditions after the patch and compare before/after results.
8. Record browser version, device profile, throttling, commit, measurement method, and residual variance.
