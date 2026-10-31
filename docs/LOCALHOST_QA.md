# Localhost Browser QA and Autonomous Repair

## Purpose
Inspect the website that has actually been built, interact with it in a browser, identify defects, delegate root-cause repair, and verify the repair before moving to the next quality dimension.

## Responsive-first rules

- Test every route in scope, not only `/`.
- Default viewport profiles: 320x740, 360x800, 375x812, 390x844, 414x896, 430x932, 768x1024, 844x390, 1024x768, 1280x800, 1366x768, 1440x900, 1920x1080.
- Test relevant portrait/landscape states and widths immediately below/above actual breakpoints.
- Add browser/device profiles based on the project's support policy.
- Treat document-level horizontal overflow as a failure unless a specific intentional interaction is documented.
- Inspect text wrapping, media sizing, navigation, sticky/fixed elements, form controls, canvas and touch interactions.
- Inspect screenshots and DOM metrics together. A screenshot alone cannot prove function.

## Repair cycle

1. Capture failing route, viewport, screenshot, DOM metrics and runtime errors.
2. Deduplicate findings and find the shared root cause.
3. Assign an implementation agent explicit file ownership and acceptance criteria.
4. Apply the smallest coherent patch.
5. Rerun the exact failing case.
6. Rerun impacted routes and viewport profiles.
7. Review new screenshots and logs independently.
8. Record evidence and update the checkpoint.
9. If a later change can affect the dimension, invalidate and rerun it. The harness regenerates `.harness/checklists/<planId>.md` after checkpoint updates.

## Dimension queue

1. Responsive.
2. Layout and structure.
3. Functional interactions.
4. Typography and color.
5. Motion and animation.
6. 3D rendering and shader stability (conditional when the plan includes Three.js).
7. Accessibility.
8. Performance.
9. Security and reliability.
10. Final regression.

Security, privacy, and baseline accessibility controls remain active throughout development; the order above describes the final audit queue.

## Evidence requirements

Each browser report must include timestamp, run ID, base URL, route, viewport, final URL, document width, viewport width, overflow, out-of-bounds elements, console errors, page errors, failed requests, HTTP errors, screenshot path and overall result.

Store reports under `.harness/evidence/`. Do not commit sensitive screenshots or logs. Review them for secrets and personal data before sharing.

## What PASS means

- All required route/profile cases ran successfully.
- No unresolved blocking responsive issue remains.
- Each exception is documented and justified.
- All screenshots and reports refer to the current source revision/build.
- The independent verifier has rerun the affected cases.

Emulated viewport coverage does not replace physical-device testing for platform-specific behavior such as iOS Safari, GPU limits, keyboard behavior, and touch quirks.

## Conditional 3D rendering verification

When the plan includes the `threejs` domain, a dedicated `threejs-qa-agent` checks scene composition, shader compilation/runtime errors, resource disposal, deterministic scroll behavior, GPU evidence, and device fallback. The `3d-rendering` checkpoint is required only for Three.js plans.
