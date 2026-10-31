# 3D and Shader Rules

Use this contract only when a project includes Three.js, WebGL or WebGPU.

- Runtime and renderer version: TBD
- Scene units / scale convention: TBD
- Camera and navigation model: TBD
- Lighting and material system: TBD
- Asset formats, compression and loading budget: TBD
- Shader language / target profile: TBD
- GPU and memory budget by device class: TBD
- Reduced-motion and non-3D fallback: TBD

## Lifecycle
- Dispose geometries, materials, textures, render targets and listeners when no longer used.
- Handle context loss and recovery where applicable.
- Keep scene, animation and scroll state deterministic enough for reproducible inspection.

## Verification
- Capture shader compilation and runtime errors.
- Test scroll/interaction states and viewport changes.
- Record FPS/frame-time and memory evidence on supported device classes.
- Verify fallback when GPU features are unavailable or too expensive.
