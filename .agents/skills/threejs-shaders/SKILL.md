---
name: threejs-shaders
description: Implement and inspect Three.js scenes, WebGL shaders, procedural effects, GPU performance, resource lifecycle, and scroll-driven 3D experiences.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Three.js & Shader Engineering

1. Inspect existing Three.js version, renderer backend, scene graph, asset pipeline, and target devices.
2. Define world scale, camera rules, material rules, lighting, environment, motion, and scene chapter boundaries before building.
3. Keep one intentional render loop and manage component/route lifecycle.
4. Dispose geometry, materials, textures, render targets, controls, and listeners when no longer used.
5. Validate shader attributes, uniforms, varyings, precision, coordinate spaces, matrix transforms, and output color space.
6. Treat shader compiler logs and WebGL errors as evidence. Test supported WebGL versions and explicit fallbacks.
7. Use instancing, LOD, compressed assets, texture atlases, and bounded post-processing when profiling justifies them.
8. Ensure scroll-driven scenes remain deterministic enough to test and do not trap normal page navigation.
9. Provide static, reduced-motion, or lower-cost fallbacks for unsupported/low-capability devices.
10. Profile GPU/frame-time and memory on representative devices. Never infer performance from desktop alone.

Source note: Three.js Fundamentals reference was not verified in the research session; verify its contents before attributing rules to it.
