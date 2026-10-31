# UI Acceptance Criteria

A route is accepted only when evidence exists for each applicable criterion.

- [ ] Responsive: all supported routes and viewport profiles pass.
- [ ] Layout: hierarchy, alignment, spacing, clipping and overflow pass.
- [ ] Interaction: navigation, forms and interactive controls work.
- [ ] Typography: font, hierarchy, line length and readability are valid.
- [ ] Color: semantic tokens and required contrast are verified.
- [ ] Motion: intent, interruption, performance and reduced motion are verified when applicable.
- [ ] 3D: shader/runtime, resource lifecycle, fallback and GPU behavior are verified when applicable.
- [ ] Accessibility: keyboard, focus, semantics, zoom and assistive behavior are reviewed.
- [ ] Performance: loading, network, rendering and memory evidence is reviewed.
- [ ] Security: inputs, dependencies, permissions and exposed surfaces are reviewed.
- [ ] Regression: affected prior checks still pass.

For each result record: status, route, viewport, browser, commit/build ID, test run, evidence URI/path, reviewer and timestamp.

Allowed statuses: `PASS`, `FAIL`, `BLOCKED`, `NOT APPLICABLE`. A `PASS` without current evidence is invalid.
