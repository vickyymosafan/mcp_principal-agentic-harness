---
name: threejs-shaders
description: Implement and inspect production-grade Three.js scenes, WebGL shaders, PBR materials, dynamic procedural VFX, GPU performance, and resource lifecycle.
compatibility: Works with Agent Skills-compatible hosts and the Principal Agentic Engineering Harness MCP server.
---

# Three.js & Shader Engineering (Production Standards)

## Core Philosophy: Aesthetic Immersion with Engineering Rigor
Clean Architecture and anti-slop governance are the structural spine, **NEVER an excuse for flat, rigid, or sterile 3D wireframe mockups**. A production 3D web experience must be visually dynamic, cinematic, and responsive, with physical grounding, realistic materials, and buttery smooth 60 FPS performance.

---

## 1. PBR Pipeline, Color Space & Tone Mapping
Always configure the WebGL renderer with high-fidelity color and tone mapping standards:
```javascript
const renderer = new THREE.WebGLRenderer({
  canvas: canvasElement,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Guard against mobile 4K GPU thermal throttle
renderer.setSize(container.clientWidth, container.clientHeight);

// ACES Filmic tone mapping for realistic contrast and highlight roll-off
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Modern output color space
renderer.outputColorSpace = THREE.SRGBColorSpace;
```

---

## 2. Cinematic 3-Point Lighting Rig & Soft Shadows
Never place objects in an uncalibrated pitch-black void with flat point lights. Always build a grounded lighting environment:

1. **Shadow Map Quality:**
   ```javascript
   renderer.shadowMap.enabled = true;
   renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadow edges
   ```
2. **Directional Key Light (Primary Illumination):**
   ```javascript
   const keyLight = new THREE.DirectionalLight(0x38BDF8, 2.0); // Cool Ice Cyan or Warm Tungsten
   keyLight.position.set(12, 16, 10);
   keyLight.castShadow = true;
   keyLight.shadow.mapSize.set(1024, 1024);
   keyLight.shadow.bias = -0.0005;
   keyLight.shadow.normalBias = 0.0005; // Eliminates shadow acne on curved geometry
   scene.add(keyLight);
   ```
3. **Rim Light (Silhouette & Edge Definition):**
   ```javascript
   const rimLight = new THREE.DirectionalLight(0x10B981, 2.5); // High contrast accent from behind
   rimLight.position.set(-12, 6, -10);
   scene.add(rimLight);
   ```
4. **Internal Core Point Light (Self-Illumination / Flare):**
   When building mechanical or sci-fi energy cores, place a point light inside the object with dynamic emissive intensity.

---

## 3. Scene Grounding & Contact Occlusion
Objects must feel anchored in a real physical space:
- **Contact Shadow Plane:** Add a `ShadowMaterial` plane (`opacity: 0.4–0.6`) directly beneath the object to capture soft ground shadows.
- **Holographic Matrix Grid:** Combine standard coordinate helpers or radial sweep rings (`RingGeometry`) to communicate depth and engineering scale.

---

## 4. Materials: Realistic PBR vs. Stylized Cel-Shading
Avoid cheap default plastic `MeshPhongMaterial` with excessive specular glare. Choose between:
1. **Metallic Titanium PBR:**
   ```javascript
   const titaniumMat = new THREE.MeshStandardMaterial({
     color: 0x1E293B,
     metalness: 0.95,
     roughness: 0.15,
     roughnessMap: optionalRoughnessTexture
   });
   ```
2. **Stylized Cel / Toon Shading:**
   Use `MeshToonMaterial` with a gradient map or custom GLSL stepped thresholds for clean, non-photorealistic illustration styles.

---

## 5. Dynamic Procedural VFX & Vortex Particles
Bring scenes to life with moving procedural particle systems:
- Use `THREE.BufferGeometry` with `Float32Array` attributes (`position`, `color`).
- Animate particles using vortex/helix physics ($x = \cos(\theta) \cdot r, z = \sin(\theta) \cdot r$) where angular velocity scales with distance.
- Enable `blending: THREE.AdditiveBlending` and `depthWrite: false` for glowing energy clouds.
- Generate procedural radial soft-circle particle textures on an offscreen 2D canvas (`CanvasTexture`) to avoid external asset network dependencies.

---

## 6. Fluid Inertia Damping & Gesture Protection
- **Smooth Damping:** Never bind rotation directly to raw mouse deltas. Use linear interpolation (lerp):
  ```javascript
  currentRotY += (targetRotY - currentRotY) * 0.08;
  currentRotX += (targetRotX - currentRotX) * 0.08;
  ```
- **Mobile Gesture Protection:** Always set `touch-action: pan-y;` on the canvas element so dragging the 3D model horizontally does NOT block vertical page scrolling.
- **Non-blocking UI Overlays:** UI HUD overlays over the 3D canvas must have `pointer-events: none;`, with interactive buttons explicitly set to `pointer-events: auto;`.

---

## 7. Resource Lifecycle & GPU Governance
Never leak WebGL resources or waste mobile battery:
1. **Auto-Throttle on Tab Background:**
   ```javascript
   document.addEventListener('visibilitychange', () => {
     isRenderingActive = !document.hidden;
   });
   ```
2. **Scroll-Driven Pause:** Use `IntersectionObserver` to halt `requestAnimationFrame` when the canvas scrolls out of viewport.
3. **Exhaustive Memory Cleanup:** On route unmount or `beforeunload`:
   ```javascript
   renderer.dispose();
   scene.traverse(object => {
     if (object.geometry) object.geometry.dispose();
     if (object.material) {
       if (Array.isArray(object.material)) object.material.forEach(m => m.dispose());
       else object.material.dispose();
     }
   });
   ```

---

## Verification Evidence
- Verify 60 FPS lock with steady-state draw calls ($\le 50$).
- Confirm 0px horizontal overflow across all 13 viewport profiles via `localhost.inspect_responsive`.
- Capture full-page Playwright screenshots under `.harness/evidence/` proving scene grounding and lighting contrast.
